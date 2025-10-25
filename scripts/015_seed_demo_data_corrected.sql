-- Clear existing data first (optional - comment out if you want to keep existing data)
DELETE FROM payments;
DELETE FROM expenses;
DELETE FROM maintenance_requests;
DELETE FROM reservations;
DELETE FROM tenants;
DELETE FROM properties;
DELETE FROM locations;
DELETE FROM blocked_dates;

-- Updated password_hash to use temp_ prefix format instead of bcrypt
-- Create demo user with known credentials
-- Password: Demo2025!
INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
VALUES (
  'demo-user-2025',
  'demo@property.com',
  'temp_Demo2025!',
  'Demo User',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Create locations
INSERT INTO locations (user_id, name, created_at, updated_at) VALUES
('demo-user-2025', 'Kololi, Gambia', NOW(), NOW()),
('demo-user-2025', 'Senegambia, Gambia', NOW(), NOW()),
('demo-user-2025', 'Kotu, Gambia', NOW(), NOW()),
('demo-user-2025', 'Bijilo, Gambia', NOW(), NOW());

-- Updated property types and status to match database constraints
-- Create properties
INSERT INTO properties (
  user_id, name, description, property_type, rental_type, location, location_id,
  bedrooms, bathrooms, square_feet, max_guests, status, amenities, images,
  created_at, updated_at
) VALUES
(
  'demo-user-2025',
  'Sunset Villa',
  'Luxurious beachfront villa with stunning ocean views',
  'villa',
  'short-term',
  'Kololi, Gambia',
  (SELECT id FROM locations WHERE name = 'Kololi, Gambia' AND user_id = 'demo-user-2025' LIMIT 1),
  4,
  3.5,
  2500,
  8,
  'active',
  '["WiFi", "Pool", "Air Conditioning", "Kitchen", "Parking", "Beach Access"]'::jsonb,
  '["/modern-villa-sunset.jpg"]'::jsonb,
  NOW(),
  NOW()
),
(
  'demo-user-2025',
  'Beachfront Bungalow',
  'Cozy bungalow steps from the beach',
  'house',
  'short-term',
  'Senegambia, Gambia',
  (SELECT id FROM locations WHERE name = 'Senegambia, Gambia' AND user_id = 'demo-user-2025' LIMIT 1),
  2,
  2,
  1200,
  4,
  'active',
  '["WiFi", "Air Conditioning", "Kitchen", "Beach Access"]'::jsonb,
  '["/garden-house-tropical.jpg"]'::jsonb,
  NOW(),
  NOW()
),
(
  'demo-user-2025',
  'Garden House Retreat',
  'Peaceful retreat surrounded by tropical gardens',
  'house',
  'long-term',
  'Kotu, Gambia',
  (SELECT id FROM locations WHERE name = 'Kotu, Gambia' AND user_id = 'demo-user-2025' LIMIT 1),
  3,
  2,
  1800,
  6,
  'active',
  '["WiFi", "Garden", "Air Conditioning", "Kitchen", "Parking"]'::jsonb,
  '[]'::jsonb,
  NOW(),
  NOW()
),
(
  'demo-user-2025',
  'Cozy Studio Apartment',
  'Modern studio perfect for solo travelers',
  'studio',
  'short-term',
  'Bijilo, Gambia',
  (SELECT id FROM locations WHERE name = 'Bijilo, Gambia' AND user_id = 'demo-user-2025' LIMIT 1),
  1,
  1,
  600,
  2,
  'active',
  '["WiFi", "Air Conditioning", "Kitchen"]'::jsonb,
  '[]'::jsonb,
  NOW(),
  NOW()
);

-- Create tenants
INSERT INTO tenants (
  user_id, property_id, first_name, last_name, email, phone,
  date_of_birth, identification_type, identification_number,
  emergency_contact_name, emergency_contact_phone, status,
  created_at, updated_at
) VALUES
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Beachfront Bungalow' AND user_id = 'demo-user-2025' LIMIT 1),
  'Fatou',
  'Jallow',
  'fatou.jallow@email.com',
  '+220 234 5678',
  '1985-03-15',
  'passport',
  'GM123456',
  'Mariama Jallow',
  '+220 345 6789',
  'active',
  NOW(),
  NOW()
),
(
  'demo-user-2025',
  NULL,
  'Lamin',
  'Ceesay',
  'lamin.ceesay@email.com',
  '+220 456 7890',
  '1990-07-22',
  'national_id',
  'GM789012',
  'Awa Ceesay',
  '+220 567 8901',
  'active',
  NOW(),
  NOW()
),
(
  'demo-user-2025',
  NULL,
  'Mariama',
  'Sanneh',
  'mariama.sanneh@email.com',
  '+220 678 9012',
  '1988-11-30',
  'passport',
  'GM345678',
  'Ousman Sanneh',
  '+220 789 0123',
  'active',
  NOW(),
  NOW()
);

