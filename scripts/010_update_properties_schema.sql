-- Update properties table schema
-- Remove address, city, state, postal_code, country columns
-- Add location column
-- Update amenities to use predefined list

-- Add location column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location TEXT;

-- Migrate existing data to location field
UPDATE properties 
SET location = CONCAT_WS(', ', 
  NULLIF(address, ''), 
  NULLIF(city, ''), 
  NULLIF(country, '')
)
WHERE location IS NULL;

-- Drop old address columns
ALTER TABLE properties DROP COLUMN IF EXISTS address;
ALTER TABLE properties DROP COLUMN IF EXISTS city;
ALTER TABLE properties DROP COLUMN IF EXISTS state;
ALTER TABLE properties DROP COLUMN IF EXISTS postal_code;
ALTER TABLE properties DROP COLUMN IF EXISTS country;

-- Make location required
ALTER TABLE properties ALTER COLUMN location SET NOT NULL;
