-- Create table to track "I'm Stuck" sessions for analytics
CREATE TABLE IF NOT EXISTS public.stuck_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  playbooks_generated TEXT[],
  tasks_created INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stuck_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own stuck sessions
CREATE POLICY "Users can view their own stuck sessions"
ON public.stuck_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own stuck sessions
CREATE POLICY "Users can insert their own stuck sessions"
ON public.stuck_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own stuck sessions
CREATE POLICY "Users can update their own stuck sessions"
ON public.stuck_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stuck_sessions_user_date ON public.stuck_sessions(user_id, session_date DESC);