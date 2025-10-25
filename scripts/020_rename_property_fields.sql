-- Rename property_name → unit_name and building_name → property_name
-- This changes the terminology so "Property" = building/complex and "Unit" = individual apartment/villa

-- Step 1: Rename building_name to property_name in properties table
ALTER TABLE properties RENAME COLUMN building_name TO property_name;

-- Step 2: Rename name to unit_name in properties table  
ALTER TABLE properties RENAME COLUMN name TO unit_name;

-- Step 3: Update indexes
DROP INDEX IF EXISTS idx_properties_building_name;
CREATE INDEX IF NOT EXISTS idx_properties_property_name ON properties(property_name);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('unit_name', 'property_name')
ORDER BY column_name;
