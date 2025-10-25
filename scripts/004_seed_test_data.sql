-- Seed test data for property management platform
-- Associates all data with the most recently created user

DO $$
DECLARE
  demo_user_id text;
BEGIN
  -- Fetch the most recently created user instead of creating a new one
  SELECT id INTO demo_user_id 
  FROM neon_auth.users_sync 
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Check if a user exists
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found in neon_auth.users_sync. Please create a user first.';
  END IF;

  RAISE NOTICE 'Using user ID: %', demo_user_id;

  -- Insert Properties
  INSERT INTO properties (
    user_id, name, address, city, state, country, postal_code, property_type, rental_type,
    bedrooms, bathrooms, max_guests, square_feet, description, status, amenities, images,
    created_at, updated_at
  )
  VALUES
    (demo_user_id, 'Sunset Villa', '123 Beach Road', 'Kololi', 'Serrekunda', 'Gambia', '00000', 'villa', 'short-term', 4, 3.5, 8, 2500, 'Luxurious villa with stunning sunset views', 'active', '["WiFi", "Pool", "Air Conditioning", "Kitchen"]'::jsonb, '["/modern-luxury-villa-sunset.jpg"]'::jsonb, NOW(), NOW()),
    (demo_user_id, 'Ocean View Apartment', '456 Coastal Avenue', 'Cape Point', 'Bakau', 'Gambia', '00000', 'apartment', 'short-term', 2, 2, 4, 1200, 'Modern apartment with ocean views', 'active', '["WiFi", "Balcony", "Air Conditioning"]'::jsonb, '["/ocean-view-apartment.jpg"]'::jsonb, NOW(), NOW()),
    (demo_user_id, 'Garden House', '789 Palm Street', 'Fajara', 'Kanifing', 'Gambia', '00000', 'house', 'long-term', 3, 2, 6, 1800, 'Charming house with tropical garden', 'inactive', '["WiFi", "Garden", "Parking"]'::jsonb, '["/tropical-garden-house.jpg"]'::jsonb, NOW(), NOW()),
    (demo_user_id, 'City Center Studio', '321 Market Road', 'Westfield', 'Serrekunda', 'Gambia', '00000', 'studio', 'short-term', 1, 1, 2, 600, 'Compact studio in the heart of the city', 'maintenance', '["WiFi", "Air Conditioning"]'::jsonb, '["/modern-studio-apartment.png"]'::jsonb, NOW(), NOW()),
    -- Changed property_type from 'bungalow' to 'house' to match constraint
    (demo_user_id, 'Beachfront Bungalow', '555 Seaside Lane', 'Kotu', 'Serrekunda', 'Gambia', '00000', 'house', 'short-term', 3, 2, 6, 1500, 'Cozy bungalow steps from the beach', 'active', '["WiFi", "Beach Access", "BBQ"]'::jsonb, '["/beachfront-bungalow.png"]'::jsonb, NOW(), NOW()),
    (demo_user_id, 'Palm Residence', '888 Tropical Drive', 'Bijilo', 'Kanifing', 'Gambia', '00000', 'house', 'long-term', 4, 3, 8, 2200, 'Spacious residence surrounded by palm trees', 'inactive', '["WiFi", "Pool", "Garden", "Security"]'::jsonb, '["/palm-tree-residence.jpg"]'::jsonb, NOW(), NOW());

  -- Insert Tenants
  INSERT INTO tenants (
    user_id, first_name, last_name, email, phone, date_of_birth, identification_type,
    identification_number, emergency_contact_name, emergency_contact_phone, status, created_at, updated_at
  )
  VALUES
    (demo_user_id, 'Fatou', 'Jallow', 'fatou.jallow@email.com', '+220 123 4567', '1990-05-15', 'passport', 'P123456', 'Aminata Jallow', '+220 111 2222', 'active', NOW(), NOW()),
    (demo_user_id, 'Lamin', 'Ceesay', 'lamin.ceesay@email.com', '+220 234 5678', '1985-08-22', 'national_id', 'N789012', 'Binta Ceesay', '+220 333 4444', 'active', NOW(), NOW()),
    (demo_user_id, 'Mariama', 'Sanneh', 'mariama.sanneh@email.com', '+220 345 6789', '1992-11-30', 'passport', 'P345678', 'Ousman Sanneh', '+220 555 6666', 'active', NOW(), NOW());

  -- Insert Reservations
  INSERT INTO reservations (user_id, property_id, tenant_id, check_in, check_out, number_of_guests,
                            total_amount, paid_amount, status, reservation_type,
                            guest_name, guest_email, guest_phone, notes, created_at, updated_at)
  SELECT demo_user_id, p.id, t.id, '2025-02-01', '2025-02-28', 4, 14000, 14000,
         'confirmed', 'short-term', 'Fatou Jallow', 'fatou.jallow@email.com',
         '+220 123 4567', 'First reservation', NOW(), NOW()
  FROM properties p, tenants t
  WHERE p.name = 'Sunset Villa' AND t.email = 'fatou.jallow@email.com' AND p.user_id = demo_user_id;

  INSERT INTO reservations (user_id, property_id, tenant_id, check_in, check_out, number_of_guests,
                            total_amount, paid_amount, status, reservation_type,
                            guest_name, guest_email, guest_phone, created_at, updated_at)
  SELECT demo_user_id, p.id, t.id, '2025-02-10', '2025-03-10', 3, 17000, 0,
         'pending', 'long-term', 'Lamin Ceesay', 'lamin.ceesay@email.com',
         '+220 234 5678', NOW(), NOW()
  FROM properties p, tenants t
  WHERE p.name = 'Garden House' AND t.email = 'lamin.ceesay@email.com' AND p.user_id = demo_user_id;

  INSERT INTO reservations (user_id, property_id, tenant_id, check_in, check_out, number_of_guests,
                            total_amount, paid_amount, status, reservation_type,
                            guest_name, guest_email, guest_phone, created_at, updated_at)
  SELECT demo_user_id, p.id, t.id, '2025-02-15', '2025-03-15', 5, 15500, 15500,
         'confirmed', 'long-term', 'Mariama Sanneh', 'mariama.sanneh@email.com',
         '+220 345 6789', NOW(), NOW()
  FROM properties p, tenants t
  WHERE p.name = 'Palm Residence' AND t.email = 'mariama.sanneh@email.com' AND p.user_id = demo_user_id;

  INSERT INTO reservations (user_id, property_id, check_in, check_out, number_of_guests,
                            total_amount, paid_amount, status, reservation_type,
                            guest_name, guest_email, guest_phone, created_at, updated_at)
  SELECT demo_user_id, p.id, '2025-02-05', '2025-02-20', 2, 9000, 9000,
         'confirmed', 'short-term', 'John Smith', 'john.smith@email.com',
         '+220 456 7890', NOW(), NOW()
  FROM properties p
  WHERE p.name = 'Ocean View Apartment' AND p.user_id = demo_user_id;

  INSERT INTO reservations (user_id, property_id, check_in, check_out, number_of_guests,
                            total_amount, paid_amount, status, reservation_type,
                            guest_name, guest_email, guest_phone, created_at, updated_at)
  SELECT demo_user_id, p.id, '2025-02-12', '2025-02-26', 4, 8400, 4200,
         'confirmed', 'short-term', 'Sarah Johnson', 'sarah.j@email.com',
         '+220 567 8901', NOW(), NOW()
  FROM properties p
  WHERE p.name = 'Beachfront Bungalow' AND p.user_id = demo_user_id;

  -- Blocked Dates
  INSERT INTO blocked_dates (user_id, property_id, start_date, end_date, reason, created_at)
  SELECT demo_user_id, p.id, '2025-02-01', '2025-03-15', 'Kitchen renovation in progress', NOW()
  FROM properties p WHERE p.name = 'City Center Studio' AND p.user_id = demo_user_id;

  INSERT INTO blocked_dates (user_id, property_id, start_date, end_date, reason, created_at)
  SELECT demo_user_id, p.id, '2025-02-01', '2025-02-07', 'Annual deep cleaning', NOW()
  FROM properties p WHERE p.name = 'Palm Residence' AND p.user_id = demo_user_id;

  INSERT INTO blocked_dates (user_id, property_id, start_date, end_date, reason, created_at)
  SELECT demo_user_id, p.id, '2025-02-01', '2025-02-05', 'Maintenance work', NOW()
  FROM properties p WHERE p.name = 'Garden House' AND p.user_id = demo_user_id;

  -- Payments
  INSERT INTO payments (user_id, property_id, tenant_id, reservation_id, amount, payment_date,
                        payment_method, payment_type, status, transaction_id, created_at, updated_at)
  SELECT demo_user_id, p.id, t.id, r.id, 14000, '2025-02-01', 'bank_transfer', 'rent', 'completed', 'TXN001', NOW(), NOW()
  FROM properties p, tenants t, reservations r
  WHERE p.name = 'Sunset Villa' AND t.email = 'fatou.jallow@email.com'
    AND r.property_id = p.id AND r.guest_email = 'fatou.jallow@email.com' AND p.user_id = demo_user_id
  LIMIT 1;

  INSERT INTO payments (user_id, property_id, reservation_id, amount, payment_date,
                        payment_method, payment_type, status, transaction_id, created_at, updated_at)
  SELECT demo_user_id, p.id, r.id, 9000, '2025-02-05', 'credit_card', 'rent', 'completed', 'TXN002', NOW(), NOW()
  FROM properties p, reservations r
  WHERE p.name = 'Ocean View Apartment' AND r.property_id = p.id 
    AND r.guest_email = 'john.smith@email.com' AND p.user_id = demo_user_id
  LIMIT 1;

  -- Expenses
  INSERT INTO expenses (user_id, property_id, amount, description, category, expense_date,
                        vendor, status, payment_method, is_recurring, created_at, updated_at)
  SELECT demo_user_id, p.id, 2500, 'AC unit servicing', 'maintenance', '2024-12-15', 
         'Cool Air Services', 'paid', 'bank_transfer', false, NOW(), NOW()
  FROM properties p WHERE p.name = 'Sunset Villa' AND p.user_id = demo_user_id;

  INSERT INTO expenses (user_id, property_id, amount, description, category, expense_date,
                        vendor, status, payment_method, is_recurring, created_at, updated_at)
  SELECT demo_user_id, p.id, 3000, 'Roof inspection', 'maintenance', '2025-01-10',
         'Roof Masters', 'paid', 'bank_transfer', false, NOW(), NOW()
  FROM properties p WHERE p.name = 'Ocean View Apartment' AND p.user_id = demo_user_id;

  INSERT INTO expenses (user_id, property_id, amount, description, category, expense_date,
                        vendor, status, payment_method, is_recurring, recurring_frequency, created_at, updated_at)
  SELECT demo_user_id, p.id, 1500, 'Monthly cleaning service', 'cleaning', '2025-01-01',
         'Clean Pro', 'paid', 'bank_transfer', true, 'monthly', NOW(), NOW()
  FROM properties p WHERE p.name = 'Garden House' AND p.user_id = demo_user_id;

  INSERT INTO expenses (user_id, property_id, amount, description, category, expense_date,
                        vendor, status, payment_method, is_recurring, created_at, updated_at)
  SELECT demo_user_id, p.id, 800, 'Plumbing repair', 'maintenance', '2025-01-15',
         'Quick Fix Plumbing', 'paid', 'cash', false, NOW(), NOW()
  FROM properties p WHERE p.name = 'City Center Studio' AND p.user_id = demo_user_id;

  INSERT INTO expenses (user_id, property_id, amount, description, category, expense_date,
                        vendor, status, payment_method, is_recurring, created_at, updated_at)
  SELECT demo_user_id, p.id, 1200, 'Garden landscaping', 'maintenance', '2025-01-20',
         'Green Thumb Gardens', 'paid', 'bank_transfer', false, NOW(), NOW()
  FROM properties p WHERE p.name = 'Beachfront Bungalow' AND p.user_id = demo_user_id;

  INSERT INTO expenses (user_id, property_id, amount, description, category, expense_date,
                        vendor, status, payment_method, is_recurring, recurring_frequency, created_at, updated_at)
  SELECT demo_user_id, p.id, 2000, 'Pool maintenance', 'utilities', '2025-02-01',
         'Pool Care Plus', 'paid', 'bank_transfer', true, 'monthly', NOW(), NOW()
  FROM properties p WHERE p.name = 'Palm Residence' AND p.user_id = demo_user_id;

  INSERT INTO expenses (user_id, property_id, amount, description, category, expense_date,
                        vendor, status, payment_method, is_recurring, created_at, updated_at)
  SELECT demo_user_id, p.id, 500, 'Security system upgrade', 'utilities', '2025-01-25',
         'SecureHome', 'paid', 'credit_card', false, NOW(), NOW()
  FROM properties p WHERE p.name = 'Sunset Villa' AND p.user_id = demo_user_id;

  RAISE NOTICE 'Successfully seeded data for user: %', demo_user_id;

END $$;
