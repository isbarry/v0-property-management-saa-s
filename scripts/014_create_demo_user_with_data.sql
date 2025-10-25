-- Create demo user with sample data for property management system
-- This script creates a complete dataset for testing and demonstration

-- Clean up any existing demo user data first
DELETE FROM payments WHERE reservation_id IN (
  SELECT id FROM reservations WHERE user_id IN (
    SELECT id FROM users WHERE email = 'demo@property.com'
  )
);

DELETE FROM expenses WHERE user_id IN (
  SELECT id FROM users WHERE email = 'demo@property.com'
);

DELETE FROM maintenance_requests WHERE property_id IN (
  SELECT id FROM properties WHERE user_id IN (
    SELECT id FROM users WHERE email = 'demo@property.com'
  )
);

DELETE FROM reservations WHERE user_id IN (
  SELECT id FROM users WHERE email = 'demo@property.com'
);

DELETE FROM tenants WHERE user_id IN (
  SELECT id FROM users WHERE email = 'demo@property.com'
);

DELETE FROM properties WHERE user_id IN (
  SELECT id FROM users WHERE email = 'demo@property.com'
);

DELETE FROM locations WHERE user_id IN (
  SELECT id FROM users WHERE email = 'demo@property.com'
);

DELETE FROM users WHERE email = 'demo@property.com';

-- Create demo user
-- Email: demo@property.com
-- Password: Demo2025!
-- Password hash generated with bcrypt (10 rounds)
INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at)
VALUES (
  'demo-user-uuid-2025',
  'demo@property.com',
  '$2b$10$rZ5LQ5YXJ3xKGHF5qN5zXeYvF8K9mH3jP2wL4nR6tS8vU9xW0yZ1e',
  'Demo',
  'User',
  NOW(),
  NOW()
);

-- Create locations
INSERT INTO locations (name, user_id, created_at, updated_at) VALUES
('Senegambia, Kololi', 'demo-user-uuid-2025', NOW(), NOW()),
('Kotu Beach Area', 'demo-user-uuid-2025', NOW(), NOW()),
('Cape Point, Bakau', 'demo-user-uuid-2025', NOW(), NOW()),
('Bijilo, Kombo North', 'demo-user-uuid-2025', NOW(), NOW());

