// frontend/src/components/ExpenseList.jsx
// ============================================================
// Displays the filtered expense list with summary stats
// Demonstrates: props, array methods, computed values, conditional rendering
// ============================================================

import React, { useMemo } from "react";
import ExpenseItem from "./ExpenseItem";

// All possible category filter options
const CATEGORIES = [
  "All",
  "Food",
  "Transport",
  "Entertainment",
  "Education",
  "Health",
  "Utilities",
  "Shopping",
  "Other",
];

/**
 * ExpenseList — renders the filter bar, summary stats, and list of expenses.
 *
 * Props:
 *   expenses        (array)    — full array of all expenses from state
 *   selectedCategory (string)  — currently active category filter
 *   onCategoryChange (function)— called when filter dropdown changes
 *   onEdit          (function) — passed down to ExpenseItem for edit action
 *   onDelete        (function) — passed down to ExpenseItem for delete action
 *   isLoading       (boolean)  — shows a loading skeleton if true
 */
function ExpenseList({
  expenses,
  selectedCategory,
  onCategoryChange,
  onEdit,
  onDelete,
  isLoading,
}) {
  // ── Filtered expenses ─────────────────────────────────────
  // useMemo avoids recomputing on every render unless dependencies change
  const filteredExpenses = useMemo(() => {
    if (selectedCategory === "All") return expenses;
    return expenses.filter((exp) => exp.category === selectedCategory);
  }, [expenses, selectedCategory]);

  // ── Total of filtered expenses ────────────────────────────
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  }, [filteredExpenses]);

  // ── Monthly summary (all expenses, grouped by month) ─────
  // Used for the "Monthly Trend" display
  const monthlySummary = useMemo(() => {
    const summary = {};
    expenses.forEach((exp) => {
      // Extract "YYYY-MM" as the key
      const monthKey = exp.date.substring(0, 7);
      summary[monthKey] = (summary[monthKey] || 0) + parseFloat(exp.amount);
    });

    // Sort by month descending and take the latest 3
    return Object.entries(summary)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 3)
      .map(([month, total]) => ({
        label: formatMonthLabel(month),
        total,
      }));
  }, [expenses]);

  // Format "2025-07" → "Jul 2025"
  function formatMonthLabel(yearMonth) {
    const [year, month] = yearMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
  }

  // Format number as AUD currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="expense-list-section">

      {/* ── Monthly Trend Bar ────────────────────────────── */}
      {monthlySummary.length > 0 && (
        <div className="monthly-trend">
          <h3 className="section-subtitle">Monthly Trend</h3>
          <div className="trend-bars">
            {monthlySummary.map((entry) => {
              // Calculate bar height relative to the highest month
              const maxTotal = Math.max(...monthlySummary.map((e) => e.total));
              const heightPercent = (entry.total / maxTotal) * 100;

              return (
                <div className="trend-bar-wrapper" key={entry.label}>
                  <span className="trend-amount">{formatCurrency(entry.total)}</span>
                  <div className="trend-bar-track">
                    <div
                      className="trend-bar-fill"
                      style={{ height: `${heightPercent}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(entry.total)}
                      aria-label={`${entry.label}: ${formatCurrency(entry.total)}`}
                    />
                  </div>
                  <span className="trend-label">{entry.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter + Summary row ─────────────────────────── */}
      <div className="list-controls">
        <div className="filter-group">
          <label htmlFor="category-filter" className="filter-label">
            Filter by Category:
          </label>
          <select
            id="category-filter"
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Summary chips */}
        <div className="summary-chips">
          <div className="summary-chip">
            <span className="summary-chip-label">Showing</span>
            <span className="summary-chip-value">{filteredExpenses.length}</span>
          </div>
          <div className="summary-chip summary-chip-total">
            <span className="summary-chip-label">Total</span>
            <span className="summary-chip-value">{formatCurrency(filteredTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Expense list ────────────────────────────────── */}
      {isLoading ? (
        // Loading skeleton — shown while fetching from API
        <div className="loading-list" aria-busy="true" aria-label="Loading expenses">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-item" />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        // Empty state
        <div className="empty-state">
          <p className="empty-state-icon">📭</p>
          <p className="empty-state-text">
            {selectedCategory === "All"
              ? "No expenses yet. Add one above!"
              : `No expenses in the "${selectedCategory}" category.`}
          </p>
        </div>
      ) : (
        // Render each expense using the ExpenseItem component
        <div className="expense-items" role="list">
          {filteredExpenses.map((expense) => (
            <div role="listitem" key={expense.id}>
              <ExpenseItem
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExpenseList;
