-- Create promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan_type app_role NOT NULL DEFAULT 'premium',
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0 NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL means never expires
  active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create promo redemptions table
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, promo_code_id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (active = true);

-- RLS Policies for promo_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON public.promo_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
  ON public.promo_redemptions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Insert some initial promo codes for testing
INSERT INTO public.promo_codes (code, plan_type, max_uses, expires_at, active)
VALUES 
  ('BETATESTER2025', 'premium', NULL, NULL, true),
  ('EARLYACCESS', 'premium', 100, (now() + interval '90 days'), true);

-- Function to check if user has active promo access
CREATE OR REPLACE FUNCTION public.has_active_promo(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM promo_redemptions pr
    JOIN promo_codes pc ON pr.promo_code_id = pc.id
    WHERE pr.user_id = p_user_id
      AND pc.active = true
      AND (pc.expires_at IS NULL OR pc.expires_at > now())
  )
$$;