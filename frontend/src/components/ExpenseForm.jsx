// frontend/src/components/ExpenseForm.jsx
// ============================================================
// Form for adding a new expense
// Demonstrates: controlled inputs, useState, form validation
// ============================================================

import React, { useState } from "react";

// The list of allowed categories (must match backend validation)
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

// Category emoji map — purely visual enhancement
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
 * ExpenseForm — controlled form component for creating expenses.
 *
 * Props:
 *   onSubmit (function) — called with form data when the form is submitted
 *   isLoading (boolean) — disables the submit button while API call is in progress
 */
function ExpenseForm({ onSubmit, isLoading }) {
  // ── Form state ───────────────────────────────────────────
  // Each input field is a controlled component tracked in state
  const [formData, setFormData] = useState({
    title: "",
    category: "Food",
    amount: "",
    date: new Date().toISOString().split("T")[0], // Default to today
    description: "",
  });

  // Tracks field-level validation errors
  const [errors, setErrors] = useState({});

  // Whether the form is visible (collapsed by default on mobile)
  const [isExpanded, setIsExpanded] = useState(true);

  // ── Input change handler ─────────────────────────────────
  // Generic handler — works for all fields using the input's name attribute
  function handleChange(event) {
    const { name, value } = event.target;

    // Update the relevant field in formData
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the error for this field as the user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  // ── Validation ───────────────────────────────────────────
  // Returns an errors object; if empty, the form is valid
  function validate() {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    return newErrors;
  }

  // ── Form submission ──────────────────────────────────────
  async function handleSubmit(event) {
    event.preventDefault(); // Prevent the browser from reloading the page (SPA!)

    // Run validation before sending to the API
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // Stop here if there are errors
    }

    // Prepare data — amount must be a float, not a string
    const submissionData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    // Delegate to the parent component's handler (App.js)
    await onSubmit(submissionData);

    // Reset the form on successful submission
    setFormData({
      title: "",
      category: "Food",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setErrors({});
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="form-card">
      {/* Header with toggle for mobile collapse */}
      <div className="form-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="form-title">
          <span className="form-title-icon">+</span> Add New Expense
        </h2>
        <button
          className="form-toggle"
          aria-expanded={isExpanded}
          aria-label="Toggle expense form"
        >
          {isExpanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Collapsible form body */}
      {isExpanded && (
        <form onSubmit={handleSubmit} noValidate className="expense-form">
          {/* Row 1: Title + Category */}
          <div className="form-row">
            {/* Title field */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Expense Title <span className="required">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className={`form-input ${errors.title ? "input-error" : ""}`}
                placeholder="e.g. Weekly Groceries"
                value={formData.title}
                onChange={handleChange}
                maxLength={255}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <span id="title-error" className="error-text" role="alert">
                  {errors.title}
                </span>
              )}
            </div>

            {/* Category dropdown */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`form-input form-select ${errors.category ? "input-error" : ""}`}
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

          {/* Row 2: Amount + Date */}
          <div className="form-row">
            {/* Amount field */}
            <div className="form-group">
              <label htmlFor="amount" className="form-label">
                Amount ($) <span className="required">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                className={`form-input ${errors.amount ? "input-error" : ""}`}
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                aria-describedby={errors.amount ? "amount-error" : undefined}
              />
              {errors.amount && (
                <span id="amount-error" className="error-text" role="alert">
                  {errors.amount}
                </span>
              )}
            </div>

            {/* Date field */}
            <div className="form-group">
              <label htmlFor="date" className="form-label">
                Date <span className="required">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className={`form-input ${errors.date ? "input-error" : ""}`}
                value={formData.date}
                onChange={handleChange}
                aria-describedby={errors.date ? "date-error" : undefined}
              />
              {errors.date && (
                <span id="date-error" className="error-text" role="alert">
                  {errors.date}
                </span>
              )}
            </div>
          </div>

          {/* Description textarea (optional) */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="optional">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              placeholder="Add a note about this expense..."
              value={formData.description}
              onChange={handleChange}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" /> Adding...
              </>
            ) : (
              "Add Expense"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default ExpenseForm;
