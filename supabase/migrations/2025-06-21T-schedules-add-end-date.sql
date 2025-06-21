-- Add end_date column to schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_date date;
