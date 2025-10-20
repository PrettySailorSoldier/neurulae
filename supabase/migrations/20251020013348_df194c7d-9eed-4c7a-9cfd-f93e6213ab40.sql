-- Create flexible schedule entries table for non-recurring events
CREATE TABLE public.schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  category text DEFAULT 'other',
  location text,
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb,
  source text DEFAULT 'manual',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own schedule entries"
  ON public.schedule_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule entries"
  ON public.schedule_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule entries"
  ON public.schedule_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule entries"
  ON public.schedule_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_schedule_entries_updated_at
  BEFORE UPDATE ON public.schedule_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for efficient date queries
CREATE INDEX idx_schedule_entries_user_time ON public.schedule_entries(user_id, start_time, end_time);