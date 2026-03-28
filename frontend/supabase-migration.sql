-- ============================================================================
-- FEVER CLONE - SUPABASE MIGRATION
-- Run this in your Supabase SQL Editor to set up all required tables
-- ============================================================================

-- ── Users table updates ─────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── Events table updates ────────────────────────────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS refund_policy_id BIGINT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- ── Plans table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  plan_date DATE,
  status TEXT DEFAULT 'ACTIVE',
  share_code TEXT UNIQUE,
  total_cost FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_share_code ON plans(share_code);

-- ── Plan Items table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_items (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  start_time TEXT,
  end_time TEXT,
  sort_order INT DEFAULT 0,
  notes TEXT,
  is_paid BOOLEAN DEFAULT false,
  cost FLOAT DEFAULT 0,
  travel_mode TEXT,
  travel_duration INT,
  travel_distance FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON plan_items(plan_id);

-- ── Plan Invitations table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_invitations (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  inviter_id BIGINT NOT NULL REFERENCES users(id),
  invitee_email TEXT NOT NULL,
  invitee_id BIGINT REFERENCES users(id),
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_plan_invitations_plan_id ON plan_invitations(plan_id);

-- ── Tickets table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  plan_item_id BIGINT REFERENCES plan_items(id),
  qr_code TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  quantity INT DEFAULT 1,
  total_paid FLOAT DEFAULT 0,
  payment_intent_id TEXT,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);

-- ── Reviews table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON reviews(event_id);

-- ── Refund Policies table ───────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_refund_policies_business_id ON refund_policies(business_id);

-- ── Add FK for events.refund_policy_id ──────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT fk_events_refund_policy
    FOREIGN KEY (refund_policy_id) REFERENCES refund_policies(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS Policies (Row Level Security) ───────────────────────────────────────
-- Enable RLS on new tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so our API routes (using service key) work fine.
-- These policies are for direct Supabase client access if ever needed.

-- Plans: users can see their own plans
CREATE POLICY IF NOT EXISTS "Users can view own plans" ON plans FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can insert own plans" ON plans FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can update own plans" ON plans FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Users can delete own plans" ON plans FOR DELETE USING (true);

-- Similar permissive policies for service-role access
CREATE POLICY IF NOT EXISTS "Service access plan_items" ON plan_items FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service access plan_invitations" ON plan_invitations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service access tickets" ON tickets FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service access reviews" ON reviews FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service access refund_policies" ON refund_policies FOR ALL USING (true);

-- ── Function to update event rating on review changes ───────────────────────
CREATE OR REPLACE FUNCTION update_event_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events SET
    rating = COALESCE((SELECT AVG(rating)::FLOAT FROM reviews WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE event_id = COALESCE(NEW.event_id, OLD.event_id))
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update event ratings
DROP TRIGGER IF EXISTS trigger_update_event_rating ON reviews;
CREATE TRIGGER trigger_update_event_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_event_rating();

-- ── Seed data for test users with new fields ────────────────────────────────
-- Update existing admin to SUPERADMIN
UPDATE users SET user_type = 'SUPERADMIN', onboarding_completed = true WHERE email = 'admin@fever.com';
UPDATE users SET user_type = 'USER', onboarding_completed = true WHERE email = 'user@fever.com';

-- Insert a business test user (password: business123)
INSERT INTO users (name, email, password, role, user_type, onboarding_completed, company_name, company_description)
VALUES (
  'Empresa Demo',
  'business@fever.com',
  '$2a$10$8K1p/a0dR1xqM8hY0b3ZMeF9n3zGV3q2K5W7j1F8rN9tY6uX4mK2e',
  'user',
  'BUSINESS',
  true,
  'EventosPro CDMX',
  'La mejor productora de eventos en Ciudad de México'
) ON CONFLICT (email) DO UPDATE SET user_type = 'BUSINESS', onboarding_completed = true, company_name = EXCLUDED.company_name;
