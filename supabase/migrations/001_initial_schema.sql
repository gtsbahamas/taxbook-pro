-- ============================================================
-- DATABASE SCHEMA - taxbook-pro
-- Generated: 2026-01-19
-- ============================================================
--
-- SUPABASE MIGRATION
-- Run with: supabase db push (dev) or supabase db push --linked (prod)
--
-- TYPE-FIRST: This schema must match the TypeScript types exactly.
-- If schema changes, update types/domain.ts FIRST.
--
-- ============================================================
-- POSTGRESQL BEST PRACTICES (from wshobson/agents)
-- ============================================================
--
-- DATA TYPES:
--   - Use BIGINT GENERATED ALWAYS AS IDENTITY for IDs (not SERIAL)
--   - Use UUID only when global uniqueness/opacity needed
--   - Use TEXT for strings (not VARCHAR) + CHECK for length limits
--   - Use TIMESTAMPTZ (not TIMESTAMP) for all timestamps
--   - Use NUMERIC for money (never FLOAT)
--   - Use JSONB (not JSON) for semi-structured data
--
-- CONSTRAINTS:
--   - Add NOT NULL everywhere semantically required
--   - FK columns need MANUAL indexes (PostgreSQL doesn't auto-create)
--   - UNIQUE allows multiple NULLs (use NULLS NOT DISTINCT in PG15+)
--
-- PERFORMANCE:
--   - Index FK columns, frequent filters, and join keys
--   - Use partial indexes for hot subsets (WHERE status = 'active')
--   - Use GIN for JSONB, arrays, full-text search
--   - Use BRIN for large time-series tables
--
-- GOTCHAS:
--   - Identifiers are lowercased (use snake_case)
--   - No silent coercions (overflows error, not truncate)
--   - Updates leave dead tuples (VACUUM handles them)
--
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER FUNCTIONS (must be created before tables that use them)
-- ============================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Soft delete helper (if using soft deletes)
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Tax professional profile extending auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    firm_name TEXT,
    license_number TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    booking_slug TEXT UNIQUE,
    tax_season_start DATE,
    tax_season_end DATE,
    max_daily_appointments INTEGER NOT NULL DEFAULT 8,
    max_daily_appointments_tax_season INTEGER NOT NULL DEFAULT 12,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tax clients belonging to a practitioner
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    tax_id_last4 TEXT,
    filing_status TEXT,
    preferred_contact TEXT NOT NULL DEFAULT 'email',
    notes TEXT,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Service offerings by a tax professional
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price NUMERIC,
    tax_season_only BOOLEAN NOT NULL DEFAULT false,
    requires_documents BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    buffer_minutes INTEGER NOT NULL DEFAULT 15,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled appointments between practitioners and clients
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID NOT NULL,
    service_id UUID NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    meeting_link TEXT,
    reminder_sent_24h BOOLEAN NOT NULL DEFAULT false,
    reminder_sent_1h BOOLEAN NOT NULL DEFAULT false,
    cancellation_reason TEXT,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Practitioner working hours
CREATE TABLE IF NOT EXISTS availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_tax_season BOOLEAN NOT NULL DEFAULT false,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER update_availabilities_updated_at
    BEFORE UPDATE ON availabilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Client tax documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID NOT NULL,
    appointment_id UUID,
    document_type TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    status TEXT NOT NULL DEFAULT 'requested',
    tax_year INTEGER,
    notes TEXT,
    rejection_reason TEXT,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- RELATIONSHIPS (Foreign Keys)
-- ============================================================
--
-- IMPORTANT: PostgreSQL does NOT auto-index FK columns!
-- FK indexes are created below for:
--   - Faster JOINs on the FK column
--   - Preventing full table locks on parent DELETE/UPDATE

ALTER TABLE clients
    ADD CONSTRAINT fk_clients_profiles
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_clients_user_id
    ON clients (user_id);

ALTER TABLE services
    ADD CONSTRAINT fk_services_profiles
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_services_user_id
    ON services (user_id);

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_profiles
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_appointments_user_id
    ON appointments (user_id);

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_clients
    FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_appointments_client_id
    ON appointments (client_id);

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_services
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_appointments_service_id
    ON appointments (service_id);

ALTER TABLE availabilities
    ADD CONSTRAINT fk_availabilities_profiles
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_availabilities_user_id
    ON availabilities (user_id);

ALTER TABLE documents
    ADD CONSTRAINT fk_documents_profiles
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_documents_user_id
    ON documents (user_id);

ALTER TABLE documents
    ADD CONSTRAINT fk_documents_clients
    FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_documents_client_id
    ON documents (client_id);

ALTER TABLE documents
    ADD CONSTRAINT fk_documents_appointments
    FOREIGN KEY (appointment_id)
    REFERENCES appointments(id)
    ON DELETE CASCADE;

-- FK index (required for performance)
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id
    ON documents (appointment_id);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_idx_profiles_user_id
    ON profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_clients_idx_clients_user_id
    ON clients (user_id);
CREATE INDEX IF NOT EXISTS idx_clients_idx_clients_user_id
    ON clients (user_id);

CREATE INDEX IF NOT EXISTS idx_services_idx_services_user_id
    ON services (user_id);
CREATE INDEX IF NOT EXISTS idx_services_idx_services_user_id
    ON services (user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_idx_appointments_user_id
    ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_idx_appointments_client_id
    ON appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_idx_appointments_service_id
    ON appointments (service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_idx_appointments_starts_at
    ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_idx_appointments_user_id
    ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_idx_appointments_client_id
    ON appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_idx_appointments_service_id
    ON appointments (service_id);

CREATE INDEX IF NOT EXISTS idx_availabilities_idx_availability_user_id
    ON availabilities (user_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_idx_availability_user_id
    ON availabilities (user_id);

CREATE INDEX IF NOT EXISTS idx_documents_idx_documents_user_id
    ON documents (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_idx_documents_client_id
    ON documents (client_id);
CREATE INDEX IF NOT EXISTS idx_documents_idx_documents_appointment_id
    ON documents (appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_idx_documents_user_id
    ON documents (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_idx_documents_client_id
    ON documents (client_id);
CREATE INDEX IF NOT EXISTS idx_documents_idx_documents_appointment_id
    ON documents (appointment_id);


-- ============================================================
-- CONSTRAINTS
-- ============================================================

ALTER TABLE profiles
    ADD CONSTRAINT chk_profiles_chk_profiles_subscription_tier_values
    CHECK (subscription_tier IN ('free', 'pro', 'firm'));

ALTER TABLE clients
    ADD CONSTRAINT chk_clients_chk_clients_filing_status_values
    CHECK (filing_status IN ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_widow'));
ALTER TABLE clients
    ADD CONSTRAINT chk_clients_chk_clients_preferred_contact_values
    CHECK (preferred_contact IN ('email', 'phone', 'text'));


ALTER TABLE appointments
    ADD CONSTRAINT chk_appointments_chk_appointments_status_values
    CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));
ALTER TABLE appointments
    ADD CONSTRAINT chk_appointments_chk_appointments_status_states
    CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));


ALTER TABLE documents
    ADD CONSTRAINT chk_documents_chk_documents_document_type_values
    CHECK (document_type IN ('w2', '1099_misc', '1099_nec', '1099_int', '1099_div', '1099_b', '1099_r', '1098', 'property_tax', 'charitable_donations', 'medical_expenses', 'business_expenses', 'prior_return', 'id_verification', 'other'));
ALTER TABLE documents
    ADD CONSTRAINT chk_documents_chk_documents_status_values
    CHECK (status IN ('requested', 'uploaded', 'reviewed', 'accepted', 'rejected'));
ALTER TABLE documents
    ADD CONSTRAINT chk_documents_chk_documents_status_states
    CHECK (status IN ('requested', 'uploaded', 'reviewed', 'accepted', 'rejected'));


-- ============================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ============================================================
-- CRITICAL: These security definer functions BYPASS RLS when checking
-- membership/ownership. This prevents infinite recursion when policies
-- reference tables that themselves have RLS enabled.
--
-- ANTI-PATTERN TO AVOID:
--   CREATE POLICY "Members can view" ON team_members FOR SELECT
--   USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid()));
--   ^^^ This causes INFINITE RECURSION because the policy queries itself!
--
-- CORRECT PATTERN:
--   Use a SECURITY DEFINER function that bypasses RLS:
--   CREATE POLICY "Members can view" ON team_members FOR SELECT
--   USING (is_team_member(team_id, auth.uid()));

-- Check if user is a member of a team (bypasses RLS)
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id AND user_id = p_user_id
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user owns a team (bypasses RLS)
CREATE OR REPLACE FUNCTION is_team_owner(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM teams
        WHERE id = p_team_id AND owner_id = p_user_id
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user has access to a resource via ownership or team membership
CREATE OR REPLACE FUNCTION has_resource_access(p_user_id UUID, p_owner_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
    SELECT p_user_id = p_owner_id
        OR (p_team_id IS NOT NULL AND is_team_member(p_team_id, p_user_id));
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- IMPORTANT: Enable RLS on all tables with user data

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- STANDARD USER-OWNED TABLE
CREATE POLICY "Users can view own profiles"
    ON profiles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
    ON profiles
    FOR DELETE
    USING (auth.uid() = user_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- STANDARD USER-OWNED TABLE
CREATE POLICY "Users can view own clients"
    ON clients
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
    ON clients
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
    ON clients
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
    ON clients
    FOR DELETE
    USING (auth.uid() = user_id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- STANDARD USER-OWNED TABLE
CREATE POLICY "Users can view own services"
    ON services
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
    ON services
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
    ON services
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
    ON services
    FOR DELETE
    USING (auth.uid() = user_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- STANDARD USER-OWNED TABLE
CREATE POLICY "Users can view own appointments"
    ON appointments
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
    ON appointments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
    ON appointments
    FOR DELETE
    USING (auth.uid() = user_id);

ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- STANDARD USER-OWNED TABLE
CREATE POLICY "Users can view own availabilities"
    ON availabilities
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own availabilities"
    ON availabilities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availabilities"
    ON availabilities
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own availabilities"
    ON availabilities
    FOR DELETE
    USING (auth.uid() = user_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- STANDARD USER-OWNED TABLE
CREATE POLICY "Users can view own documents"
    ON documents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON documents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON documents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON documents
    FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================
-- SENSITIVE DATA HANDLING
-- ============================================================

-- ============================================================
-- GENERATED BY MENTAL MODELS SDLC
-- ============================================================
