-- Enable Row Level Security for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own subscription data
DROP POLICY IF EXISTS subscription_select_policy ON subscriptions;
CREATE POLICY subscription_select_policy ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert only their own subscription data
DROP POLICY IF EXISTS subscription_insert_policy ON subscriptions;
CREATE POLICY subscription_insert_policy ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update only their own subscription data
DROP POLICY IF EXISTS subscription_update_policy ON subscriptions;
CREATE POLICY subscription_update_policy ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy to allow users to delete only their own subscription data
DROP POLICY IF EXISTS subscription_delete_policy ON subscriptions;
CREATE POLICY subscription_delete_policy ON subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant usage and select permissions to subscription_features for authenticated users
GRANT SELECT ON subscription_features TO authenticated;
