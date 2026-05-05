# backend/database.py
# ============================================================
# Database connection setup using SQLAlchemy ORM
# This module creates the engine, session, and base model
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ── Database connection URL ──────────────────────────────────
# Format: mysql+pymysql://username:password@host:port/database
# Update credentials to match your local MySQL setup        #CHANGE PASSWORD TO ROOT
DATABASE_URL = "mysql+pymysql://root:root123@localhost:3306/expense_db"

# ── SQLAlchemy engine ────────────────────────────────────────
# The engine manages the connection pool to the database
engine = create_engine(
    DATABASE_URL,
    echo=True,           # Logs all SQL statements — helpful for debugging
    pool_pre_ping=True   # Checks connection health before using from pool
)

# ── Session factory ──────────────────────────────────────────
# Each request will get its own database session
SessionLocal = sessionmaker(
    autocommit=False,   # We control transactions manually
    autoflush=False,    # We flush manually to avoid unintended queries
    bind=engine
)

# ── Declarative base ─────────────────────────────────────────
# All ORM models will inherit from this Base class
Base = declarative_base()


# ── Dependency function ──────────────────────────────────────
# Used by FastAPI's Depends() to inject a DB session into routes
# Automatically closes the session when the request is done
def get_db():
    db = SessionLocal()
    try:
        yield db          # Provide the session to the route handler
    finally:
        db.close()        # Always close — even if an exception occurred
