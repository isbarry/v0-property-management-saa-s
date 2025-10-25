-- Add building_name column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_building_name ON properties(building_name);

-- Create buildings table for managing building names (similar to locations)
CREATE TABLE IF NOT EXISTS buildings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_buildings_user_id ON buildings(user_id);
CREATE INDEX IF NOT EXISTS idx_buildings_location_id ON buildings(location_id);

-- Add building_id to properties table for referential integrity
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_building_id ON properties(building_id);
