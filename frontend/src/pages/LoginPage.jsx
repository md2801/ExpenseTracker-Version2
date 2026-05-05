// frontend/src/pages/LoginPage.jsx
// ============================================================
// Login form page — route: /login
// On success: stores JWT via AuthContext.login() and
// navigates to /dashboard (no page reload — React Router)
// ============================================================

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();   // from AuthContext

  // ── Form state ────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(""); // clear error on any change
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // POST /auth/login → returns { access_token, user_id, username, role }
      const data = await loginUser(formData);

      // Persist token + user info in context (which also writes localStorage)
      login(data.access_token, {
        id:       data.user_id,
        username: data.username,
        role:     data.role,
      });

      // Navigate without page reload (SPA)
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo / heading */}
        <div className="auth-header">
          <span className="auth-logo">💰</span>
          <h1 className="auth-title">Expense Tracker</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" aria-hidden="true" /> Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Switch to register */}
        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Create one
          </Link>
        </p>

        {/* Demo credentials hint */}
        <div className="auth-demo">
          <p className="auth-demo-title">Demo credentials</p>
          <p>Admin: <code>admin@example.com</code> / <code>admin123</code></p>
          <p>User: &nbsp;<code>john@example.com</code> / <code>password123</code></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
