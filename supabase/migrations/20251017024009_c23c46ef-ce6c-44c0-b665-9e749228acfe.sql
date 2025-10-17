-- Add 'creator' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creator';

-- Update the has_role function to ensure it works with the new role
-- (function already exists, no changes needed)

-- Update handle_new_user_role to potentially assign creator role
-- (keeping existing function as-is for now, admin will manually assign creator role)