-- Updated reservation status to use valid values
-- Create reservations
INSERT INTO reservations (
  user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
  check_in, check_out, number_of_guests, reservation_type,
  total_amount, paid_amount, status, notes,
  created_at, updated_at
) VALUES
-- Current reservation (Beachfront Bungalow)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Beachfront Bungalow' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'fatou.jallow@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  'Fatou Jallow',
  'fatou.jallow@email.com',
  '+220 234 5678',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '9 days',
  4,
  'short-term',
  20000.00,
  20000.00,
  'checked-in',
  'Family vacation',
  NOW() - INTERVAL '10 days',
  NOW()
),
-- Past reservation (Sunset Villa)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'lamin.ceesay@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  'Lamin Ceesay',
  'lamin.ceesay@email.com',
  '+220 456 7890',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '23 days',
  2,
  'short-term',
  17000.00,
  17000.00,
  'checked-out',
  'Honeymoon stay',
  NOW() - INTERVAL '35 days',
  NOW()
),
-- Future reservation (Garden House)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Garden House Retreat' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'mariama.sanneh@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  'Mariama Sanneh',
  'mariama.sanneh@email.com',
  '+220 678 9012',
  CURRENT_DATE + INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '22 days',
  3,
  'short-term',
  15000.00,
  5000.00,
  'confirmed',
  'Business trip',
  NOW(),
  NOW()
),
-- Another past reservation (Cozy Studio)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Cozy Studio Apartment' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'lamin.ceesay@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  'Lamin Ceesay',
  'lamin.ceesay@email.com',
  '+220 456 7890',
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '55 days',
  1,
  'short-term',
  8000.00,
  8000.00,
  'checked-out',
  'Solo retreat',
  NOW() - INTERVAL '65 days',
  NOW()
),
-- Future reservation (Sunset Villa)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  NULL,
  'John Smith',
  'john.smith@email.com',
  '+1 555 123 4567',
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '37 days',
  6,
  'short-term',
  25000.00,
  0.00,
  'pending',
  'Family reunion',
  NOW(),
  NOW()
);

-- Updated expense categories and payment methods to match database constraints
-- Create expenses
INSERT INTO expenses (
  user_id, property_id, category, amount, expense_date, vendor,
  description, payment_method, status, is_recurring, recurring_frequency,
  receipt_url, notes, created_at, updated_at
) VALUES
-- Utilities
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  'utilities',
  2500.00,
  CURRENT_DATE - INTERVAL '5 days',
  'NAWEC',
  'Electricity bill - January 2025',
  'bank_transfer',
  'paid',
  true,
  'monthly',
  NULL,
  'Monthly electricity',
  NOW() - INTERVAL '5 days',
  NOW()
),
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Beachfront Bungalow' AND user_id = 'demo-user-2025' LIMIT 1),
  'utilities',
  1800.00,
  CURRENT_DATE - INTERVAL '5 days',
  'NAWEC',
  'Electricity bill - January 2025',
  'bank_transfer',
  'paid',
  true,
  'monthly',
  NULL,
  'Monthly electricity',
  NOW() - INTERVAL '5 days',
  NOW()
),
-- Maintenance
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  'maintenance',
  5000.00,
  CURRENT_DATE - INTERVAL '15 days',
  'Pool Services Ltd',
  'Pool cleaning and chemical treatment',
  'cash',
  'paid',
  false,
  NULL,
  NULL,
  'Quarterly pool maintenance',
  NOW() - INTERVAL '15 days',
  NOW()
),
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Garden House Retreat' AND user_id = 'demo-user-2025' LIMIT 1),
  'maintenance',
  3500.00,
  CURRENT_DATE - INTERVAL '20 days',
  'Garden Care Services',
  'Landscaping and garden maintenance',
  'other',
  'paid',
  true,
  'monthly',
  NULL,
  'Monthly garden upkeep',
  NOW() - INTERVAL '20 days',
  NOW()
),
-- Cleaning
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Beachfront Bungalow' AND user_id = 'demo-user-2025' LIMIT 1),
  'cleaning',
  1500.00,
  CURRENT_DATE - INTERVAL '3 days',
  'Clean & Shine',
  'Deep cleaning after guest checkout',
  'cash',
  'paid',
  false,
  NULL,
  NULL,
  'Post-checkout cleaning',
  NOW() - INTERVAL '3 days',
  NOW()
),
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Cozy Studio Apartment' AND user_id = 'demo-user-2025' LIMIT 1),
  'cleaning',
  800.00,
  CURRENT_DATE - INTERVAL '7 days',
  'Clean & Shine',
  'Regular cleaning service',
  'cash',
  'paid',
  true,
  'weekly',
  NULL,
  'Weekly cleaning',
  NOW() - INTERVAL '7 days',
  NOW()
),
-- Insurance
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  'insurance',
  15000.00,
  CURRENT_DATE - INTERVAL '30 days',
  'Gambia Insurance Company',
  'Property insurance - Annual premium',
  'bank_transfer',
  'paid',
  true,
  'yearly',
  NULL,
  'Annual property insurance',
  NOW() - INTERVAL '30 days',
  NOW()
),
-- Repairs
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Beachfront Bungalow' AND user_id = 'demo-user-2025' LIMIT 1),
  'repairs',
  4200.00,
  CURRENT_DATE - INTERVAL '12 days',
  'AC Repair Services',
  'Air conditioning unit repair',
  'other',
  'paid',
  false,
  NULL,
  NULL,
  'Emergency AC repair',
  NOW() - INTERVAL '12 days',
  NOW()
),
-- Taxes
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Garden House Retreat' AND user_id = 'demo-user-2025' LIMIT 1),
  'taxes',
  8000.00,
  CURRENT_DATE - INTERVAL '45 days',
  'Gambia Revenue Authority',
  'Annual property tax',
  'bank_transfer',
  'paid',
  true,
  'yearly',
  NULL,
  'Annual property tax payment',
  NOW() - INTERVAL '45 days',
  NOW()
),
-- Marketing
(
  'demo-user-2025',
  NULL,
  'marketing',
  2000.00,
  CURRENT_DATE - INTERVAL '10 days',
  'Social Media Ads',
  'Facebook and Instagram advertising',
  'credit_card',
  'paid',
  true,
  'monthly',
  NULL,
  'Monthly marketing budget',
  NOW() - INTERVAL '10 days',
  NOW()
),
-- Supplies
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  'supplies',
  1200.00,
  CURRENT_DATE - INTERVAL '8 days',
  'Home Essentials Store',
  'Linens, towels, and toiletries',
  'cash',
  'paid',
  false,
  NULL,
  NULL,
  'Guest amenities restock',
  NOW() - INTERVAL '8 days',
  NOW()
),
-- Internet
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Beachfront Bungalow' AND user_id = 'demo-user-2025' LIMIT 1),
  'utilities',
  1500.00,
  CURRENT_DATE - INTERVAL '2 days',
  'Gamtel',
  'Internet service - Monthly',
  'bank_transfer',
  'paid',
  true,
  'monthly',
  NULL,
  'Monthly internet bill',
  NOW() - INTERVAL '2 days',
  NOW()
),
-- Management Fees
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  'management_fees',
  3000.00,
  CURRENT_DATE - INTERVAL '1 day',
  'Property Management Co',
  'Property management services - Monthly',
  'bank_transfer',
  'paid',
  true,
  'monthly',
  NULL,
  'Monthly management fee',
  NOW() - INTERVAL '1 day',
  NOW()
),
-- Pending expense
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Garden House Retreat' AND user_id = 'demo-user-2025' LIMIT 1),
  'maintenance',
  2500.00,
  CURRENT_DATE + INTERVAL '5 days',
  'Plumbing Services',
  'Scheduled plumbing inspection',
  NULL,
  'pending',
  false,
  NULL,
  NULL,
  'Upcoming maintenance',
  NOW(),
  NOW()
);

