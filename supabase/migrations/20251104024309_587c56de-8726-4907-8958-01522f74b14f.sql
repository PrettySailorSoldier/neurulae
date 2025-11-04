-- Make estimated_minutes optional in tasks table
ALTER TABLE tasks ALTER COLUMN estimated_minutes DROP NOT NULL;

-- Add index for better performance on schedule queries
CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_time ON schedule_entries(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- Create schedule_preferences table for user preferences
CREATE TABLE IF NOT EXISTS schedule_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_study_start TIME DEFAULT '09:00:00',
  preferred_study_end TIME DEFAULT '22:00:00',
  min_session_length INTEGER DEFAULT 30,
  max_session_length INTEGER DEFAULT 180,
  buffer_minutes INTEGER DEFAULT 15,
  max_daily_study_hours INTEGER DEFAULT 6,
  avoid_late_night BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE schedule_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for schedule_preferences
CREATE POLICY "Users can read own preferences"
  ON schedule_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON schedule_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON schedule_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON schedule_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_schedule_preferences_updated_at
  BEFORE UPDATE ON schedule_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();