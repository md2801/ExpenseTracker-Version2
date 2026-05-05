// frontend/src/pages/AdminPage.jsx
// ============================================================
// Admin dashboard — route: /admin (admin role required)
// Tabs: Users | All Expenses | Activity Log
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchAllUsersAdmin,
  fetchAllExpensesAdmin,
  fetchActivity,
  toggleUserStatus,
} from "../services/api";

// ── Category colour chips (reused from ExpenseItem) ──────────
const CHIP_CLASS = {
  Food: "chip-food", Transport: "chip-transport",
  Entertainment: "chip-entertainment", Education: "chip-education",
  Health: "chip-health", Utilities: "chip-utilities",
  Shopping: "chip-shopping", Other: "chip-other",
};

// ── Action colour mapping for activity log ────────────────────
const ACTION_COLORS = {
  LOGIN:          "action-login",
  LOGOUT:         "action-logout",
  REGISTER:       "action-register",
  CREATE_EXPENSE: "action-create",
  UPDATE_EXPENSE: "action-update",
  DELETE_EXPENSE: "action-delete",
};

function AdminPage() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab,   setActiveTab]   = useState("users");
  const [users,       setUsers]       = useState([]);
  const [expenses,    setExpenses]    = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [togglingId,  setTogglingId]  = useState(null);

  // Redirect non-admins immediately
  useEffect(() => {
    if (!isAdmin) navigate("/dashboard");
  }, [isAdmin, navigate]);

  // Load all data on mount
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [u, e, a] = await Promise.all([
          fetchAllUsersAdmin(),
          fetchAllExpensesAdmin(),
          fetchActivity(),
        ]);
        setUsers(u);
        setExpenses(e);
        setActivity(a);
      } catch (err) {
        if (err.message.includes("token")) {
          logout();
          navigate("/login");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle user active state ──────────────────────────────
  async function handleToggleUser(userId) {
    setTogglingId(userId);
    try {
      const updated = await toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  // ── Summary stats ─────────────────────────────────────────
  const totalSpend  = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const activeUsers = users.filter((u) => u.is_active).length;

  function fmt(n) {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
  }
  function fmtDate(d) {
    return d ? new Date(d).toLocaleString("en-AU", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }) : "—";
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <span className="header-logo">🛡️</span>
            <div>
              <h1 className="header-title">Admin Dashboard</h1>
              <p className="header-subtitle">System Overview</p>
            </div>
          </div>
          <div className="header-right">
            <button className="btn btn-nav" onClick={() => navigate("/dashboard")}>
              ← My Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="admin-container">

          {/* Summary stat cards */}
          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <div>
                <p className="stat-label">Total Users</p>
                <p className="stat-value">{users.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div>
                <p className="stat-label">Active Users</p>
                <p className="stat-value">{activeUsers}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📋</span>
              <div>
                <p className="stat-label">Total Expenses</p>
                <p className="stat-value">{expenses.length}</p>
              </div>
            </div>
            <div className="stat-card stat-card-accent">
              <span className="stat-icon">💵</span>
              <div>
                <p className="stat-label">All-user Spend</p>
                <p className="stat-value">{fmt(totalSpend)}</p>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          {/* Tab bar */}
          <div className="admin-tabs">
            {["users", "expenses", "activity"].map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "tab-btn-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "users"    && "👥 Users"}
                {tab === "expenses" && "📋 All Expenses"}
                {tab === "activity" && "📜 Activity Log"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {loading ? (
            <div className="loading-list">
              {[1,2,3].map(i => <div key={i} className="skeleton-item" />)}
            </div>
          ) : (
            <div className="admin-panel">

              {/* ── USERS TAB ──────────────────────────────── */}
              {activeTab === "users" && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Username</th><th>Email</th>
                        <th>Role</th><th>Status</th><th>Joined</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td><strong>{u.username}</strong></td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-badge role-${u.role}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.is_active ? "status-active" : "status-inactive"}`}>
                              {u.is_active ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td>{fmtDate(u.created_at)}</td>
                          <td>
                            <button
                              className={`btn ${u.is_active ? "btn-delete" : "btn-edit"}`}
                              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                              onClick={() => handleToggleUser(u.id)}
                              disabled={togglingId === u.id}
                            >
                              {togglingId === u.id ? "..." : u.is_active ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── EXPENSES TAB ───────────────────────────── */}
              {activeTab === "expenses" && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>User ID</th><th>Title</th>
                        <th>Category</th><th>Amount</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id}>
                          <td>{e.id}</td>
                          <td>{e.user_id}</td>
                          <td>{e.title}</td>
                          <td>
                            <span className={`category-chip ${CHIP_CLASS[e.category] || "chip-other"}`}>
                              {e.category}
                            </span>
                          </td>
                          <td><strong>{fmt(e.amount)}</strong></td>
                          <td>{e.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── ACTIVITY LOG TAB ────────────────────────── */}
              {activeTab === "activity" && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>User</th><th>Action</th>
                        <th>Detail</th><th>IP</th><th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((a) => (
                        <tr key={a.id}>
                          <td>{a.id}</td>
                          <td><strong>{a.username}</strong></td>
                          <td>
                            <span className={`action-badge ${ACTION_COLORS[a.action] || ""}`}>
                              {a.action}
                            </span>
                          </td>
                          <td className="detail-cell">{a.detail || "—"}</td>
                          <td>{a.ip_address || "—"}</td>
                          <td>{fmtDate(a.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Expense Tracker v2 · Admin Panel · Assignment 2</p>
      </footer>
    </div>
  );
}

export default AdminPage;
