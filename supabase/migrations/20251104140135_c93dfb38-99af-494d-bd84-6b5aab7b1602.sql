-- Add missing UPDATE policy for subscription_status table
CREATE POLICY "Users can update own subscription"
ON public.subscription_status
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);