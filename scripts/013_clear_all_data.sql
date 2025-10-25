-- Clear all data from the database
-- This script deletes all data from all tables in the correct order to respect foreign key constraints

-- Delete child tables first (tables with foreign keys)
DELETE FROM payments;
DELETE FROM expenses;
DELETE FROM maintenance_requests;
DELETE FROM reservations;
DELETE FROM tenants;
DELETE FROM properties;
DELETE FROM locations;

-- Optionally, you can also delete users if you want to start completely fresh
-- DELETE FROM users;

-- Reset sequences (optional - this resets auto-increment IDs back to 1)
-- ALTER SEQUENCE payments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE expenses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE maintenance_requests_id_seq RESTART WITH 1;
-- ALTER SEQUENCE reservations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE tenants_id_seq RESTART WITH 1;
-- ALTER SEQUENCE properties_id_seq RESTART WITH 1;
-- ALTER SEQUENCE locations_id_seq RESTART WITH 1;
