# backend/auth.py
# ============================================================
# Authentication utilities:
#   - Password hashing with bcrypt (via passlib)
#   - JWT token creation and decoding (via python-jose)
#   - FastAPI dependency for extracting the current user
# ============================================================

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User

# ── Configuration ─────────────────────────────────────────────
# In production you would load SECRET_KEY from an environment variable.
# For university assignment purposes, it is hardcoded here.
SECRET_KEY    = "expense-tracker-super-secret-key-change-in-production"
ALGORITHM     = "HS256"
TOKEN_EXPIRE_HOURS = 24   # Token valid for 24 hours

# ── Bcrypt context ────────────────────────────────────────────
# passlib handles the salting and hashing automatically
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── HTTP Bearer scheme ────────────────────────────────────────
# Tells FastAPI to expect "Authorization: Bearer <token>" header
bearer_scheme = HTTPBearer()


# ── Password helpers ──────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt. Never store plain text."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """
    Create a signed JWT containing `data` as the payload.
    Adds an expiry claim (exp) automatically.
    """
    payload = data.copy()
    expire  = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT.
    Raises JWTError if the token is invalid or expired.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ── FastAPI Dependencies ──────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency injected into protected routes.
    Extracts the Bearer token, verifies it, and returns the User ORM object.
    Raises 401 if the token is missing, invalid, or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload  = decode_token(credentials.credentials)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Confirm the user still exists in the database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that extends get_current_user.
    Additionally requires the user to have the 'admin' role.
    Raises 403 Forbidden if they do not.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user
