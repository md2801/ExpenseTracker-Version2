# Expense Tracker Web Application

This is a full-stack web application built across two university assignments. The goal of the project was to create a practical tool that helps users track personal expenses in an organised way, while demonstrating a complete modern web development stack.

The application follows a single-page application (SPA) approach, meaning users can register, log in, and manage their expenses without any page refreshes. Assignment 2 extended the original CRUD system with user authentication, a multi-user data model, live search, role-based access control, and an admin dashboard.

---

## Problem Overview

Students and young professionals often struggle to keep track of daily spending. This application provides a simple interface to log, categorise, and review expenses over time. Each user has their own private expense data, protected by a JWT-based authentication system. An admin user can view all accounts, all expenses, and a full audit log of user actions.

The project also served as a practical exercise in connecting a React frontend to a FastAPI backend, handling authentication flows, and designing a relational database with foreign key relationships.

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | React 18 (functional components, React Router)  |
| Styling        | CSS (custom variables, Flexbox, Grid)           |
| Backend        | FastAPI (Python 3.11+)                          |
| ORM            | SQLAlchemy 2.0                                  |
| Validation     | Pydantic v2                                     |
| Database       | MySQL 8.0                                       |
| Authentication | JWT (python-jose), bcrypt (passlib)             |
| HTTP           | Fetch API (browser-native)                      |

### Key Libraries

| Package              | Purpose                                  |
|----------------------|------------------------------------------|
| `python-jose`        | JWT token creation and verification      |
| `passlib[bcrypt]`    | Password hashing using bcrypt            |
| `react-router-dom`   | Client-side routing between pages        |
| `sqlalchemy`         | ORM and database session management      |
| `uvicorn`            | ASGI server for running FastAPI locally  |

---

## Feature Overview

### Assignment 1 — Core Expense Tracker

- Add an expense with title, category, amount, date, and optional description
- View all expenses, updated instantly without reloading the page
- Edit an expense through a modal with pre-filled values
- Delete an expense with an inline confirmation step
- Filter the expense list by category
- Dynamic total that reflects the current filter selection
- Monthly trend bar chart showing the last three months of spending
- Toast notifications after each user action
- Client-side and server-side form validation
- Responsive layout for desktop, tablet, and mobile

### Assignment 2 — Authentication and Multi-user System

- User registration with hashed password storage (bcrypt)
- User login returning a signed JWT token
- Protected routes that redirect unauthenticated users to the login page
- Each expense is linked to the user who created it; users cannot see or modify each other's data
- Live client-side search that filters expenses by title, category, or description as the user types
- Admin dashboard with three tabs: all users, all expenses, and a full activity log
- Admins can enable or disable user accounts
- User activity tracking for login, logout, registration, and expense CRUD events
- Role-based route protection enforced on both the frontend and backend
- Client-side and server-side form validation, including:
    - Email format validation (must be a valid email address)
    - Password requirements (minimum length of 6 characters)
    - User-friendly error messages for invalid input

---

## Folder Structure

```
expense-tracker/
├── .gitignore
├── README.md
├── expense_db.sql              MySQL schema: users, expenses, user_activity
│
├── backend/
│   ├── main.py                 App entry point — registers routers, sets up CORS
│   ├── database.py             SQLAlchemy engine, session factory, get_db dependency
│   ├── models.py               ORM models (User, Expense, UserActivity) and Pydantic schemas
│   ├── auth.py                 Password hashing, JWT creation/decoding, auth dependencies
│   ├── requirements.txt        Python dependencies
│   └── routes/
│       ├── __init__.py
│       ├── expenses.py         CRUD endpoints for /expenses/* (protected, user-scoped)
│       ├── auth_routes.py      /auth/register, /auth/login, /auth/logout, /auth/me
│       └── admin_routes.py     /admin/users, /admin/expenses, /admin/activity (admin only)
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html          HTML shell — React mounts here
    └── src/
        ├── App.js              React Router shell with protected and admin route guards
        ├── App.css             All application styles including auth pages and admin panel
        ├── index.js            React 18 entry point (createRoot)
        ├── context/
        │   └── AuthContext.js  Global auth state — token, user, login(), logout()
        ├── pages/
        │   ├── LoginPage.jsx       Login form — calls /auth/login, stores JWT
        │   ├── RegisterPage.jsx    Register form — auto-logs in after creation
        │   ├── DashboardPage.jsx   Main expense CRUD view with search bar
        │   └── AdminPage.jsx       Admin dashboard with user, expense, and activity tabs
        ├── components/
        │   ├── ExpenseForm.jsx       Controlled form for adding new expenses
        │   ├── ExpenseList.jsx       Category filter, trend chart, expense list container
        │   ├── ExpenseItem.jsx       Single expense row with edit and delete actions
        │   └── EditExpenseModal.jsx  Modal overlay for updating an existing expense
        └── services/
            └── api.js          All fetch() calls — attaches Bearer token automatically
```

---

## Setup Instructions

You will need three terminals open simultaneously to run the database, backend, and frontend.

### Prerequisites

Ensure the following are installed before starting:

