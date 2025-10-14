-- Fix security warning: Update update_last_modified function with proper search_path
CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.last_modified = now();
  NEW.sync_version = OLD.sync_version + 1;
  RETURN NEW;
END;
$$;