-- Updated payment_type from 'full_payment' to 'rent' to match database constraint
-- Create payments
INSERT INTO payments (
  user_id, property_id, reservation_id, tenant_id, amount, payment_date,
  payment_method, payment_type, status, transaction_id, notes,
  created_at, updated_at
) VALUES
-- Payment for current reservation
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Beachfront Bungalow' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM reservations WHERE guest_email = 'fatou.jallow@email.com' AND check_in = CURRENT_DATE - INTERVAL '5 days' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'fatou.jallow@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  20000.00,
  CURRENT_DATE - INTERVAL '10 days',
  'bank_transfer',
  'rent',
  'completed',
  'TXN-2025-001',
  'Full payment received',
  NOW() - INTERVAL '10 days',
  NOW()
),
-- Payment for past reservation (Sunset Villa)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Sunset Villa' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM reservations WHERE guest_email = 'lamin.ceesay@email.com' AND check_in = CURRENT_DATE - INTERVAL '30 days' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'lamin.ceesay@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  17000.00,
  CURRENT_DATE - INTERVAL '35 days',
  'other',
  'rent',
  'completed',
  'TXN-2024-089',
  'Full payment received',
  NOW() - INTERVAL '35 days',
  NOW()
),
-- Partial payment for future reservation (Garden House)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Garden House Retreat' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM reservations WHERE guest_email = 'mariama.sanneh@email.com' AND check_in = CURRENT_DATE + INTERVAL '15 days' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'mariama.sanneh@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  5000.00,
  CURRENT_DATE,
  'bank_transfer',
  'deposit',
  'completed',
  'TXN-2025-002',
  'Deposit payment - Balance due at check-in',
  NOW(),
  NOW()
),
-- Payment for past reservation (Cozy Studio)
(
  'demo-user-2025',
  (SELECT id FROM properties WHERE name = 'Cozy Studio Apartment' AND user_id = 'demo-user-2025' LIMIT 1),
  (SELECT id FROM reservations WHERE guest_email = 'lamin.ceesay@email.com' AND check_in = CURRENT_DATE - INTERVAL '60 days' LIMIT 1),
  (SELECT id FROM tenants WHERE email = 'lamin.ceesay@email.com' AND user_id = 'demo-user-2025' LIMIT 1),
  8000.00,
  CURRENT_DATE - INTERVAL '65 days',
  'cash',
  'rent',
  'completed',
  'TXN-2024-078',
  'Cash payment received',
  NOW() - INTERVAL '65 days',
  NOW()
);
