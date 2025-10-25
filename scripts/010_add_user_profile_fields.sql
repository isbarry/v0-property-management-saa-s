-- Add profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
