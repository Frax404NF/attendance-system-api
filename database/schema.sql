-- Employee Attendance System Database Schema
-- Migration: 001_initial_schema
-- Description: Create initial database structure for employees and attendance
-- Created: 2024-01-15

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS employees;

-- Create employees table
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key constraints
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Create attendance table
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_manager ON employees(manager_id);

-- Add comments to tables
ALTER TABLE employees COMMENT = 'Employee information and organizational hierarchy';
ALTER TABLE attendance COMMENT = 'Daily attendance records for employees';
-- Sample Employee Data
-- Seed: 001_sample_employees
-- Description: Insert sample employees for testing and development
-- Note: Run after 001_initial_schema.sql

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE attendance;
TRUNCATE TABLE employees;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert managers first (no manager_id)
INSERT INTO employees (id, name, email, department, manager_id) VALUES
(1, 'Sarah Johnson', 'sarah.johnson@company.com', 'Management', NULL),
(2, 'Tom Wilson', 'tom.wilson@company.com', 'IT', 1);

-- Insert regular employees
INSERT INTO employees (id, name, email, department, manager_id) VALUES
(3, 'Alice Smith', 'alice.smith@company.com', 'IT', 2),
(4, 'Bob Davis', 'bob.davis@company.com', 'Design', 1),
(5, 'Charlie Brown', 'charlie.brown@company.com', 'IT', 2),
(6, 'Diana Martinez', 'diana.martinez@company.com', 'IT', 2),
(7, 'Eve Anderson', 'eve.anderson@company.com', 'Marketing', 1),
(8, 'Frank Miller', 'frank.miller@company.com', 'HR', 1),
(9, 'Grace Lee', 'grace.lee@company.com', 'Finance', 1),
(10, 'Henry Garcia', 'henry.garcia@company.com', 'IT', 2);

-- Reset auto increment
ALTER TABLE employees AUTO_INCREMENT = 11;

-- Sample Attendance Data
-- Insert attendance for today (some employees checked in)
INSERT INTO attendance (employee_id, date, check_in_time) VALUES
(2, CURDATE(), CONCAT(CURDATE(), ' 08:45:00')),
(3, CURDATE(), CONCAT(CURDATE(), ' 09:15:00')),
(4, CURDATE(), CONCAT(CURDATE(), ' 08:30:00')),
(5, CURDATE(), CONCAT(CURDATE(), ' 09:20:00'));

-- Insert historical attendance data (last 3 days)
INSERT INTO attendance (employee_id, date, check_in_time, check_out_time) VALUES
-- Day -1
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:30:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:30:00')),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:00:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:00:00')),
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:45:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:15:00')),
-- Day -2
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 08:35:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 17:25:00')),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 08:55:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 17:50:00')),
(7, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 08:40:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 17:20:00'));
