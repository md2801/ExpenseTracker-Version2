-- ============================================================
-- expense_db.sql  (Assignment 2 — extended schema)
-- NEW:  users table, user_activity table
-- UPDATED: expenses now has user_id foreign key
-- ============================================================

CREATE DATABASE IF NOT EXISTS expense_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE expense_db;

-- Drop tables in reverse FK order for clean re-runs
DROP TABLE IF EXISTS user_activity;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS users;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100)  NOT NULL UNIQUE,
    email      VARCHAR(255)  NOT NULL UNIQUE,
    password   VARCHAR(255)  NOT NULL,
    role       ENUM('user','admin') NOT NULL DEFAULT 'user',
    is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. EXPENSES  (user_id FK added)
-- ============================================================
CREATE TABLE expenses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT            NOT NULL,
    title       VARCHAR(255)   NOT NULL,
    category    VARCHAR(100)   NOT NULL,
    amount      DECIMAL(10,2)  NOT NULL,
    date        DATE           NOT NULL,
    description TEXT           DEFAULT NULL,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. USER_ACTIVITY  (audit log)
-- ============================================================
CREATE TABLE user_activity (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    action     VARCHAR(100) NOT NULL,
    detail     TEXT         DEFAULT NULL,
    ip_address VARCHAR(50)  DEFAULT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- admin / admin123  and  john / password123
-- ============================================================
INSERT INTO users (username, email, password, role) VALUES
('admin','admin@example.com','$2b$12$34Wfzb7yYqfVcA2s5ugRfOUN4QOfyuQUcZgXS7B4PBc3hjHEzosMG','admin'),
('john', 'john@example.com', '$2b$12$.H9JcRQaIbUCXrf5V3kyzeORhw6lXKrHVZDCr/bmgy.SOZPA8iDja','user');

INSERT INTO expenses (user_id,title,category,amount,date,description) VALUES
(2,'Weekly Groceries','Food',85.50,'2025-07-01','Woolworths run'),
(2,'Monthly Bus Pass','Transport',120.00,'2025-07-01','Transport top-up'),
(2,'Netflix','Entertainment',22.99,'2025-07-02','Streaming sub'),
(2,'Coffee & Lunch','Food',18.40,'2025-07-03','Cafe'),
(2,'Python Textbook','Education',55.00,'2025-07-04','Core Python'),
(2,'Electricity Bill','Utilities',145.00,'2025-07-05','Quarterly electricity'),
(2,'Gym Membership','Health',49.95,'2025-07-06','Monthly gym'),
(2,'Online Course React','Education',29.99,'2025-07-10','Udemy React'),
(1,'Server Hosting','Utilities',199.00,'2025-07-01','Cloud server'),
(1,'Domain Renewal','Utilities',25.00,'2025-07-03','Annual domain'),
(1,'Software Licenses','Education',350.00,'2025-07-05','Dev tooling');

INSERT INTO user_activity (user_id,action,detail) VALUES
(1,'LOGIN','Seed: admin first login'),
(2,'LOGIN','Seed: john first login'),
(2,'CREATE_EXPENSE','Seed: Weekly Groceries'),
(2,'CREATE_EXPENSE','Seed: Netflix');
