-- Add a RLS policy to prevent users from creating or resuming more schedules than their tier allows
CREATE OR REPLACE FUNCTION public.enforce_max_digests()
RETURNS TRIGGER AS $$
DECLARE
  subscription_record RECORD;
  current_count INTEGER;
  is_resuming BOOLEAN := FALSE;
BEGIN
  -- Get user's subscription details
  SELECT s.tier, s.status, f.max_digests
  INTO subscription_record
  FROM subscriptions s
  JOIN subscription_features f ON s.tier = f.tier
  WHERE s.user_id = NEW.user_id AND s.status = 'active'
  LIMIT 1;

  -- If no active subscription, get default free tier info
  IF subscription_record IS NULL THEN
    SELECT 'free' as tier, 'active' as status, f.max_digests
    INTO subscription_record
    FROM subscription_features f
    WHERE f.tier = 'free';
  END IF;

  -- Count current active schedules (status = 'active')
  SELECT COUNT(*)
  INTO current_count
  FROM schedules
  WHERE user_id = NEW.user_id AND status = 'active'
    AND (TG_OP = 'INSERT' OR id != NEW.id); -- Exclude this row if UPDATE

  -- Detect if this is a resume (status changed from paused to active)
  IF TG_OP = 'UPDATE' AND OLD.status = 'paused' AND NEW.status = 'active' THEN
    is_resuming := TRUE;
  END IF;

  -- Enforce limit (ignore if max_digests is -1, which means unlimited)
  IF subscription_record.max_digests != -1 AND (TG_OP = 'INSERT' OR is_resuming) THEN
    IF current_count >= subscription_record.max_digests THEN
      RAISE EXCEPTION 'Maximum number of active schedules (%) exceeded for subscription tier %', 
        subscription_record.max_digests, subscription_record.tier;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to enforce the schedule limit on both INSERT and UPDATE
DROP TRIGGER IF EXISTS enforce_max_digests_trigger ON schedules;
CREATE TRIGGER enforce_max_digests_trigger
BEFORE INSERT OR UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION public.enforce_max_digests();

-- Add RLS policy to check frequency against allowed frequencies
CREATE OR REPLACE FUNCTION public.check_allowed_frequency()
RETURNS TRIGGER AS $$
DECLARE
  allowed_frequencies TEXT[];
BEGIN
  -- Get the allowed frequencies for the user's subscription tier
  SELECT f.allowed_frequencies
  INTO allowed_frequencies
  FROM subscriptions s
  JOIN subscription_features f ON s.tier = f.tier
  WHERE s.user_id = NEW.user_id AND s.status = 'active'
  LIMIT 1;
  
  -- If no subscription found, use free tier defaults
  IF allowed_frequencies IS NULL THEN
    SELECT f.allowed_frequencies
    INTO allowed_frequencies
    FROM subscription_features f
    WHERE f.tier = 'free';
  END IF;
  
  -- Check if the requested frequency is allowed
  IF NOT (NEW.frequency = ANY(allowed_frequencies)) THEN
    RAISE EXCEPTION 'Frequency % is not allowed for your subscription tier', NEW.frequency;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to enforce allowed frequencies
DROP TRIGGER IF EXISTS check_frequency_trigger ON schedules;
CREATE TRIGGER check_frequency_trigger
BEFORE INSERT OR UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION public.check_allowed_frequency();
