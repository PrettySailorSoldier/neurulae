-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to chat-attachments bucket
CREATE POLICY "Allow public uploads to chat-attachments"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow public downloads from chat-attachments bucket
CREATE POLICY "Allow public downloads from chat-attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own uploads
CREATE POLICY "Allow users to update own chat attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);