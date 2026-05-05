// frontend/src/pages/RegisterPage.jsx
// ============================================================
// Registration form page — route: /register
// On success: auto-logs the user in and navigates to /dashboard
// ============================================================

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email:    "",
    password: "",
    confirm:  "",
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setApiError("");
  }

  // ── Client-side validation ────────────────────────────────
  function validate() {
    const errs = {};
    if (formData.username.trim().length < 3)
      errs.username = "Username must be at least 3 characters.";
    if (!formData.email.includes("@"))
      errs.email = "Please enter a valid email.";
    if (formData.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirm)
      errs.confirm = "Passwords do not match.";
    return errs;
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      // Register the user
      await registerUser({
        username: formData.username.trim(),
        email:    formData.email,
        password: formData.password,
      });

      // Auto-login after successful registration
      const data = await loginUser({
        email:    formData.email,
        password: formData.password,
      });

      login(data.access_token, {
        id:       data.user_id,
        username: data.username,
        role:     data.role,
      });

      navigate("/dashboard");
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">💰</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join Expense Tracker for free</p>
        </div>

        {apiError && (
          <div className="auth-error" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={`form-input ${errors.username ? "input-error" : ""}`}
              placeholder="yourname"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">
              Email Address
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className={`form-input ${errors.email ? "input-error" : ""}`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className={`form-input ${errors.password ? "input-error" : ""}`}
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="confirm" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              className={`form-input ${errors.confirm ? "input-error" : ""}`}
              placeholder="Repeat password"
              value={formData.confirm}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirm && (
              <span className="error-text">{errors.confirm}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" /> Creating account...</>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
