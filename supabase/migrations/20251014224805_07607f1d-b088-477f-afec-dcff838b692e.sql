-- Create user profiles table (auto-created on signup)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create enum for data types
CREATE TYPE public.data_type_enum AS ENUM (
  'tasks',
  'projects',
  'priorities',
  'timeblocks',
  'scheduledTasks',
  'playbooks',
  'reminderWidgets',
  'energyWidgets',
  'messengerWidgets',
  'moodGardenWidgets',
  'parallelUniverseWidgets',
  'soundSignatureWidgets',
  'theme',
  'customTheme',
  'customTabs',
  'timerSessions'
);

-- Create main data store table
CREATE TABLE public.user_data (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type data_type_enum NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_modified TIMESTAMPTZ DEFAULT now(),
  sync_version INTEGER DEFAULT 1,
  device_id TEXT,
  PRIMARY KEY (user_id, data_type)
);

-- Create sync metadata table
CREATE TABLE public.sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_sync_timestamp TIMESTAMPTZ,
  pending_changes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_data
CREATE POLICY "Users can read own data" 
  ON public.user_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" 
  ON public.user_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" 
  ON public.user_data FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" 
  ON public.user_data FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for sync_metadata
CREATE POLICY "Users can read own sync metadata" 
  ON public.sync_metadata FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync metadata" 
  ON public.sync_metadata FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync metadata" 
  ON public.sync_metadata FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync metadata" 
  ON public.sync_metadata FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_modified timestamp
CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = now();
  NEW.sync_version = OLD.sync_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_modified on user_data
CREATE TRIGGER update_user_data_timestamp
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();