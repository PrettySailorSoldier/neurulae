-- Add missing DELETE policies for data deletion compliance

-- Allow users to delete their own chat messages
CREATE POLICY "Users can delete own messages"
  ON chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = chat_messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Allow users to delete their own user profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to delete their own subscription status
CREATE POLICY "Users can delete own subscription"
  ON subscription_status
  FOR DELETE
  USING (auth.uid() = user_id);