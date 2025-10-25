-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Add location_id to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_location_id ON properties(location_id);

-- Migrate existing location data to locations table
-- This will create location entries from existing location strings
INSERT INTO locations (user_id, name)
SELECT DISTINCT user_id, location
FROM properties
WHERE location IS NOT NULL AND location != ''
ON CONFLICT (user_id, name) DO NOTHING;

-- Update properties to reference the new location_id
UPDATE properties p
SET location_id = l.id
FROM locations l
WHERE p.user_id = l.user_id AND p.location = l.name;

-- Note: We're keeping the location column for now for backward compatibility
-- You can drop it later with: ALTER TABLE properties DROP COLUMN location;
