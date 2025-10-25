-- Seed test data for test@test.com user
-- This script creates sample properties, reservations, expenses, and payments for testing

-- First, get the user_id for test@test.com
DO $$
DECLARE
  test_user_id TEXT;
  location_id_1 INT;
  location_id_2 INT;
  location_id_3 INT;
  property_id_1 INT;
  property_id_2 INT;
  property_id_3 INT;
  tenant_id_1 INT;
  tenant_id_2 INT;
  reservation_id_1 INT;
  reservation_id_2 INT;
  reservation_id_3 INT;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM users WHERE email = 'test@test.com';
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'User test@test.com not found. Please create the user first.';
  END IF;

  -- Create locations
  INSERT INTO locations (user_id, name) VALUES
    (test_user_id, 'Kololi Beach Area'),
    (test_user_id, 'Senegambia Strip'),
    (test_user_id, 'Bijilo')
  RETURNING id INTO location_id_1;
  
  SELECT id INTO location_id_2 FROM locations WHERE user_id = test_user_id AND name = 'Senegambia Strip';
  SELECT id INTO location_id_3 FROM locations WHERE user_id = test_user_id AND name = 'Bijilo';

  -- Create properties
  INSERT INTO properties (
    user_id, name, location_id, property_type, rental_type, bedrooms, bathrooms,
    max_guests, square_feet, description, status, amenities, images
  ) VALUES
    (
      test_user_id, 'Sunset Beach Villa', location_id_1, 'villa', 'short-term', 4, 3,
      8, 2500, 'Luxurious beachfront villa with stunning ocean views', 'available',
      '["wifi", "pool", "air_conditioning", "kitchen", "parking", "beach_access"]'::jsonb,
      '["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"]'::jsonb
    ),
    (
      test_user_id, 'Garden House Retreat', location_id_2, 'house', 'short-term', 3, 2,
      6, 1800, 'Peaceful garden house perfect for families', 'available',
      '["wifi", "garden", "air_conditioning", "kitchen", "parking"]'::jsonb,
      '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"]'::jsonb
    ),
    (
      test_user_id, 'Modern City Apartment', location_id_3, 'apartment', 'long-term', 2, 1,
      4, 1200, 'Contemporary apartment in prime location', 'available',
      '["wifi", "air_conditioning", "kitchen", "gym", "security"]'::jsonb,
      '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"]'::jsonb
    )
  RETURNING id INTO property_id_1;
  
  SELECT id INTO property_id_2 FROM properties WHERE user_id = test_user_id AND name = 'Garden House Retreat';
  SELECT id INTO property_id_3 FROM properties WHERE user_id = test_user_id AND name = 'Modern City Apartment';

  -- Create tenants
  INSERT INTO tenants (
    user_id, first_name, last_name, email, phone, date_of_birth,
    identification_type, identification_number, emergency_contact_name,
    emergency_contact_phone, status
  ) VALUES
    (
      test_user_id, 'Fatou', 'Jallow', 'fatou.jallow@email.com', '+2203345678',
      '1990-05-15', 'passport', 'GM123456', 'Mariama Jallow', '+2203345679', 'active'
    ),
    (
      test_user_id, 'Lamin', 'Ceesay', 'lamin.ceesay@email.com', '+2202345678',
      '1985-08-22', 'national_id', 'GM789012', 'Isatou Ceesay', '+2202345679', 'active'
    )
  RETURNING id INTO tenant_id_1;
  
  SELECT id INTO tenant_id_2 FROM tenants WHERE user_id = test_user_id AND email = 'lamin.ceesay@email.com';

  -- Create reservations for current year
  INSERT INTO reservations (
    user_id, property_id, tenant_id, guest_name, guest_email, guest_phone,
    check_in, check_out, number_of_guests, reservation_type, total_amount,
    paid_amount, status, notes
  ) VALUES
    (
      test_user_id, property_id_1, tenant_id_1, 'Fatou Jallow', 'fatou.jallow@email.com',
      '+2203345678', '2025-01-15', '2025-01-22', 4, 'short-term', 35000, 35000,
      'completed', 'Week-long stay, very satisfied'
    ),
    (
      test_user_id, property_id_2, tenant_id_2, 'Lamin Ceesay', 'lamin.ceesay@email.com',
      '+2202345678', '2025-02-10', '2025-02-17', 6, 'short-term', 28000, 28000,
      'completed', 'Family vacation'
    ),
    (
      test_user_id, property_id_1, tenant_id_1, 'Fatou Jallow', 'fatou.jallow@email.com',
      '+2203345678', '2025-03-05', '2025-03-12', 4, 'short-term', 35000, 35000,
      'completed', 'Return guest'
    ),
    (
      test_user_id, property_id_3, tenant_id_2, 'Lamin Ceesay', 'lamin.ceesay@email.com',
      '+2202345678', '2025-04-01', '2025-06-30', 2, 'long-term', 90000, 60000,
      'confirmed', 'Long-term rental, 3 months'
    ),
    (
      test_user_id, property_id_2, NULL, 'Mariama Sanneh', 'mariama.sanneh@email.com',
      '+2201234567', '2025-10-20', '2025-10-27', 5, 'short-term', 30000, 15000,
      'confirmed', 'Upcoming reservation'
    ),
    (
      test_user_id, property_id_1, NULL, 'Omar Bah', 'omar.bah@email.com',
      '+2204567890', '2025-11-10', '2025-11-17', 6, 'short-term', 38000, 0,
      'pending', 'Pending payment'
    )
  RETURNING id INTO reservation_id_1;
  
  SELECT id INTO reservation_id_2 FROM reservations WHERE user_id = test_user_id AND guest_name = 'Lamin Ceesay' AND check_in = '2025-02-10';
  SELECT id INTO reservation_id_3 FROM reservations WHERE user_id = test_user_id AND guest_name = 'Fatou Jallow' AND check_in = '2025-03-05';

  -- Create payments
  INSERT INTO payments (
    user_id, reservation_id, property_id, tenant_id, amount, payment_method,
    payment_type, transaction_id, status, payment_date, notes
  ) VALUES
    (
      test_user_id, reservation_id_1, property_id_1, tenant_id_1, 35000, 'bank_transfer',
      'rent', 'TXN001', 'completed', '2025-01-15', 'Full payment received'
    ),
    (
      test_user_id, reservation_id_2, property_id_2, tenant_id_2, 28000, 'cash',
      'rent', 'TXN002', 'completed', '2025-02-10', 'Cash payment on arrival'
    ),
    (
      test_user_id, reservation_id_3, property_id_1, tenant_id_1, 35000, 'bank_transfer',
      'rent', 'TXN003', 'completed', '2025-03-05', 'Repeat customer payment'
    );

  -- Create expenses for various categories
  INSERT INTO expenses (
    user_id, property_id, category, amount, description, vendor, payment_method,
    expense_date, status, is_recurring, recurring_frequency, notes
  ) VALUES
    -- January expenses
    (test_user_id, property_id_1, 'maintenance', 5000, 'Pool cleaning and maintenance', 'Pool Services Ltd', 'bank_transfer', '2025-01-10', 'paid', false, NULL, 'Monthly pool service'),
    (test_user_id, property_id_2, 'utilities', 1200, 'Electricity bill', 'NAWEC', 'bank_transfer', '2025-01-15', 'paid', true, 'monthly', 'January electricity'),
    (test_user_id, NULL, 'insurance', 15000, 'Property insurance premium', 'Gambia Insurance Co', 'bank_transfer', '2025-01-20', 'paid', true, 'quarterly', 'Q1 insurance payment'),
    
    -- February expenses
    (test_user_id, property_id_1, 'cleaning', 2500, 'Deep cleaning after guest checkout', 'Clean & Shine', 'cash', '2025-02-08', 'paid', false, NULL, 'Post-checkout cleaning'),
    (test_user_id, property_id_2, 'utilities', 1350, 'Electricity bill', 'NAWEC', 'bank_transfer', '2025-02-15', 'paid', true, 'monthly', 'February electricity'),
    (test_user_id, property_id_3, 'repairs', 8000, 'Air conditioning repair', 'Cool Tech Services', 'bank_transfer', '2025-02-20', 'paid', false, NULL, 'AC unit replacement'),
    
    -- March expenses
    (test_user_id, property_id_1, 'maintenance', 5000, 'Pool cleaning and maintenance', 'Pool Services Ltd', 'bank_transfer', '2025-03-10', 'paid', false, NULL, 'Monthly pool service'),
    (test_user_id, property_id_2, 'utilities', 1180, 'Electricity bill', 'NAWEC', 'bank_transfer', '2025-03-15', 'paid', true, 'monthly', 'March electricity'),
    (test_user_id, property_id_1, 'supplies', 3500, 'Bedding and towels replacement', 'Home Essentials', 'credit_card', '2025-03-22', 'paid', false, NULL, 'New linens for villa'),
    
    -- April expenses
    (test_user_id, NULL, 'taxes', 25000, 'Property tax payment', 'Gambia Revenue Authority', 'bank_transfer', '2025-04-01', 'paid', true, 'yearly', 'Annual property tax'),
    (test_user_id, property_id_2, 'utilities', 1420, 'Electricity bill', 'NAWEC', 'bank_transfer', '2025-04-15', 'paid', true, 'monthly', 'April electricity'),
    (test_user_id, property_id_3, 'maintenance', 2000, 'Plumbing repair', 'Quick Fix Plumbing', 'cash', '2025-04-18', 'paid', false, NULL, 'Leaky faucet repair'),
    
    -- May expenses
    (test_user_id, property_id_1, 'maintenance', 5000, 'Pool cleaning and maintenance', 'Pool Services Ltd', 'bank_transfer', '2025-05-10', 'paid', false, NULL, 'Monthly pool service'),
    (test_user_id, property_id_2, 'utilities', 1290, 'Electricity bill', 'NAWEC', 'bank_transfer', '2025-05-15', 'paid', true, 'monthly', 'May electricity'),
    (test_user_id, property_id_1, 'marketing', 4000, 'Online listing promotion', 'Booking Platform', 'credit_card', '2025-05-20', 'paid', false, NULL, 'Featured listing for summer'),
    
    -- Upcoming/Pending expenses
    (test_user_id, property_id_2, 'utilities', 1350, 'Electricity bill', 'NAWEC', 'bank_transfer', '2025-10-15', 'pending', true, 'monthly', 'October electricity'),
    (test_user_id, property_id_1, 'maintenance', 5000, 'Pool cleaning and maintenance', 'Pool Services Ltd', 'bank_transfer', '2025-10-10', 'pending', false, NULL, 'Monthly pool service');

  RAISE NOTICE 'Test data seeded successfully for user: %', test_user_id;
END $$;
