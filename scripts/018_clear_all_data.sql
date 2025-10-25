-- WARNING: This script will DELETE ALL DATA from the database
-- This is irreversible and should only be used for testing or resetting the database

-- Delete data from child tables first (those with foreign keys)
DELETE FROM blocked_dates;
DELETE FROM maintenance_requests;
DELETE FROM payments;
DELETE FROM expenses;
DELETE FROM reservations;
DELETE FROM tenants;
-- Removed expense_categories deletion to preserve custom categories
DELETE FROM properties;
DELETE FROM buildings;
DELETE FROM locations;
-- Removed sessions deletion to keep users logged in
-- Note: We're NOT deleting from users, sessions, or expense_categories tables to preserve login credentials, active sessions, and custom categories

-- Reset sequences (if any auto-increment columns need to be reset)
-- Note: PostgreSQL uses SERIAL which creates sequences automatically
-- These will be reset when data is deleted

SELECT 'All data cleared successfully (except users, sessions, and expense_categories tables)' as result;
