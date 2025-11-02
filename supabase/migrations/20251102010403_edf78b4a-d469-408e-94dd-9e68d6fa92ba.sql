-- Add database constraints to user_feedback table for server-side validation
-- This prevents oversized/malicious payloads from bypassing client-side validation

ALTER TABLE user_feedback
  ADD CONSTRAINT feedback_message_length CHECK (char_length(message) BETWEEN 10 AND 2000),
  ADD CONSTRAINT feedback_title_length CHECK (title IS NULL OR char_length(title) <= 200),
  ADD CONSTRAINT feedback_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  ADD CONSTRAINT feedback_type_valid CHECK (feedback_type IN ('review', 'idea', 'bug', 'feature_request', 'general'));