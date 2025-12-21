-- Security Fix: Remove email column from profiles table
-- Email is already stored securely in auth.users and doesn't need to be duplicated
-- This prevents potential email exposure if RLS is ever bypassed

-- 1. Drop the email column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 2. Update the trigger function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create a secure function for admins to get user emails (via auth.users)
-- This uses SECURITY DEFINER to access auth.users securely
CREATE OR REPLACE FUNCTION public.get_user_email_for_admin(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Check if the calling user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.promo_redemptions pr
    JOIN public.promo_codes pc ON pr.promo_code_id = pc.id
    WHERE pr.user_id = auth.uid() AND pc.plan_type = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get the email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;

  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users (admin check is inside the function)
GRANT EXECUTE ON FUNCTION public.get_user_email_for_admin(UUID) TO authenticated;
