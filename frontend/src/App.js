// frontend/src/App.js
// ============================================================
// Assignment 2 — REWRITTEN as a routing shell.
// The expense CRUD logic has moved to DashboardPage.jsx.
// This file sets up React Router routes and protected routes.
// ============================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage    from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage    from "./pages/AdminPage";
import "./App.css";

/**
 * ProtectedRoute — renders children only if the user is logged in.
 * Otherwise redirects to /login (no flash of content).
 */
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/**
 * AdminRoute — renders children only if the user has role === "admin".
 * Otherwise redirects to /dashboard.
 */
function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * PublicRoute — redirects logged-in users away from /login and /register
 * so they land directly on /dashboard.
 */
function PublicRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
}

/**
 * App — the root component.
 * Wraps everything in AuthProvider (makes auth state globally available)
 * and BrowserRouter (enables React Router).
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — redirect to dashboard if already logged in */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes — require a valid JWT */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin route — requires role === "admin" */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          {/* Default — redirect root to dashboard (or login if not authenticated) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
