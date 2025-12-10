-- Drop the public download policy that allows unauthenticated access
DROP POLICY IF EXISTS "Allow public downloads from chat-attachments" ON storage.objects;