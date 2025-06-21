-- Table: schedules
-- Stores scheduled digest jobs for each user/database
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  db_id text NOT NULL,
  email text NOT NULL,
  frequency text NOT NULL, -- e.g. 'daily', 'weekly', 'custom'
  time_of_day text NOT NULL, -- e.g. '14:00'
  timezone text NOT NULL, -- e.g. 'America/New_York'
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  status text DEFAULT 'active', -- 'active', 'paused', 'deleted'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_db_id ON schedules(db_id);
