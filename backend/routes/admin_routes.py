# backend/routes/admin_routes.py
# ============================================================
# Admin-only endpoints:
#   GET /admin/users             — list all users
#   GET /admin/expenses          — list ALL expenses (all users)
#   GET /admin/activity          — view full activity log
#   PUT /admin/users/{id}/toggle — activate / deactivate a user
# All routes require role == "admin" (via require_admin dependency)
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Expense, UserActivity, UserResponse, ExpenseResponse, ActivityResponse
from auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── GET /admin/users ──────────────────────────────────────────
@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    db:           Session = Depends(get_db),
    _admin:       User    = Depends(require_admin),    # 403 if not admin
):
    """Return every registered user. Admin only."""
    return db.query(User).order_by(User.created_at.desc()).all()


# ── GET /admin/expenses ───────────────────────────────────────
@router.get("/expenses", response_model=List[ExpenseResponse])
def list_all_expenses(
    db:     Session = Depends(get_db),
    _admin: User    = Depends(require_admin),
):
    """
    Return every expense across all users.
    Admin uses this for the global overview dashboard.
    """
    return (
        db.query(Expense)
        .order_by(Expense.date.desc(), Expense.created_at.desc())
        .all()
    )


# ── GET /admin/activity ───────────────────────────────────────
@router.get("/activity", response_model=List[ActivityResponse])
def list_activity(
    db:     Session = Depends(get_db),
    _admin: User    = Depends(require_admin),
):
    """
    Return the full user_activity log, enriched with usernames.
    Most recent first, limited to 200 rows.
    """
    rows = (
        db.query(UserActivity, User.username)
        .join(User, User.id == UserActivity.user_id)
        .order_by(UserActivity.created_at.desc())
        .limit(200)
        .all()
    )

    # Merge username into the response schema
    result = []
    for activity, username in rows:
        item = ActivityResponse(
            id=activity.id,
            user_id=activity.user_id,
            action=activity.action,
            detail=activity.detail,
            ip_address=activity.ip_address,
            created_at=activity.created_at,
            username=username,
        )
        result.append(item)

    return result


# ── PUT /admin/users/{id}/toggle ──────────────────────────────
@router.put("/users/{user_id}/toggle", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(require_admin),
):
    """
    Toggle a user's is_active flag (activate / deactivate).
    An admin cannot deactivate themselves.
    """
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user
