-- Fix foreign key constraints to reference public.users instead of neon_auth.users_sync

-- Drop incorrect foreign key constraints
ALTER TABLE IF EXISTS public.properties DROP CONSTRAINT IF EXISTS properties_user_id_fkey;
ALTER TABLE IF EXISTS public.reservations DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;
ALTER TABLE IF EXISTS public.tenants DROP CONSTRAINT IF EXISTS tenants_user_id_fkey;
ALTER TABLE IF EXISTS public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_user_id_fkey;
ALTER TABLE IF EXISTS public.expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE IF EXISTS public.blocked_dates DROP CONSTRAINT IF EXISTS blocked_dates_user_id_fkey;
ALTER TABLE IF EXISTS public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;

-- Add correct foreign key constraints pointing to public.users
ALTER TABLE public.properties 
  ADD CONSTRAINT properties_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.reservations 
  ADD CONSTRAINT reservations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.tenants 
  ADD CONSTRAINT tenants_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.maintenance_requests 
  ADD CONSTRAINT maintenance_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.expenses 
  ADD CONSTRAINT expenses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_dates 
  ADD CONSTRAINT blocked_dates_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.sessions 
  ADD CONSTRAINT sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