-- Create properties
INSERT INTO properties (
  user_id, name, location_id, bedrooms, bathrooms, 
  max_guests, nightly_rate, weekly_rate, monthly_rate,
  amenities, images, status, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  'Sunset Villa',
  id,
  3,
  2,
  6,
  150.00,
  900.00,
  3200.00,
  ARRAY['WiFi', 'Air Conditioning', 'Pool', 'Kitchen', 'Parking', 'TV'],
  ARRAY['/modern-villa-sunset.jpg'],
  'available',
  NOW(),
  NOW()
FROM locations WHERE name = 'Senegambia, Kololi' AND user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO properties (
  user_id, name, location_id, bedrooms, bathrooms,
  max_guests, nightly_rate, weekly_rate, monthly_rate,
  amenities, images, status, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  'Beachfront Bungalow',
  id,
  2,
  1,
  4,
  120.00,
  700.00,
  2500.00,
  ARRAY['WiFi', 'Beach Access', 'Kitchen', 'Parking', 'Garden'],
  ARRAY['/garden-house-tropical.jpg'],
  'available',
  NOW(),
  NOW()
FROM locations WHERE name = 'Kotu Beach Area' AND user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO properties (
  user_id, name, location_id, bedrooms, bathrooms,
  max_guests, nightly_rate, weekly_rate, monthly_rate,
  amenities, images, status, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  'Garden House Retreat',
  id,
  4,
  3,
  8,
  200.00,
  1200.00,
  4500.00,
  ARRAY['WiFi', 'Air Conditioning', 'Pool', 'Kitchen', 'Parking', 'TV', 'Garden', 'BBQ'],
  ARRAY['/modern-villa-sunset.jpg'],
  'available',
  NOW(),
  NOW()
FROM locations WHERE name = 'Cape Point, Bakau' AND user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO properties (
  user_id, name, location_id, bedrooms, bathrooms,
  max_guests, nightly_rate, weekly_rate, monthly_rate,
  amenities, images, status, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  'Cozy Studio Apartment',
  id,
  1,
  1,
  2,
  80.00,
  450.00,
  1600.00,
  ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Parking'],
  ARRAY['/garden-house-tropical.jpg'],
  'available',
  NOW(),
  NOW()
FROM locations WHERE name = 'Bijilo, Kombo North' AND user_id = 'demo-user-uuid-2025'
LIMIT 1;

-- Create tenants
INSERT INTO tenants (
  user_id, first_name, last_name, email, phone, 
  date_of_birth, nationality, passport_number,
  emergency_contact_name, emergency_contact_phone,
  created_at, updated_at
) VALUES
(
  'demo-user-uuid-2025',
  'Fatou',
  'Jallow',
  'fatou.jallow@email.com',
  '+220 234 5678',
  '1985-03-15',
  'Gambian',
  'GM123456',
  'Mariama Jallow',
  '+220 345 6789',
  NOW(),
  NOW()
),
(
  'demo-user-uuid-2025',
  'Lamin',
  'Ceesay',
  'lamin.ceesay@email.com',
  '+220 456 7890',
  '1990-07-22',
  'Gambian',
  'GM234567',
  'Isatou Ceesay',
  '+220 567 8901',
  NOW(),
  NOW()
),
(
  'demo-user-uuid-2025',
  'Mariama',
  'Sanneh',
  'mariama.sanneh@email.com',
  '+220 678 9012',
  '1988-11-30',
  'Gambian',
  'GM345678',
  'Ousman Sanneh',
  '+220 789 0123',
  NOW(),
  NOW()
);

-- Create reservations (mix of past, current, and future)
-- Past reservation (completed)
INSERT INTO reservations (
  user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
  check_in, check_out, number_of_guests, reservation_type,
  total_amount, paid_amount, status, notes, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  t.id,
  'Fatou Jallow',
  'fatou.jallow@email.com',
  '+220 234 5678',
  '2025-01-05',
  '2025-01-12',
  4,
  'short-term',
  1050.00,
  1050.00,
  'completed',
  'Wonderful stay, very clean property',
  NOW(),
  NOW()
FROM properties p, tenants t
WHERE p.name = 'Sunset Villa' 
  AND p.user_id = 'demo-user-uuid-2025'
  AND t.email = 'fatou.jallow@email.com'
LIMIT 1;

-- Current reservation (checked in)
INSERT INTO reservations (
  user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
  check_in, check_out, number_of_guests, reservation_type,
  total_amount, paid_amount, status, notes, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  t.id,
  'Lamin Ceesay',
  'lamin.ceesay@email.com',
  '+220 456 7890',
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '5 days',
  2,
  'short-term',
  840.00,
  840.00,
  'confirmed',
  'Extended stay guest',
  NOW(),
  NOW()
FROM properties p, tenants t
WHERE p.name = 'Beachfront Bungalow'
  AND p.user_id = 'demo-user-uuid-2025'
  AND t.email = 'lamin.ceesay@email.com'
LIMIT 1;

-- Future reservation (confirmed)
INSERT INTO reservations (
  user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
  check_in, check_out, number_of_guests, reservation_type,
  total_amount, paid_amount, status, notes, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  t.id,
  'Mariama Sanneh',
  'mariama.sanneh@email.com',
  '+220 678 9012',
  CURRENT_DATE + INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '17 days',
  6,
  'short-term',
  1400.00,
  700.00,
  'confirmed',
  'Family vacation',
  NOW(),
  NOW()
FROM properties p, tenants t
WHERE p.name = 'Garden House Retreat'
  AND p.user_id = 'demo-user-uuid-2025'
  AND t.email = 'mariama.sanneh@email.com'
LIMIT 1;

-- Another past reservation
INSERT INTO reservations (
  user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
  check_in, check_out, number_of_guests, reservation_type,
  total_amount, paid_amount, status, notes, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  t.id,
  'Lamin Ceesay',
  'lamin.ceesay@email.com',
  '+220 456 7890',
  '2025-02-01',
  '2025-02-08',
  2,
  'short-term',
  560.00,
  560.00,
  'completed',
  'Repeat guest',
  NOW(),
  NOW()
FROM properties p, tenants t
WHERE p.name = 'Cozy Studio Apartment'
  AND p.user_id = 'demo-user-uuid-2025'
  AND t.email = 'lamin.ceesay@email.com'
LIMIT 1;

-- Future reservation (pending)
INSERT INTO reservations (
  user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
  check_in, check_out, number_of_guests, reservation_type,
  total_amount, paid_amount, status, notes, created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  t.id,
  'Fatou Jallow',
  'fatou.jallow@email.com',
  '+220 234 5678',
  CURRENT_DATE + INTERVAL '20 days',
  CURRENT_DATE + INTERVAL '25 days',
  4,
  'short-term',
  750.00,
  0.00,
  'pending',
  'Awaiting payment confirmation',
  NOW(),
  NOW()
FROM properties p, tenants t
WHERE p.name = 'Sunset Villa'
  AND p.user_id = 'demo-user-uuid-2025'
  AND t.email = 'fatou.jallow@email.com'
LIMIT 1;

-- Create expenses (various categories throughout the year)
INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'utilities',
  125.50,
  'Electricity bill - January',
  '2025-01-15',
  'bank_transfer',
  'NAWEC',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Sunset Villa' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'maintenance',
  450.00,
  'Pool cleaning and maintenance',
  '2025-01-20',
  'cash',
  'Pool Services Ltd',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Sunset Villa' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'cleaning',
  80.00,
  'Deep cleaning after guest checkout',
  '2025-01-13',
  'cash',
  'Clean & Shine Services',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Sunset Villa' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'utilities',
  95.00,
  'Water bill - January',
  '2025-01-18',
  'bank_transfer',
  'NAWEC',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Beachfront Bungalow' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'supplies',
  150.00,
  'Bedding, towels, and toiletries',
  '2025-02-01',
  'credit_card',
  'Home Essentials Store',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Beachfront Bungalow' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'maintenance',
  320.00,
  'Air conditioning service and repair',
  '2025-02-10',
  'bank_transfer',
  'Cool Air Services',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Garden House Retreat' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'utilities',
  180.00,
  'Electricity bill - February',
  '2025-02-15',
  'bank_transfer',
  'NAWEC',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Garden House Retreat' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'cleaning',
  60.00,
  'Regular cleaning service',
  '2025-02-20',
  'cash',
  'Clean & Shine Services',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Cozy Studio Apartment' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'insurance',
  850.00,
  'Annual property insurance premium',
  '2025-01-01',
  'bank_transfer',
  'Gambia Insurance Company',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Sunset Villa' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'marketing',
  200.00,
  'Online listing fees - Q1',
  '2025-01-05',
  'credit_card',
  'Booking Platforms',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Sunset Villa' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'supplies',
  120.00,
  'Kitchen supplies and utensils',
  '2025-02-05',
  'cash',
  'Kitchen World',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Garden House Retreat' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'maintenance',
  275.00,
  'Plumbing repair - bathroom leak',
  '2025-02-12',
  'cash',
  'Quick Fix Plumbing',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Beachfront Bungalow' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'utilities',
  65.00,
  'Internet service - February',
  '2025-02-01',
  'bank_transfer',
  'Gamtel',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Cozy Studio Apartment' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'landscaping',
  180.00,
  'Garden maintenance and landscaping',
  '2025-02-08',
  'cash',
  'Green Gardens',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Garden House Retreat' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO expenses (
  user_id, property_id, category, amount, description,
  expense_date, payment_method, vendor, receipt_url,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  p.id,
  'cleaning',
  90.00,
  'Post-checkout deep cleaning',
  '2025-02-09',
  'cash',
  'Clean & Shine Services',
  NULL,
  NOW(),
  NOW()
FROM properties p
WHERE p.name = 'Cozy Studio Apartment' AND p.user_id = 'demo-user-uuid-2025'
LIMIT 1;

-- Create payments linked to reservations
INSERT INTO payments (
  user_id, reservation_id, amount, payment_method,
  payment_date, transaction_id, status, notes,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  r.id,
  1050.00,
  'bank_transfer',
  '2025-01-03',
  'TXN-2025-001',
  'completed',
  'Full payment received before check-in',
  NOW(),
  NOW()
FROM reservations r
WHERE r.guest_email = 'fatou.jallow@email.com'
  AND r.check_in = '2025-01-05'
  AND r.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO payments (
  user_id, reservation_id, amount, payment_method,
  payment_date, transaction_id, status, notes,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  r.id,
  840.00,
  'credit_card',
  CURRENT_DATE - INTERVAL '3 days',
  'TXN-2025-002',
  'completed',
  'Online payment via credit card',
  NOW(),
  NOW()
FROM reservations r
WHERE r.guest_email = 'lamin.ceesay@email.com'
  AND r.check_in = CURRENT_DATE - INTERVAL '2 days'
  AND r.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO payments (
  user_id, reservation_id, amount, payment_method,
  payment_date, transaction_id, status, notes,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  r.id,
  700.00,
  'bank_transfer',
  CURRENT_DATE + INTERVAL '5 days',
  'TXN-2025-003',
  'completed',
  '50% deposit payment',
  NOW(),
  NOW()
FROM reservations r
WHERE r.guest_email = 'mariama.sanneh@email.com'
  AND r.check_in = CURRENT_DATE + INTERVAL '10 days'
  AND r.user_id = 'demo-user-uuid-2025'
LIMIT 1;

INSERT INTO payments (
  user_id, reservation_id, amount, payment_method,
  payment_date, transaction_id, status, notes,
  created_at, updated_at
)
SELECT 
  'demo-user-uuid-2025',
  r.id,
  560.00,
  'cash',
  '2025-01-31',
  'TXN-2025-004',
  'completed',
  'Cash payment on arrival',
  NOW(),
  NOW()
FROM reservations r
WHERE r.guest_email = 'lamin.ceesay@email.com'
  AND r.check_in = '2025-02-01'
  AND r.user_id = 'demo-user-uuid-2025'
LIMIT 1;

-- Success message
SELECT 'Demo user created successfully!' as message,
       'Email: demo@property.com' as email,
       'Password: Demo2025!' as password;
