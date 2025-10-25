-- Fix the sessions table foreign key to reference public.users instead of neon_auth.users_sync

-- Drop the old foreign key constraint
ALTER TABLE public.sessions 
DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;

-- Add the new foreign key constraint pointing to public.users
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='sessions';
