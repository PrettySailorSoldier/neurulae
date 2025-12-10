-- Drop the overly permissive policy that exposes all active promo codes
DROP POLICY IF EXISTS "Users can view active promo codes" ON public.promo_codes;

-- Create a secure function for code validation only (users can only validate specific codes they know)
CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  plan_type app_role,
  already_redeemed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_id uuid;
  v_plan_type app_role;
  v_already_redeemed BOOLEAN;
BEGIN
  -- Find promo code (case-insensitive)
  SELECT id, promo_codes.plan_type INTO v_promo_id, v_plan_type
  FROM promo_codes
  WHERE LOWER(code) = LOWER(code_input)
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF v_promo_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::app_role, false;
    RETURN;
  END IF;
  
  -- Check if already redeemed by current user
  SELECT EXISTS(
    SELECT 1 FROM promo_redemptions
    WHERE user_id = auth.uid() AND promo_code_id = v_promo_id
  ) INTO v_already_redeemed;
  
  RETURN QUERY SELECT true, v_plan_type, v_already_redeemed;
END;
$$;