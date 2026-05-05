# backend/main.py
# ============================================================
# Assignment 2 — UPDATED
# Added: auth_routes, admin_routes
# Kept: expenses router, CORS, health check
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes.expenses    import router as expenses_router
from routes.auth_routes import router as auth_router
from routes.admin_routes import router as admin_router

# Create / migrate all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expense Tracker API",
    description="Assignment 2 — REST API with JWT auth, multi-user, admin dashboard",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router)       # /auth/*
app.include_router(expenses_router)   # /expenses/*
app.include_router(admin_router)      # /admin/*


@app.get("/")
def root():
    return {
        "message": "Expense Tracker API v2.0 — running",
        "docs": "http://localhost:8000/docs",
        "version": "2.0.0",
    }
