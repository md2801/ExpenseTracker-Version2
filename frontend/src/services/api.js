// frontend/src/services/api.js
// ============================================================
// Assignment 2 — UPDATED
// - request() now attaches Authorization: Bearer <token> header
// - Added: loginUser, registerUser, logoutUser, fetchMe
// - Added: fetchAllUsersAdmin, fetchAllExpensesAdmin, fetchActivity
// - Existing expense functions preserved unchanged
// ============================================================

const BASE_URL = "http://localhost:8000";

/**
 * Core request helper.
 * Reads the JWT from localStorage and adds it as a Bearer header
 * on every request — so protected routes are authenticated automatically.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Pull token from storage (set by AuthContext.login)
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = { ...options, headers };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) return null;  // DELETE success

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      let message = `HTTP error ${response.status}`;

      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((err) => err.msg || "Invalid input")
          .join(", ");
      } else if (data.detail && typeof data.detail === "object") {
        message = data.detail.msg || JSON.stringify(data.detail);
      }

      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError") {
      throw new Error(
        "Cannot connect to the server. Make sure the backend is running on port 8000."
      );
    }
    throw error;
  }
}


// ── Auth API ─────────────────────────────────────────────────

/**
 * POST /auth/register
 * Register a new user account.
 */
export async function registerUser({ username, email, password }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

/**
 * POST /auth/login
 * Authenticate and receive a JWT token.
 */
export async function loginUser({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * POST /auth/logout
 * Notify the backend (for activity logging). Token stays client-side.
 */
export async function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}

/**
 * GET /auth/me
 * Return the current user's profile.
 */
export async function fetchMe() {
  return request("/auth/me");
}


// ── Expense API (unchanged from Assignment 1) ─────────────────

export async function fetchExpenses() {
  return request("/expenses/");
}

export async function createExpense(expenseData) {
  return request("/expenses/", {
    method: "POST",
    body: JSON.stringify(expenseData),
  });
}

export async function updateExpense(id, expenseData) {
  return request(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(expenseData),
  });
}

export async function deleteExpense(id) {
  return request(`/expenses/${id}`, { method: "DELETE" });
}


// ── Admin API ────────────────────────────────────────────────

/**
 * GET /admin/users
 * All registered users (admin only).
 */
export async function fetchAllUsersAdmin() {
  return request("/admin/users");
}

/**
 * GET /admin/expenses
 * All expenses across all users (admin only).
 */
export async function fetchAllExpensesAdmin() {
  return request("/admin/expenses");
}

/**
 * GET /admin/activity
 * Full user activity log (admin only).
 */
export async function fetchActivity() {
  return request("/admin/activity");
}

/**
 * PUT /admin/users/{id}/toggle
 * Activate or deactivate a user account (admin only).
 */
export async function toggleUserStatus(userId) {
  return request(`/admin/users/${userId}/toggle`, { method: "PUT" });
}
