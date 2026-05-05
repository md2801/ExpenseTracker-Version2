# backend/routes/auth_routes.py
# ============================================================
# Authentication endpoints:
#   POST /auth/register  — create new user account
#   POST /auth/login     — verify credentials, return JWT
#   POST /auth/logout    — log the logout event
#   GET  /auth/me        — return current user profile
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserActivity, UserRegister, UserLogin, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Helper: log an activity event ────────────────────────────
def log_activity(db: Session, user_id: int, action: str,
                 detail: str = None, ip: str = None):
    """Insert a row into user_activity for audit purposes."""
    entry = UserActivity(
        user_id=user_id,
        action=action,
        detail=detail,
        ip_address=ip,
    )
    db.add(entry)
    db.commit()


# ── POST /auth/register ───────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister, request: Request, db: Session = Depends(get_db)):
    """
    Register a new user account.
    - Checks that username and email are not already taken.
    - Hashes the password before storing.
    - Logs a REGISTER activity event.
    """
    # Check username uniqueness
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken. Please choose another."
        )
    # Check email uniqueness
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Create the user with a bcrypt-hashed password
    new_user = User(
        username=body.username,
        email=body.email,
        password=hash_password(body.password),  # NEVER store plain text
        role="user",                             # New accounts are regular users
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    log_activity(db, new_user.id, "REGISTER",
                 f"New account: {new_user.email}",
                 request.client.host if request.client else None)

    return new_user


# ── POST /auth/login ──────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token.
    - Looks up the user by email.
    - Uses bcrypt to verify the password (constant-time compare).
    - Creates a signed JWT with user_id and role in the payload.
    - Logs a LOGIN activity event.
    """
    # Find user by email
    user = db.query(User).filter(User.email == body.email).first()

    # Use the same error for wrong email OR wrong password (security best practice)
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact an administrator."
        )

    # Create JWT — payload includes user id and role for use in protected routes
    token = create_access_token({
        "sub":      str(user.id),
        "username": user.username,
        "role":     user.role,
    })

    # Audit log
    log_activity(db, user.id, "LOGIN",
                 f"Login from {request.client.host if request.client else 'unknown'}",
                 request.client.host if request.client else None)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        role=user.role,
    )


# ── POST /auth/logout ─────────────────────────────────────────
@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a logout event. The actual token invalidation happens
    client-side by deleting the token from localStorage.
    JWT is stateless — server-side blacklisting is out of scope.
    """
    log_activity(db, current_user.id, "LOGOUT",
                 "User logged out",
                 request.client.host if request.client else None)
    return {"message": "Logged out successfully."}


# ── GET /auth/me ──────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated user.
    Requires a valid Bearer token.
    """
    return current_user
