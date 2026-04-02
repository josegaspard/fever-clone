-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add missing columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS refund_policy_id BIGINT;

-- Create refund_policies table
CREATE TABLE IF NOT EXISTS refund_policies (
  id BIGSERIAL PRIMARY KEY,
  business_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  days_before_event INT DEFAULT 7,
  refund_percentage INT DEFAULT 100,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing users
UPDATE users SET user_type = 'SUPERADMIN', onboarding_completed = true WHERE email = 'admin@fever.com';
UPDATE users SET user_type = 'USER', onboarding_completed = true WHERE email = 'user@fever.com';
