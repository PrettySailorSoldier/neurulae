-- Drop the public upload policy that allows unauthenticated uploads
DROP POLICY IF EXISTS "Allow public uploads to chat-attachments" ON storage.objects;

-- Create authenticated-only upload policy
-- Users can only upload to their own folder (user_id as first path segment)
CREATE POLICY "Authenticated users can upload to chat-attachments" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to read their own files
CREATE POLICY "Users can read own chat attachments" 
ON storage.objects FOR SELECT 
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to delete their own files
CREATE POLICY "Users can delete own chat attachments" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);