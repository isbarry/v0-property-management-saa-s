-- Add documents column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN properties.documents IS 'Array of document objects with name and url properties';
