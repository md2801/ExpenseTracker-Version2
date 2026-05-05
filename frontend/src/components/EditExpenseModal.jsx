// frontend/src/components/EditExpenseModal.jsx
// ============================================================
// Modal overlay for editing an existing expense
// Demonstrates: controlled form, useEffect for data sync, portal-style overlay
// ============================================================

import React, { useState, useEffect } from "react";

const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Education",
  "Health",
  "Utilities",
  "Shopping",
  "Other",
];

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

/**
 * EditExpenseModal — modal overlay for updating an existing expense.
 *
 * Props:
 *   expense   (object|null) — the expense to edit; null means modal is hidden
 *   onClose   (function)    — called when the modal should close (cancel or success)
 *   onSave    (function)    — called with (id, updatedData) when form is submitted
 *   isLoading (boolean)     — disables save button during API call
 */
function EditExpenseModal({ expense, onClose, onSave, isLoading }) {
  // ── Local form state ────────────────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    category: "Food",
    amount: "",
    date: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  // ── Sync form with the expense prop ────────────────────
  // useEffect runs whenever the `expense` prop changes.
  // This pre-fills the form with the existing expense data.
  useEffect(() => {
    if (expense) {
      setFormData({
        title:       expense.title       || "",
        category:    expense.category    || "Food",
        amount:      expense.amount      || "",
        date:        expense.date        || "",
        description: expense.description || "",
      });
      setErrors({}); // Clear any leftover errors from a previous edit
    }
  }, [expense]); // Re-run every time a different expense is selected for editing

  // ── Lock background scroll when modal is open ──────────
  // Prevents the page from scrolling behind the overlay
  useEffect(() => {
    if (expense) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Cleanup when the component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [expense]);

  // ── Close on Escape key press ───────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Don't render anything if there's no expense selected
  if (!expense) return null;

  // ── Input handler ────────────────────────────────────────
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  // ── Validation ───────────────────────────────────────────
  function validate() {
    const newErrors = {};
    if (!formData.title.trim())              newErrors.title    = "Title is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0)
                                             newErrors.amount   = "Amount must be positive";
    if (!formData.date)                      newErrors.date     = "Date is required";
    if (!formData.category)                  newErrors.category = "Category is required";
    return newErrors;
  }

  // ── Submit handler ───────────────────────────────────────
  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Send updated data to the parent handler
    await onSave(expense.id, {
      ...formData,
      amount: parseFloat(formData.amount),
    });
  }

  // ── Close on backdrop click ──────────────────────────────
  function handleBackdropClick(event) {
    // Only close if the click is directly on the backdrop, not the modal content
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    /* Semi-transparent backdrop overlay */
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal card */}
      <div className="modal-card">

        {/* Modal header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            ✏️ Edit Expense
          </h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close edit modal"
          >
            ✕
          </button>
        </div>

        {/* Modal form */}
        <form onSubmit={handleSubmit} noValidate className="expense-form modal-form">

          {/* Row: Title + Category */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-title" className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                id="edit-title"
                name="title"
                type="text"
                className={`form-input ${errors.title ? "input-error" : ""}`}
                value={formData.title}
                onChange={handleChange}
                maxLength={255}
              />
              {errors.title && (
                <span className="error-text" role="alert">{errors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="edit-category" className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                id="edit-category"
                name="category"
                className="form-input form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Amount + Date */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-amount" className="form-label">
                Amount ($) <span className="required">*</span>
              </label>
              <input
                id="edit-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                className={`form-input ${errors.amount ? "input-error" : ""}`}
                value={formData.amount}
                onChange={handleChange}
              />
              {errors.amount && (
                <span className="error-text" role="alert">{errors.amount}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="edit-date" className="form-label">
                Date <span className="required">*</span>
              </label>
              <input
                id="edit-date"
                name="date"
                type="date"
                className={`form-input ${errors.date ? "input-error" : ""}`}
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && (
                <span className="error-text" role="alert">{errors.date}</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="edit-description" className="form-label">
              Description <span className="optional">(optional)</span>
            </label>
            <textarea
              id="edit-description"
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Modal action buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="spinner" aria-hidden="true" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExpenseModal;