- [Node.js](https://nodejs.org/) v18 or higher
- [Python](https://www.python.org/) 3.11 or higher
- [MySQL](https://dev.mysql.com/downloads/) 8.0
- [VS Code](https://code.visualstudio.com/) (recommended)

---

### Step 1 — Database Setup

Log in to MySQL and run the schema file:

```bash
mysql -u root -p < expense_db.sql
```

Or from inside the MySQL prompt:

```sql
source /full/path/to/expense-tracker/expense_db.sql;
```

This creates the `expense_db` database with three tables (`users`, `expenses`, `user_activity`) and inserts sample data including two pre-created user accounts.

Verify the setup:

```sql
USE expense_db;
SHOW TABLES;
SELECT id, username, email, role FROM users;
```

---

### Step 2 — Configure Database Credentials

Open `backend/database.py` and update the connection string with your MySQL password:

```python
DATABASE_URL = "mysql+pymysql://root:YOUR_PASSWORD_HERE@localhost:3306/expense_db"
```

---

### Step 3 — Start the Backend

```bash
cd expense-tracker/backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Interactive documentation is available at `http://localhost:8000/docs`.

---

### Step 4 — Start the Frontend

```bash
cd expense-tracker/frontend

# Install Node dependencies (first run only)
npm install

# Start the development server
npm start
```

The React app opens automatically at `http://localhost:3000`.

---

### Step 5 — Using the Application

1. Visit `http://localhost:3000` — you will be redirected to the login page.
2. Register a new account or use one of the demo accounts below.
3. After logging in, the dashboard loads your expenses. You can add, edit, delete, and search.
4. The live search bar in the header filters results as you type.
5. Admin users see an "Admin Panel" button in the header which opens the admin dashboard.
6. Click "Sign out" to end the session. The token is cleared from the browser automatically.

---

## Demo Accounts

The following accounts are included for testing purposes (seeded via `expense_db.sql`):

| Role  | Email                 | Password    |
|-------|-----------------------|-------------|
| Admin | admin@example.com     | admin123    |
| User  | john@example.com      | password123 |

Note: These are demo credentials only. Passwords are hashed in the database using bcrypt and are intended for local development and testing.

---

## Admin Access

The seed data already includes an admin account. If you need to promote an existing user to admin manually, run the following SQL:

```sql
USE expense_db;
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Admin users have access to the `/admin` route, which shows all registered users, all expenses across every account, and the full user activity log. Non-admin users are redirected away from this route automatically.

---

## Common Issues and Fixes

| Problem | Fix |
|---------|-----|
| `Access denied for user 'root'` | Update the password in `backend/database.py` |
| `Cannot connect to the server` | Confirm the backend is running on port 8000 |
| `401 Unauthorized` on all requests | Token may have expired — log out and log back in |
| `Module not found` errors (Python) | Reinstall with `pip install -r requirements.txt` inside the venv |
| `npm install` fails | Delete `node_modules/` and run `npm install` again |
| CORS errors in the browser | Confirm `allow_origins` in `main.py` is set to `http://localhost:3000` |
| Duplicate email or username on register | Choose a different value or check the `users` table in MySQL |

---

## Concepts Demonstrated

| Concept | Where Applied |
|---------|---------------|
| Single Page Application | All navigation uses React Router — no full page reloads at any point |
| React functional components | Every UI element is a function component using hooks |
| useState | Form inputs, expense data, modal visibility, and notification state |
| useEffect | Initial data fetch, form pre-fill in the edit modal, scroll lock on modal open |
| React Context API | AuthContext provides global auth state to all components without prop drilling |
| React Router | Routes for /login, /register, /dashboard, /admin with protected and public guards |
| JWT Authentication | Tokens issued on login, stored in localStorage, sent as Bearer headers on every request |
| Password hashing | bcrypt via passlib — plaintext passwords are never stored |
| Role-based access control | Admin routes enforced on both frontend (route guards) and backend (require_admin dependency) |
| FastAPI REST API | Endpoints for auth, CRUD, and admin operations with dependency injection |
| Pydantic validation | All request bodies and responses are validated through typed schemas |
| SQLAlchemy ORM | Three related models with foreign keys and relationship attributes |
| MySQL relational database | Normalised schema with referential integrity via foreign key constraints |
| Multi-user data isolation | Every expense query filters by the authenticated user's ID from the JWT payload |
| Activity logging | Database audit trail for login, logout, register, and all expense mutations |
| Live search | Client-side filtering using useMemo — no extra API calls needed |
| Separation of concerns | API logic in `services/api.js`, auth state in `AuthContext`, UI in components and pages |
| Error handling | Try/catch on all async functions; 401 responses clear auth state and redirect to login |

---

## Challenges Faced

- **JWT integration across the stack:**
Getting the token to flow correctly from login through localStorage and then into every API request required careful coordination between the AuthContext, the api.js helper, and the FastAPI `HTTPBearer` dependency. A missing or malformed header produced 401 errors that were initially hard to diagnose.

- **Role-based routing on the frontend:**
React Router does not have built-in auth guards, so I had to create wrapper components (`ProtectedRoute`, `AdminRoute`, `PublicRoute`) that check the auth context before deciding what to render. Getting the redirect logic right for all cases — not logged in, logged in but not admin, already logged in visiting the login page — took several iterations.

- **Database relationships and cascade behaviour:**
Adding `user_id` as a foreign key to the existing expenses table required understanding how SQLAlchemy handles relationships and cascade deletes. I also needed to reconsider how ORM queries were structured to filter by the authenticated user rather than returning all rows.

- **Token expiry and session handling:**
JWTs expire after 24 hours. I had to handle the case where a user's stored token had expired, meaning the API returned a 401. The solution was to detect 401 responses in the `request()` helper, clear localStorage, and let the frontend redirect to the login page automatically.

- **Keeping activity logging consistent:**
Every route that modifies data needed a corresponding entry written to `user_activity`. Managing this without duplicating code meant using a small shared helper function inside each route file rather than middleware.

---

*Expense Tracker — Assignment 2 | Built with React + FastAPI + MySQL*
