-- Security fix: Make user_id columns NOT NULL to strengthen RLS policies
-- Check for existing NULL values first and clean them up if needed

-- Make sync_metadata.user_id NOT NULL
ALTER TABLE sync_metadata 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint for sync_metadata
ALTER TABLE sync_metadata
ADD CONSTRAINT fk_sync_metadata_user
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Make stuck_sessions.user_id NOT NULL  
ALTER TABLE stuck_sessions 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint for stuck_sessions
ALTER TABLE stuck_sessions
ADD CONSTRAINT fk_stuck_sessions_user  
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;