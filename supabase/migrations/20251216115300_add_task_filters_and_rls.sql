-- Migration: Add is_completed and deleted_at columns to tasks table for better filtering
-- Also ensures RLS is enabled and policies exist (idempotent)

-- Add is_completed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN is_completed BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add deleted_at column for soft deletes if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;
END $$;

-- Migrate existing status data to is_completed (if status exists)
UPDATE public.tasks 
SET is_completed = true 
WHERE status = 'completed' AND is_completed = false;

-- Create index for better query performance on common filters
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks(deleted_at) WHERE deleted_at IS NULL;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct (idempotent approach)
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Recreate RLS policies for tasks table
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);
