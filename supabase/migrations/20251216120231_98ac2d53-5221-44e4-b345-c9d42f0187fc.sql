-- 1. Add columns for tracking completion and deletion if they are missing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Update old data: If it says 'completed' in text, mark the checkbox as TRUE
UPDATE tasks SET is_completed = TRUE WHERE status = 'completed';

-- 3. Speed up the database with indexes
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- 4. FORCE the security rules to refresh
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 5. Re-apply the strict "My Eyes Only" policy
DROP POLICY IF EXISTS "Users can only access their own tasks" ON tasks;

CREATE POLICY "Users can only access their own tasks" ON tasks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);