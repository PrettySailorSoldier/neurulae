-- Add columns for linking schedule entries to time blocks and tasks to schedules
ALTER TABLE schedule_entries 
ADD COLUMN IF NOT EXISTS linked_time_block_id uuid REFERENCES recurring_time_blocks(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS source_schedule_id uuid REFERENCES schedule_entries(id) ON DELETE SET NULL;

-- Add indexes for better query performance (without date functions)
CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_start ON schedule_entries(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_category ON schedule_entries(category);
CREATE INDEX IF NOT EXISTS idx_tasks_source_schedule ON tasks(source_schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_linked_block ON schedule_entries(linked_time_block_id);

-- Add a helper function to get today's schedule entries
CREATE OR REPLACE FUNCTION get_todays_schedule(p_user_id uuid)
RETURNS TABLE (
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