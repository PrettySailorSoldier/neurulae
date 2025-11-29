-- Add preferences column to profiles table for syncing user settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.preferences IS 'Stores user preferences like custom backgrounds, theme settings, etc.';