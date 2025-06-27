-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  payment_provider VARCHAR(50), -- 'stripe', 'paypal', 'braintree', etc.
  payment_customer_id VARCHAR(255), -- Generic customer ID from payment processor
  payment_subscription_id VARCHAR(255), -- Generic subscription ID from payment processor
  payment_data JSONB, -- Store any additional payment provider specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);

-- Update profiles table to include subscription information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';

-- Create subscription_features table for feature flags
CREATE TABLE subscription_features (
  tier VARCHAR(50) PRIMARY KEY,
  max_digests INTEGER NOT NULL,
  allowed_frequencies TEXT[] NOT NULL,
  custom_templates BOOLEAN NOT NULL DEFAULT FALSE,
  priority_support BOOLEAN NOT NULL DEFAULT FALSE,
  custom_api_access BOOLEAN NOT NULL DEFAULT FALSE,
  advanced_filtering BOOLEAN NOT NULL DEFAULT FALSE
);

-- Insert default feature configurations
INSERT INTO subscription_features (tier, max_digests, allowed_frequencies, custom_templates, priority_support, custom_api_access, advanced_filtering)
VALUES 
  ('free', 3, ARRAY['daily', 'weekly'], FALSE, FALSE, FALSE, FALSE),
  ('pro', 15, ARRAY['daily', 'weekly', 'monthly'], TRUE, TRUE, FALSE, FALSE),
  ('enterprise', -1, ARRAY['daily', 'weekly', 'monthly', 'custom'], TRUE, TRUE, TRUE, TRUE);
