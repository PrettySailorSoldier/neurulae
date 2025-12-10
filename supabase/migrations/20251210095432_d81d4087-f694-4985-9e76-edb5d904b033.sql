-- Create rate_limits table for tracking API usage
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX idx_rate_limits_user_action_created ON public.rate_limits (user_id, action, created_at DESC);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit records
CREATE POLICY "Users can view own rate limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own rate limit records
CREATE POLICY "Users can insert own rate limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Auto-cleanup old records (keep only last 24 hours) via periodic deletion
-- For now, just allow deletes for cleanup
CREATE POLICY "Users can delete own rate limits"
ON public.rate_limits
FOR DELETE
USING (auth.uid() = user_id);

-- Add check constraint to promo_codes to prevent exceeding max_uses
-- This provides defense-in-depth alongside optimistic locking
ALTER TABLE public.promo_codes ADD CONSTRAINT check_promo_max_uses 
  CHECK (max_uses IS NULL OR current_uses <= max_uses);