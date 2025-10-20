-- Create user profiles table
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  living_situation text DEFAULT 'alone' CHECK (living_situation IN ('alone', 'with_others')),
  work_schedule jsonb DEFAULT '[]'::jsonb,
  ai_coaching_style text DEFAULT 'balanced' CHECK (ai_coaching_style IN ('direct', 'balanced', 'conversational')),
  default_wake_time time DEFAULT '07:00:00',
  default_sleep_time time DEFAULT '23:00:00',
  timezone text DEFAULT 'UTC',
  life_domains jsonb DEFAULT '{"work": 5, "health": 5, "relationships": 5, "personal": 5, "finance": 5}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create recurring time blocks table
CREATE TABLE public.recurring_time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_time_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_time_blocks
CREATE POLICY "Users can read own recurring blocks"
  ON public.recurring_time_blocks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring blocks"
  ON public.recurring_time_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring blocks"
  ON public.recurring_time_blocks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring blocks"
  ON public.recurring_time_blocks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_recurring_time_blocks_updated_at
  BEFORE UPDATE ON public.recurring_time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();