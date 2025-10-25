-- Add password reset fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_token);
