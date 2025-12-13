-- Fix get_todays_schedule to verify caller can only access their own data
-- This prevents users from querying other users' schedules

CREATE OR REPLACE FUNCTION public.get_todays_schedule(p_user_id uuid)
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  start_time timestamp with time zone, 
  end_time timestamp with time zone, 
  category text, 
  location text, 
  source text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Verify caller can only access their own data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only access your own schedule';
  END IF;
  
  RETURN QUERY
  SELECT 
    se.id,
    se.title,
    se.description,
    se.start_time,
    se.end_time,
    se.category,
    se.location,
    se.source
  FROM schedule_entries se
  WHERE se.user_id = p_user_id
    AND se.start_time >= CURRENT_DATE::timestamp with time zone
    AND se.start_time < (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone
  ORDER BY se.start_time;
END;
$$;