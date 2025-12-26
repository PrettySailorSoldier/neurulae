-- Add explicit SELECT policy for admins on promo_codes for policy clarity
-- The existing 'ALL' policy covers this, but explicit policies are clearer

CREATE POLICY "Admins can view promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));