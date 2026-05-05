// frontend/src/components/ExpenseItem.jsx
// ============================================================
// Renders a single expense row inside the expense list
// Demonstrates: props, conditional rendering, event handlers
// ============================================================

import React, { useState } from "react";

// Category icon mapping — purely visual
const CATEGORY_ICONS = {
  Food: "🍔",
  Transport: "🚌",
  Entertainment: "🎬",
  Education: "📚",
  Health: "💊",
  Utilities: "💡",
  Shopping: "🛍️",
  Other: "📌",
};

// Category colour chip mapping
const CATEGORY_COLORS = {
  Food:          "chip-food",
  Transport:     "chip-transport",
  Entertainment: "chip-entertainment",
  Education:     "chip-education",
  Health:        "chip-health",
  Utilities:     "chip-utilities",
  Shopping:      "chip-shopping",
  Other:         "chip-other",
};

/**
 * ExpenseItem — displays one expense as a card/row.
 *
 * Props:
 *   expense  (object)   — the expense data to display
 *   onEdit   (function) — called with the expense when Edit is clicked
 *   onDelete (function) — called with the expense id when Delete is confirmed
 */
function ExpenseItem({ expense, onEdit, onDelete }) {
  // Controls whether the delete confirmation prompt is shown
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Format the date for display: "2025-07-04" → "4 Jul 2025"
  function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00"); // Force local timezone
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Format amount as Australian dollar currency
  function formatAmount(amount) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  }

  // ── Delete flow ──────────────────────────────────────────
  // First click shows a confirmation prompt (prevents accidental deletes)
  function handleDeleteClick() {
    setShowDeleteConfirm(true);
  }

  // User confirmed — call parent handler with the expense id
  function handleConfirmDelete() {
    onDelete(expense.id);
    setShowDeleteConfirm(false);
  }

  // User changed their mind — hide the confirmation
  function handleCancelDelete() {
    setShowDeleteConfirm(false);
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="expense-item">
      {/* Left: category icon + details */}
      <div className="expense-item-left">
        <div className="category-icon" aria-hidden="true">
          {CATEGORY_ICONS[expense.category] || "📌"}
        </div>

        <div className="expense-details">
          <h3 className="expense-title">{expense.title}</h3>
          <div className="expense-meta">
            {/* Category chip */}
            <span className={`category-chip ${CATEGORY_COLORS[expense.category] || "chip-other"}`}>
              {expense.category}
            </span>
            {/* Date */}
            <span className="expense-date">{formatDate(expense.date)}</span>
          </div>

          {/* Optional description — only show if it exists */}
          {expense.description && (
            <p className="expense-description">{expense.description}</p>
          )}
        </div>
      </div>

      {/* Right: amount + action buttons */}
      <div className="expense-item-right">
        <span className="expense-amount">{formatAmount(expense.amount)}</span>

        <div className="expense-actions">
          {/* Edit button — opens the EditExpenseModal in App.js */}
          <button
            className="btn btn-edit"
            onClick={() => onEdit(expense)}
            aria-label={`Edit ${expense.title}`}
          >
            ✏️ Edit
          </button>

          {/* Delete button — shows confirmation first */}
          {!showDeleteConfirm ? (
            <button
              className="btn btn-delete"
              onClick={handleDeleteClick}
              aria-label={`Delete ${expense.title}`}
            >
              🗑️ Delete
            </button>
          ) : (
            /* Inline delete confirmation — no separate page/modal needed */
            <div className="delete-confirm" role="alert">
              <span className="delete-confirm-text">Sure?</span>
              <button
                className="btn btn-confirm-delete"
                onClick={handleConfirmDelete}
                aria-label="Confirm delete"
              >
                Yes
              </button>
              <button
                className="btn btn-cancel"
                onClick={handleCancelDelete}
                aria-label="Cancel delete"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseItem;
