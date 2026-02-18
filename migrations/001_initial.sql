-- Initial schema for Internal Link Finder SaaS
-- Creates all 5 tables with RLS policies

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT now(),
    reset_token TEXT,
    reset_token_expires TIMESTAMPTZ
);

-- ============================================================
-- subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- analysis_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT,
    config JSONB,
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- saved_links
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES analysis_sessions(id) ON DELETE SET NULL,
    link_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ai_usage
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    call_count INT DEFAULT 0,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
);

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies for users
-- ============================================================
CREATE POLICY users_select_own ON users
    FOR SELECT USING (id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY users_insert_own ON users
    FOR INSERT WITH CHECK (id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY users_delete_own ON users
    FOR DELETE USING (id = current_setting('app.current_user_id', true)::UUID);

-- ============================================================
-- RLS Policies for subscriptions
-- ============================================================
CREATE POLICY subscriptions_select_own ON subscriptions
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY subscriptions_insert_own ON subscriptions
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY subscriptions_update_own ON subscriptions
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY subscriptions_delete_own ON subscriptions
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- ============================================================
-- RLS Policies for analysis_sessions
-- ============================================================
CREATE POLICY analysis_sessions_select_own ON analysis_sessions
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY analysis_sessions_insert_own ON analysis_sessions
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY analysis_sessions_update_own ON analysis_sessions
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY analysis_sessions_delete_own ON analysis_sessions
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- ============================================================
-- RLS Policies for saved_links
-- ============================================================
CREATE POLICY saved_links_select_own ON saved_links
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY saved_links_insert_own ON saved_links
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY saved_links_update_own ON saved_links
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY saved_links_delete_own ON saved_links
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- ============================================================
-- RLS Policies for ai_usage
-- ============================================================
CREATE POLICY ai_usage_select_own ON ai_usage
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY ai_usage_insert_own ON ai_usage
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY ai_usage_update_own ON ai_usage
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY ai_usage_delete_own ON ai_usage
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true)::UUID);
