# backend/models.py
# ============================================================
# Assignment 2 — UPDATED
# Added: User, UserActivity ORM models
# Added: Pydantic schemas for auth, users, activity
# Updated: Expense model now has user_id FK
# ============================================================

from sqlalchemy import (
    Column, Integer, String, Numeric, Date, Text,
    TIMESTAMP, Boolean, Enum, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, field_validator
from datetime import date, datetime
from typing import Optional, List
from database import Base
import enum


# ─────────────────────────────────────────────────────────────
# ENUM for user roles
# ─────────────────────────────────────────────────────────────
class RoleEnum(str, enum.Enum):
    user  = "user"
    admin = "admin"


# ─────────────────────────────────────────────────────────────
# ORM MODELS
# ─────────────────────────────────────────────────────────────

class User(Base):
    """Represents the 'users' table."""
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username   = Column(String(100), nullable=False, unique=True, index=True)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    password   = Column(String(255), nullable=False)   # bcrypt hash
    role       = Column(Enum("user", "admin"), nullable=False, default="user")
    is_active  = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships — lets SQLAlchemy lazy-load related records
    expenses   = relationship("Expense",      back_populates="owner",   cascade="all, delete")
    activities = relationship("UserActivity", back_populates="user",    cascade="all, delete")


class Expense(Base):
    """Represents the 'expenses' table — now owned by a user."""
    __tablename__ = "expenses"

    id          = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)   # NEW
    title       = Column(String(255), nullable=False)
    category    = Column(String(100), nullable=False)
    amount      = Column(Numeric(10, 2), nullable=False)
    date        = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    created_at  = Column(TIMESTAMP, server_default=func.now())

    owner = relationship("User", back_populates="expenses")


class UserActivity(Base):
    """Represents the 'user_activity' table — audit log."""
    __tablename__ = "user_activity"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    action     = Column(String(100), nullable=False)   # e.g. "LOGIN", "CREATE_EXPENSE"
    detail     = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="activities")


# ─────────────────────────────────────────────────────────────
# PYDANTIC SCHEMAS — Auth
# ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """Body for POST /auth/register"""
    username: str
    email:    EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    """Body for POST /auth/login"""
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response from /auth/login"""
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    username:     str
    role:         str


class UserResponse(BaseModel):
    """Public user info — never exposes password hash"""
    id:         int
    username:   str
    email:      str
    role:       str
    is_active:  bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# PYDANTIC SCHEMAS — Expenses (updated to expose user_id)
# ─────────────────────────────────────────────────────────────

class ExpenseBase(BaseModel):
    title:       str
    category:    str
    amount:      float
    date:        date
    description: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2)

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: str) -> str:
        allowed = ["Food", "Transport", "Entertainment", "Education",
                   "Health", "Utilities", "Shopping", "Other"]
        if v not in allowed:
            raise ValueError(f"Category must be one of: {', '.join(allowed)}")
        return v


class ExpenseCreate(ExpenseBase):
    pass  # user_id is injected by the backend from the JWT token


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseResponse(ExpenseBase):
    id:         int
    user_id:    int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# PYDANTIC SCHEMAS — Activity Log
# ─────────────────────────────────────────────────────────────

class ActivityResponse(BaseModel):
    id:         int
    user_id:    int
    action:     str
    detail:     Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None
    username:   Optional[str] = None   # populated by the admin route

    class Config:
        from_attributes = True
