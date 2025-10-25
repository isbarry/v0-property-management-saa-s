-- Check if we have any users
SELECT 'Users count:' as info, COUNT(*) as count FROM public.users;

-- Check if we have any properties
SELECT 'Properties count:' as info, COUNT(*) as count FROM public.properties;

-- Check if we have any tenants
SELECT 'Tenants count:' as info, COUNT(*) as count FROM public.tenants;

-- Check if we have any reservations
SELECT 'Reservations count:' as info, COUNT(*) as count FROM public.reservations;

-- If no users exist, create a test user
INSERT INTO public.users (id, email, name, password_hash, created_at, updated_at)
SELECT 
  'test-user-001',
  'admin@example.com',
  'Admin User',
  'temp_password123',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@example.com');

-- Get the user_id for seeding
DO $$
DECLARE
  v_user_id TEXT;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'admin@example.com';
  
  -- Only seed if we have no properties
  IF NOT EXISTS (SELECT 1 FROM public.properties LIMIT 1) THEN
    -- Insert sample properties
    INSERT INTO public.properties (name, description, address, city, state, postal_code, country, property_type, rental_type, bedrooms, bathrooms, max_guests, square_feet, status, user_id, images, amenities, created_at, updated_at)
    VALUES 
      ('Sunset Villa', 'Luxurious beachfront villa with stunning ocean views', '123 Ocean Drive', 'Miami', 'FL', '33139', 'USA', 'house', 'short_term', 4, 3.5, 8, 3200, 'available', v_user_id, '["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"]', '["wifi", "pool", "parking", "air_conditioning", "kitchen"]', NOW(), NOW()),
      ('Downtown Loft', 'Modern loft in the heart of the city', '456 Main Street', 'New York', 'NY', '10001', 'USA', 'apartment', 'long_term', 2, 2, 4, 1500, 'occupied', v_user_id, '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"]', '["wifi", "gym", "parking", "air_conditioning"]', NOW(), NOW()),
      ('Mountain Cabin', 'Cozy cabin retreat in the mountains', '789 Pine Road', 'Aspen', 'CO', '81611', 'USA', 'house', 'short_term', 3, 2, 6, 1800, 'available', v_user_id, '["https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800"]', '["wifi", "fireplace", "parking", "mountain_view"]', NOW(), NOW());
    
    -- Insert sample tenants
    INSERT INTO public.tenants (first_name, last_name, email, phone, date_of_birth, identification_type, identification_number, emergency_contact_name, emergency_contact_phone, property_id, status, user_id, created_at, updated_at)
    VALUES 
      ('John', 'Smith', 'john.smith@email.com', '+1-555-0101', '1985-03-15', 'passport', 'P12345678', 'Jane Smith', '+1-555-0102', 2, 'active', v_user_id, NOW(), NOW()),
      ('Sarah', 'Johnson', 'sarah.j@email.com', '+1-555-0201', '1990-07-22', 'drivers_license', 'DL987654', 'Mike Johnson', '+1-555-0202', 2, 'active', v_user_id, NOW(), NOW());
    
    -- Insert sample reservations
    INSERT INTO public.reservations (property_id, tenant_id, guest_name, guest_email, guest_phone, check_in, check_out, number_of_guests, total_amount, paid_amount, status, reservation_type, notes, user_id, created_at, updated_at)
    VALUES 
      (1, NULL, 'Michael Brown', 'mbrown@email.com', '+1-555-0301', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '14 days', 4, 2800.00, 2800.00, 'confirmed', 'vacation', 'Anniversary trip', v_user_id, NOW(), NOW()),
      (3, NULL, 'Emily Davis', 'edavis@email.com', '+1-555-0401', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '37 days', 2, 1400.00, 700.00, 'pending', 'vacation', 'Ski trip', v_user_id, NOW(), NOW()),
      (1, NULL, 'Robert Wilson', 'rwilson@email.com', '+1-555-0501', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '7 days', 6, 3500.00, 3500.00, 'completed', 'vacation', 'Family reunion', v_user_id, NOW(), NOW());
    
    -- Insert sample payments
    INSERT INTO public.payments (property_id, tenant_id, reservation_id, amount, payment_date, payment_type, payment_method, status, transaction_id, notes, user_id, created_at, updated_at)
    VALUES 
      (1, NULL, 1, 2800.00, CURRENT_DATE, 'reservation', 'credit_card', 'completed', 'TXN001', 'Full payment received', v_user_id, NOW(), NOW()),
      (3, NULL, 2, 700.00, CURRENT_DATE, 'reservation', 'credit_card', 'completed', 'TXN002', 'Deposit payment', v_user_id, NOW(), NOW()),
      (2, 1, NULL, 2500.00, CURRENT_DATE - INTERVAL '1 month', 'rent', 'bank_transfer', 'completed', 'TXN003', 'Monthly rent', v_user_id, NOW(), NOW());
    
    -- Insert sample expenses
    INSERT INTO public.expenses (property_id, amount, expense_date, category, description, vendor, payment_method, status, is_recurring, recurring_frequency, notes, user_id, created_at, updated_at)
    VALUES 
      (1, 150.00, CURRENT_DATE - INTERVAL '5 days', 'maintenance', 'Pool cleaning service', 'Clean Pools Inc', 'credit_card', 'paid', true, 'weekly', 'Regular maintenance', v_user_id, NOW(), NOW()),
      (2, 85.00, CURRENT_DATE - INTERVAL '10 days', 'utilities', 'Electricity bill', 'Power Company', 'auto_pay', 'paid', true, 'monthly', 'Monthly utility', v_user_id, NOW(), NOW()),
      (3, 450.00, CURRENT_DATE - INTERVAL '3 days', 'repairs', 'Heating system repair', 'HVAC Experts', 'check', 'paid', false, NULL, 'Emergency repair', v_user_id, NOW(), NOW());
    
    -- Insert sample maintenance requests
    INSERT INTO public.maintenance_requests (property_id, tenant_id, title, description, category, priority, status, estimated_cost, actual_cost, scheduled_date, completed_date, assigned_to, notes, user_id, created_at, updated_at)
    VALUES 
      (1, NULL, 'Fix leaking faucet', 'Kitchen faucet is dripping constantly', 'plumbing', 'medium', 'open', 150.00, NULL, CURRENT_DATE + INTERVAL '2 days', NULL, 'John Plumber', 'Guest reported issue', v_user_id, NOW(), NOW()),
      (2, 1, 'Replace air filter', 'HVAC air filter needs replacement', 'hvac', 'low', 'in_progress', 50.00, NULL, CURRENT_DATE + INTERVAL '1 day', NULL, 'HVAC Tech', 'Routine maintenance', v_user_id, NOW(), NOW()),
      (3, NULL, 'Repair broken window', 'Bedroom window cracked during storm', 'general', 'high', 'completed', 300.00, 275.00, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '2 days', 'Glass Repair Co', 'Insurance claim filed', v_user_id, NOW(), NOW());
  END IF;
END $$;

-- Show final counts
SELECT 'Final users count:' as info, COUNT(*) as count FROM public.users;
SELECT 'Final properties count:' as info, COUNT(*) as count FROM public.properties;
SELECT 'Final tenants count:' as info, COUNT(*) as count FROM public.tenants;
SELECT 'Final reservations count:' as info, COUNT(*) as count FROM public.reservations;
SELECT 'Final payments count:' as info, COUNT(*) as count FROM public.payments;
SELECT 'Final expenses count:' as info, COUNT(*) as count FROM public.expenses;
SELECT 'Final maintenance requests count:' as info, COUNT(*) as count FROM public.maintenance_requests;

-- Show the test user credentials
SELECT 'Test user created:' as info, email, id FROM public.users WHERE email = 'admin@example.com';
