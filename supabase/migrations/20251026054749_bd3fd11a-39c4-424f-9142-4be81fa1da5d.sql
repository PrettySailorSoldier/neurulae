-- Create user_feedback table for collecting user feedback
CREATE TABLE user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('review', 'idea', 'bug', 'feature_request', 'general')),
  title text,
  message text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'acknowledged', 'implemented', 'closed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all feedback
CREATE POLICY "Admins can read all feedback" ON user_feedback
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update feedback (status changes)
CREATE POLICY "Admins can update feedback" ON user_feedback
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON user_feedback(status);

-- Add updated_at trigger
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();