# backend/routes/expenses.py
# ============================================================
# Assignment 2 — UPDATED
# All endpoints now require a valid JWT (get_current_user).
# Expenses are filtered by the authenticated user's ID.
# Activity logging added for create / update / delete.
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import (Expense, UserActivity,
                    ExpenseCreate, ExpenseUpdate, ExpenseResponse)
from auth import get_current_user
from models import User

router = APIRouter(prefix="/expenses", tags=["Expenses"])


# ── Internal helper: write to audit log ──────────────────────
def _log(db: Session, user_id: int, action: str, detail: str = None):
    db.add(UserActivity(user_id=user_id, action=action, detail=detail))
    db.commit()


# ── GET /expenses/ ────────────────────────────────────────────
@router.get("/", response_model=List[ExpenseResponse])
def get_all_expenses(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),   # JWT required
):
    """
    Return all expenses belonging to the authenticated user.
    Ordered newest first.
    """
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == current_user.id)       # ← filter by owner
        .order_by(Expense.date.desc(), Expense.created_at.desc())
        .all()
    )
    return expenses


# ── GET /expenses/{id} ────────────────────────────────────────
@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Return a single expense — only if it belongs to the current user."""
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
    return expense


# ── POST /expenses/ ───────────────────────────────────────────
@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_data: ExpenseCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Create a new expense owned by the authenticated user.
    user_id is set from the JWT — users cannot create expenses for others.
    """
    new_expense = Expense(
        **expense_data.model_dump(),
        user_id=current_user.id,   # inject from token
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    # Audit
    _log(db, current_user.id, "CREATE_EXPENSE",
         f"Created: {new_expense.title} (${new_expense.amount})")

    return new_expense


# ── PUT /expenses/{id} ────────────────────────────────────────
@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id:   int,
    expense_data: ExpenseUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Update an expense — only if it belongs to the current user."""
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")

    for field, value in expense_data.model_dump().items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    _log(db, current_user.id, "UPDATE_EXPENSE",
         f"Updated id={expense_id}: {expense.title}")

    return expense


# ── DELETE /expenses/{id} ─────────────────────────────────────
@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Delete an expense — only if it belongs to the current user."""
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")

    title = expense.title   # capture before delete
    db.delete(expense)
    db.commit()

    _log(db, current_user.id, "DELETE_EXPENSE", f"Deleted: {title}")
