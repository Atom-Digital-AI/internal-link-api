-- Add downgraded_at to track when a user's plan was downgraded to free
ALTER TABLE users ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ;
