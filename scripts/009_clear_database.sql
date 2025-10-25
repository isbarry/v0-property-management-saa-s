-- Clear all data from the database (keeps tables and schema)
-- Run this script to reset your database to a clean state

-- Delete in order to respect foreign key constraints
DELETE FROM payments;
DELETE FROM expenses;
DELETE FROM maintenance_requests;
DELETE FROM reservations;
DELETE FROM tenants;
DELETE FROM properties;
DELETE FROM sessions;
DELETE FROM users;

-- Reset sequences (optional - uncomment if you want IDs to start from 1 again)
-- ALTER SEQUENCE properties_id_seq RESTART WITH 1;
-- ALTER SEQUENCE tenants_id_seq RESTART WITH 1;
-- ALTER SEQUENCE reservations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE payments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE expenses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE maintenance_requests_id_seq RESTART WITH 1;
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'maintenance_requests', COUNT(*) FROM maintenance_requests
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions;
