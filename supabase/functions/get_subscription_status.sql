-- This function allows checking subscription status from database triggers and RLS policies
CREATE OR REPLACE FUNCTION public.get_subscription_status(user_id_input UUID) 
RETURNS TABLE (
  tier VARCHAR,
  status VARCHAR,
  max_digests INTEGER,
  allowed_frequencies TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.tier,
    s.status,
    f.max_digests,
    f.allowed_frequencies
  FROM
    subscriptions s
    JOIN subscription_features f ON s.tier = f.tier
  WHERE
    s.user_id = user_id_input AND s.status = 'active'
  
  UNION ALL
  
  -- Return default tier info if no subscription found
  SELECT
    'free' as tier,
    'active' as status,
    f.max_digests,
    f.allowed_frequencies
  FROM
    subscription_features f
  WHERE
    f.tier = 'free' AND
    NOT EXISTS (
      SELECT 1 FROM subscriptions WHERE user_id = user_id_input AND status = 'active'
    )
  LIMIT 1;
END;
$$;
