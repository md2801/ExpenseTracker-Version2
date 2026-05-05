// frontend/src/context/AuthContext.js
// ============================================================
// Global authentication context — wraps the entire app.
// Provides: currentUser, token, login(), logout(), isAdmin
// Any component can call useAuth() to access these values.
// ============================================================

import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context object
const AuthContext = createContext(null);

/**
 * AuthProvider — wrap <App /> with this to give all children
 * access to authentication state.
 */
export function AuthProvider({ children }) {
  // ── State ─────────────────────────────────────────────────
  // Initialise from localStorage so the user stays logged in
  // across page refreshes (token persisted in browser storage)
  const [token,       setToken]       = useState(() => localStorage.getItem("token") || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // ── Derived helpers ───────────────────────────────────────
  const isLoggedIn = Boolean(token && currentUser);
  const isAdmin    = currentUser?.role === "admin";

  // ── login() ───────────────────────────────────────────────
  // Called after a successful POST /auth/login response.
  // Stores the token and user info in state AND localStorage.
  function login(tokenString, userInfo) {
    setToken(tokenString);
    setCurrentUser(userInfo);
    localStorage.setItem("token", tokenString);
    localStorage.setItem("user",  JSON.stringify(userInfo));
  }

  // ── logout() ──────────────────────────────────────────────
  // Clears all auth state. The API logout call is made separately
  // in the component so errors there don't block the UI logout.
  function logout() {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // ── Sync across tabs ──────────────────────────────────────
  // If the user logs out in one browser tab, other tabs should
  // also update by listening to the storage event.
  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === "token" && !event.newValue) {
        // Token was removed in another tab — log out here too
        setToken(null);
        setCurrentUser(null);
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ── Context value ─────────────────────────────────────────
  const value = {
    token,
    currentUser,
    isLoggedIn,
    isAdmin,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — custom hook for consuming auth context.
 * Usage: const { currentUser, logout, isAdmin } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
