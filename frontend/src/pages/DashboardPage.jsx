// frontend/src/pages/DashboardPage.jsx
// ============================================================
// Main dashboard — route: /dashboard
// Wraps the existing Expense CRUD UI (ExpenseForm + ExpenseList)
// Adds: search bar (live client-side filtering), nav header
// This is the evolution of the old App.js render output.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ExpenseForm      from "../components/ExpenseForm";
import ExpenseList      from "../components/ExpenseList";
import EditExpenseModal from "../components/EditExpenseModal";
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  logoutUser,
} from "../services/api";

function DashboardPage() {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [expenses,          setExpenses]          = useState([]);
  const [selectedCategory,  setSelectedCategory]  = useState("All");
  const [searchQuery,       setSearchQuery]        = useState("");   // NEW: live search
  const [editingExpense,    setEditingExpense]     = useState(null);
  const [isLoadingList,     setIsLoadingList]      = useState(true);
  const [isLoadingForm,     setIsLoadingForm]      = useState(false);
  const [isLoadingEdit,     setIsLoadingEdit]      = useState(false);
  const [notification,      setNotification]       = useState(null);

  // ── Grand total (all user's expenses, unfiltered) ─────────
  const grandTotal = expenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount), 0
  );

  // ── Notification helper ───────────────────────────────────
  function showNotification(message, type = "success") {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }

  // ── Load expenses on mount ────────────────────────────────
  const loadExpenses = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await fetchExpenses();   // GET /expenses/ with JWT
      setExpenses(data);
    } catch (err) {
      if (err.message.includes("Invalid or expired token")) {
        logout();
        navigate("/login");
      } else {
        showNotification(err.message, "error");
      }
    } finally {
      setIsLoadingList(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadExpenses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live search filter (client-side) ─────────────────────
  // useMemo recomputes only when expenses or searchQuery change.
  // Searches title, category, and description fields.
  const searchFilteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter(
      (exp) =>
        exp.title.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        (exp.description && exp.description.toLowerCase().includes(q))
    );
  }, [expenses, searchQuery]);

  // ── CRUD handlers ─────────────────────────────────────────

  async function handleAddExpense(expenseData) {
    setIsLoadingForm(true);
    try {
      const newExpense = await createExpense(expenseData);
      setExpenses((prev) => [newExpense, ...prev]);
      showNotification(`"${newExpense.title}" added!`);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsLoadingForm(false);
    }
  }

  async function handleSaveEdit(id, updatedData) {
    setIsLoadingEdit(true);
    try {
      const updated = await updateExpense(id, updatedData);
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      showNotification(`"${updated.title}" updated!`);
      setEditingExpense(null);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setIsLoadingEdit(false);
    }
  }

  async function handleDeleteExpense(id) {
    const exp = expenses.find((e) => e.id === id);
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showNotification(`"${exp?.title}" deleted.`, "info");
    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  // ── Logout ─────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await logoutUser();   // POST /auth/logout (best effort)
    } catch (_) {
      // Ignore — still log out client-side
    }
    logout();               // clear AuthContext + localStorage
    navigate("/login");
  }

  // Format as AUD currency
  function fmt(n) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency", currency: "AUD",
    }).format(n);
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Toast notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`} role="status">
          {notification.message}
        </div>
      )}

      {/* ── App header ──────────────────────────────────── */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <span className="header-logo">💰</span>
            <div>
              <h1 className="header-title">Expense Tracker</h1>
              <p className="header-subtitle">Track. Analyse. Save.</p>
            </div>
          </div>

          {/* Centre: live search bar */}
          <div className="header-search">
            <input
              type="search"
              className="search-input"
              placeholder="🔍 Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search expenses"
            />
          </div>

          {/* Right: total + user info + nav */}
          <div className="header-right">
            <div className="header-total">
              <span className="header-total-label">My total</span>
              <span className="header-total-amount">{fmt(grandTotal)}</span>
            </div>

            <div className="header-user">
              <span className="header-username">
                👤 {currentUser?.username}
                {isAdmin && <span className="admin-badge">Admin</span>}
              </span>

              {/* Admin dashboard link — only visible to admins */}
              {isAdmin && (
                <button
                  className="btn btn-nav"
                  onClick={() => navigate("/admin")}
                >
                  Admin Panel
                </button>
              )}

              <button className="btn btn-logout" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
      <main className="app-main">
        <div className="app-container">
          <aside className="sidebar">
            <ExpenseForm onSubmit={handleAddExpense} isLoading={isLoadingForm} />
          </aside>

          <section className="main-content" aria-label="Expense list">
            {/* Search result hint */}
            {searchQuery && (
              <div className="search-hint">
                {searchFilteredExpenses.length === 0
                  ? `No results for "${searchQuery}"`
                  : `${searchFilteredExpenses.length} result(s) for "${searchQuery}"`}
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  Clear ✕
                </button>
              </div>
            )}

            <ExpenseList
              expenses={searchFilteredExpenses}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onEdit={setEditingExpense}
              onDelete={handleDeleteExpense}
              isLoading={isLoadingList}
            />
          </section>
        </div>
      </main>

      {/* Edit modal */}
      <EditExpenseModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleSaveEdit}
        isLoading={isLoadingEdit}
      />

      <footer className="app-footer">
        <p>Expense Tracker v2 · React + FastAPI + MySQL · Assignment 2</p>
      </footer>
    </div>
  );
}

export default DashboardPage;
