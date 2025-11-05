-- Add explicit DENY policy for promo_redemptions INSERT
-- This makes it clear that redemptions should only be created through the edge function
CREATE POLICY "Block direct redemption inserts"
  ON public.promo_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);