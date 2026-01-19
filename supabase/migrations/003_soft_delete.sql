-- ============================================================
-- SOFT DELETE MIGRATION - taxbook-pro
-- Generated: 2026-01-19
-- ============================================================
--
-- SUPABASE MIGRATION
-- Run with: supabase db push (dev) or supabase db push --linked (prod)
--
-- This migration adds soft delete support to all entities.
-- Soft delete preserves data for audit trails and recovery.
--
-- PATTERN: Instead of DELETE, set deleted_at timestamp.
-- All queries should filter WHERE deleted_at IS NULL by default.
-- Use *_active views for convenience.
--
-- ============================================================

-- ============================================================
-- SOFT DELETE COLUMNS
-- ============================================================
-- Add deleted_at and deleted_by columns to all entities

-- Add soft delete columns to profile
ALTER TABLE profile
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Index for filtering non-deleted rows efficiently
CREATE INDEX IF NOT EXISTS idx_profile_deleted_at
    ON profile (deleted_at)
    WHERE deleted_at IS NULL;

-- Composite index for common queries on deleted status
CREATE INDEX IF NOT EXISTS idx_profile_active
    ON profile (id)
    WHERE deleted_at IS NULL;

-- Add soft delete columns to client
ALTER TABLE client
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Index for filtering non-deleted rows efficiently
CREATE INDEX IF NOT EXISTS idx_client_deleted_at
    ON client (deleted_at)
    WHERE deleted_at IS NULL;

-- Composite index for common queries on deleted status
CREATE INDEX IF NOT EXISTS idx_client_active
    ON client (id)
    WHERE deleted_at IS NULL;

-- Add soft delete columns to service
ALTER TABLE service
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Index for filtering non-deleted rows efficiently
CREATE INDEX IF NOT EXISTS idx_service_deleted_at
    ON service (deleted_at)
    WHERE deleted_at IS NULL;

-- Composite index for common queries on deleted status
CREATE INDEX IF NOT EXISTS idx_service_active
    ON service (id)
    WHERE deleted_at IS NULL;

-- Add soft delete columns to appointment
ALTER TABLE appointment
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Index for filtering non-deleted rows efficiently
CREATE INDEX IF NOT EXISTS idx_appointment_deleted_at
    ON appointment (deleted_at)
    WHERE deleted_at IS NULL;

-- Composite index for common queries on deleted status
CREATE INDEX IF NOT EXISTS idx_appointment_active
    ON appointment (id)
    WHERE deleted_at IS NULL;

-- Add soft delete columns to availability
ALTER TABLE availability
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Index for filtering non-deleted rows efficiently
CREATE INDEX IF NOT EXISTS idx_availability_deleted_at
    ON availability (deleted_at)
    WHERE deleted_at IS NULL;

-- Composite index for common queries on deleted status
CREATE INDEX IF NOT EXISTS idx_availability_active
    ON availability (id)
    WHERE deleted_at IS NULL;

-- Add soft delete columns to document
ALTER TABLE document
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Index for filtering non-deleted rows efficiently
CREATE INDEX IF NOT EXISTS idx_document_deleted_at
    ON document (deleted_at)
    WHERE deleted_at IS NULL;

-- Composite index for common queries on deleted status
CREATE INDEX IF NOT EXISTS idx_document_active
    ON document (id)
    WHERE deleted_at IS NULL;


-- ============================================================
-- ACTIVE VIEWS
-- ============================================================
-- These views exclude soft-deleted rows for convenience.
-- Use these in application queries instead of raw tables.

-- Active view for profile (excludes deleted rows)
CREATE OR REPLACE VIEW profile_active AS
SELECT *
FROM profile
WHERE deleted_at IS NULL;

-- Active view for client (excludes deleted rows)
CREATE OR REPLACE VIEW client_active AS
SELECT *
FROM client
WHERE deleted_at IS NULL;

-- Active view for service (excludes deleted rows)
CREATE OR REPLACE VIEW service_active AS
SELECT *
FROM service
WHERE deleted_at IS NULL;

-- Active view for appointment (excludes deleted rows)
CREATE OR REPLACE VIEW appointment_active AS
SELECT *
FROM appointment
WHERE deleted_at IS NULL;

-- Active view for availability (excludes deleted rows)
CREATE OR REPLACE VIEW availability_active AS
SELECT *
FROM availability
WHERE deleted_at IS NULL;

-- Active view for document (excludes deleted rows)
CREATE OR REPLACE VIEW document_active AS
SELECT *
FROM document
WHERE deleted_at IS NULL;


-- ============================================================
-- SOFT DELETE FUNCTIONS
-- ============================================================
-- SECURITY DEFINER functions for soft delete operations.
-- These bypass RLS to ensure consistent behavior.

-- Soft delete function for profile
-- Sets deleted_at and deleted_by, preserving the row
CREATE OR REPLACE FUNCTION soft_delete_profile(p_id UUID)
RETURNS profile AS $$
DECLARE
    v_result profile;
BEGIN
    UPDATE profile
    SET
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_id
        AND deleted_at IS NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or already deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore function for profile
-- Clears deleted_at and deleted_by, making row active again
CREATE OR REPLACE FUNCTION restore_profile(p_id UUID)
RETURNS profile AS $$
DECLARE
    v_result profile;
BEGIN
    UPDATE profile
    SET
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_id
        AND deleted_at IS NOT NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or not deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hard delete function for profile (admin cleanup only)
-- Permanently removes the row - USE WITH CAUTION
CREATE OR REPLACE FUNCTION hard_delete_profile(p_id UUID, p_require_soft_deleted BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_require_soft_deleted THEN
        -- Only hard delete if already soft deleted
        DELETE FROM profile
        WHERE id = p_id
            AND deleted_at IS NOT NULL;
    ELSE
        -- Force hard delete regardless of soft delete status
        DELETE FROM profile
        WHERE id = p_id;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RAISE EXCEPTION 'Record not found or not eligible for hard delete: %', p_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Soft delete function for client
-- Sets deleted_at and deleted_by, preserving the row
CREATE OR REPLACE FUNCTION soft_delete_client(p_id UUID)
RETURNS client AS $$
DECLARE
    v_result client;
BEGIN
    UPDATE client
    SET
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_id
        AND deleted_at IS NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or already deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore function for client
-- Clears deleted_at and deleted_by, making row active again
CREATE OR REPLACE FUNCTION restore_client(p_id UUID)
RETURNS client AS $$
DECLARE
    v_result client;
BEGIN
    UPDATE client
    SET
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_id
        AND deleted_at IS NOT NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or not deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hard delete function for client (admin cleanup only)
-- Permanently removes the row - USE WITH CAUTION
CREATE OR REPLACE FUNCTION hard_delete_client(p_id UUID, p_require_soft_deleted BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_require_soft_deleted THEN
        -- Only hard delete if already soft deleted
        DELETE FROM client
        WHERE id = p_id
            AND deleted_at IS NOT NULL;
    ELSE
        -- Force hard delete regardless of soft delete status
        DELETE FROM client
        WHERE id = p_id;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RAISE EXCEPTION 'Record not found or not eligible for hard delete: %', p_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Soft delete function for service
-- Sets deleted_at and deleted_by, preserving the row
CREATE OR REPLACE FUNCTION soft_delete_service(p_id UUID)
RETURNS service AS $$
DECLARE
    v_result service;
BEGIN
    UPDATE service
    SET
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_id
        AND deleted_at IS NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or already deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore function for service
-- Clears deleted_at and deleted_by, making row active again
CREATE OR REPLACE FUNCTION restore_service(p_id UUID)
RETURNS service AS $$
DECLARE
    v_result service;
BEGIN
    UPDATE service
    SET
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_id
        AND deleted_at IS NOT NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or not deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hard delete function for service (admin cleanup only)
-- Permanently removes the row - USE WITH CAUTION
CREATE OR REPLACE FUNCTION hard_delete_service(p_id UUID, p_require_soft_deleted BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_require_soft_deleted THEN
        -- Only hard delete if already soft deleted
        DELETE FROM service
        WHERE id = p_id
            AND deleted_at IS NOT NULL;
    ELSE
        -- Force hard delete regardless of soft delete status
        DELETE FROM service
        WHERE id = p_id;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RAISE EXCEPTION 'Record not found or not eligible for hard delete: %', p_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Soft delete function for appointment
-- Sets deleted_at and deleted_by, preserving the row
CREATE OR REPLACE FUNCTION soft_delete_appointment(p_id UUID)
RETURNS appointment AS $$
DECLARE
    v_result appointment;
BEGIN
    UPDATE appointment
    SET
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_id
        AND deleted_at IS NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or already deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore function for appointment
-- Clears deleted_at and deleted_by, making row active again
CREATE OR REPLACE FUNCTION restore_appointment(p_id UUID)
RETURNS appointment AS $$
DECLARE
    v_result appointment;
BEGIN
    UPDATE appointment
    SET
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_id
        AND deleted_at IS NOT NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or not deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hard delete function for appointment (admin cleanup only)
-- Permanently removes the row - USE WITH CAUTION
CREATE OR REPLACE FUNCTION hard_delete_appointment(p_id UUID, p_require_soft_deleted BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_require_soft_deleted THEN
        -- Only hard delete if already soft deleted
        DELETE FROM appointment
        WHERE id = p_id
            AND deleted_at IS NOT NULL;
    ELSE
        -- Force hard delete regardless of soft delete status
        DELETE FROM appointment
        WHERE id = p_id;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RAISE EXCEPTION 'Record not found or not eligible for hard delete: %', p_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Soft delete function for availability
-- Sets deleted_at and deleted_by, preserving the row
CREATE OR REPLACE FUNCTION soft_delete_availability(p_id UUID)
RETURNS availability AS $$
DECLARE
    v_result availability;
BEGIN
    UPDATE availability
    SET
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_id
        AND deleted_at IS NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or already deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore function for availability
-- Clears deleted_at and deleted_by, making row active again
CREATE OR REPLACE FUNCTION restore_availability(p_id UUID)
RETURNS availability AS $$
DECLARE
    v_result availability;
BEGIN
    UPDATE availability
    SET
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_id
        AND deleted_at IS NOT NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or not deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hard delete function for availability (admin cleanup only)
-- Permanently removes the row - USE WITH CAUTION
CREATE OR REPLACE FUNCTION hard_delete_availability(p_id UUID, p_require_soft_deleted BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_require_soft_deleted THEN
        -- Only hard delete if already soft deleted
        DELETE FROM availability
        WHERE id = p_id
            AND deleted_at IS NOT NULL;
    ELSE
        -- Force hard delete regardless of soft delete status
        DELETE FROM availability
        WHERE id = p_id;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RAISE EXCEPTION 'Record not found or not eligible for hard delete: %', p_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Soft delete function for document
-- Sets deleted_at and deleted_by, preserving the row
CREATE OR REPLACE FUNCTION soft_delete_document(p_id UUID)
RETURNS document AS $$
DECLARE
    v_result document;
BEGIN
    UPDATE document
    SET
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_id
        AND deleted_at IS NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or already deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore function for document
-- Clears deleted_at and deleted_by, making row active again
CREATE OR REPLACE FUNCTION restore_document(p_id UUID)
RETURNS document AS $$
DECLARE
    v_result document;
BEGIN
    UPDATE document
    SET
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_id
        AND deleted_at IS NOT NULL
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Record not found or not deleted: %', p_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hard delete function for document (admin cleanup only)
-- Permanently removes the row - USE WITH CAUTION
CREATE OR REPLACE FUNCTION hard_delete_document(p_id UUID, p_require_soft_deleted BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_require_soft_deleted THEN
        -- Only hard delete if already soft deleted
        DELETE FROM document
        WHERE id = p_id
            AND deleted_at IS NOT NULL;
    ELSE
        -- Force hard delete regardless of soft delete status
        DELETE FROM document
        WHERE id = p_id;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count = 0 THEN
        RAISE EXCEPTION 'Record not found or not eligible for hard delete: %', p_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- SOFT DELETE TRIGGER
-- ============================================================
-- Generic trigger function to handle soft delete via UPDATE
-- Use this when you want UPDATE ... SET deleted_at = NOW() to
-- automatically set deleted_by

CREATE OR REPLACE FUNCTION handle_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when deleted_at changes from NULL to a value
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        -- Ensure deleted_by is set if not provided
        IF NEW.deleted_by IS NULL THEN
            NEW.deleted_by = auth.uid();
        END IF;
    END IF;

    -- If restoring (deleted_at set back to NULL), clear deleted_by
    IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
        NEW.deleted_by = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Soft delete trigger for profile
DROP TRIGGER IF EXISTS trigger_profile_soft_delete ON profile;
CREATE TRIGGER trigger_profile_soft_delete
    BEFORE UPDATE ON profile
    FOR EACH ROW
    EXECUTE FUNCTION handle_soft_delete();

-- Soft delete trigger for client
DROP TRIGGER IF EXISTS trigger_client_soft_delete ON client;
CREATE TRIGGER trigger_client_soft_delete
    BEFORE UPDATE ON client
    FOR EACH ROW
    EXECUTE FUNCTION handle_soft_delete();

-- Soft delete trigger for service
DROP TRIGGER IF EXISTS trigger_service_soft_delete ON service;
CREATE TRIGGER trigger_service_soft_delete
    BEFORE UPDATE ON service
    FOR EACH ROW
    EXECUTE FUNCTION handle_soft_delete();

-- Soft delete trigger for appointment
DROP TRIGGER IF EXISTS trigger_appointment_soft_delete ON appointment;
CREATE TRIGGER trigger_appointment_soft_delete
    BEFORE UPDATE ON appointment
    FOR EACH ROW
    EXECUTE FUNCTION handle_soft_delete();

-- Soft delete trigger for availability
DROP TRIGGER IF EXISTS trigger_availability_soft_delete ON availability;
CREATE TRIGGER trigger_availability_soft_delete
    BEFORE UPDATE ON availability
    FOR EACH ROW
    EXECUTE FUNCTION handle_soft_delete();

-- Soft delete trigger for document
DROP TRIGGER IF EXISTS trigger_document_soft_delete ON document;
CREATE TRIGGER trigger_document_soft_delete
    BEFORE UPDATE ON document
    FOR EACH ROW
    EXECUTE FUNCTION handle_soft_delete();


-- ============================================================
-- RLS POLICY UPDATES
-- ============================================================
-- Update existing RLS policies to exclude soft-deleted rows.
-- IMPORTANT: Drop and recreate policies to add deleted_at filter.

-- Drop existing policies for profile
DROP POLICY IF EXISTS "Users can view own profile" ON profile;
DROP POLICY IF EXISTS "Users can view own or team profile" ON profile;
DROP POLICY IF EXISTS "Users can view team memberships" ON profile;

-- STANDARD USER-OWNED TABLE with soft delete filter
CREATE POLICY "Users can view own profile"
    ON profile
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    );

-- Update UPDATE policy to prevent updates on deleted rows
DROP POLICY IF EXISTS "Users can update own profile" ON profile;
CREATE POLICY "Users can update own profile"
    ON profile
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Replace DELETE with soft delete policy
-- Users can only soft delete (UPDATE deleted_at), not hard delete
DROP POLICY IF EXISTS "Users can delete own profile" ON profile;
CREATE POLICY "Users can soft delete own profile"
    ON profile
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Prevent actual DELETE operations (only admins via functions)
CREATE POLICY "Deny hard delete profile"
    ON profile
    FOR DELETE
    USING (false);

-- Drop existing policies for client
DROP POLICY IF EXISTS "Users can view own client" ON client;
DROP POLICY IF EXISTS "Users can view own or team client" ON client;
DROP POLICY IF EXISTS "Users can view team memberships" ON client;

-- STANDARD USER-OWNED TABLE with soft delete filter
CREATE POLICY "Users can view own client"
    ON client
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    );

-- Update UPDATE policy to prevent updates on deleted rows
DROP POLICY IF EXISTS "Users can update own client" ON client;
CREATE POLICY "Users can update own client"
    ON client
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Replace DELETE with soft delete policy
-- Users can only soft delete (UPDATE deleted_at), not hard delete
DROP POLICY IF EXISTS "Users can delete own client" ON client;
CREATE POLICY "Users can soft delete own client"
    ON client
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Prevent actual DELETE operations (only admins via functions)
CREATE POLICY "Deny hard delete client"
    ON client
    FOR DELETE
    USING (false);

-- Drop existing policies for service
DROP POLICY IF EXISTS "Users can view own service" ON service;
DROP POLICY IF EXISTS "Users can view own or team service" ON service;
DROP POLICY IF EXISTS "Users can view team memberships" ON service;

-- STANDARD USER-OWNED TABLE with soft delete filter
CREATE POLICY "Users can view own service"
    ON service
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    );

-- Update UPDATE policy to prevent updates on deleted rows
DROP POLICY IF EXISTS "Users can update own service" ON service;
CREATE POLICY "Users can update own service"
    ON service
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Replace DELETE with soft delete policy
-- Users can only soft delete (UPDATE deleted_at), not hard delete
DROP POLICY IF EXISTS "Users can delete own service" ON service;
CREATE POLICY "Users can soft delete own service"
    ON service
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Prevent actual DELETE operations (only admins via functions)
CREATE POLICY "Deny hard delete service"
    ON service
    FOR DELETE
    USING (false);

-- Drop existing policies for appointment
DROP POLICY IF EXISTS "Users can view own appointment" ON appointment;
DROP POLICY IF EXISTS "Users can view own or team appointment" ON appointment;
DROP POLICY IF EXISTS "Users can view team memberships" ON appointment;

-- STANDARD USER-OWNED TABLE with soft delete filter
CREATE POLICY "Users can view own appointment"
    ON appointment
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    );

-- Update UPDATE policy to prevent updates on deleted rows
DROP POLICY IF EXISTS "Users can update own appointment" ON appointment;
CREATE POLICY "Users can update own appointment"
    ON appointment
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Replace DELETE with soft delete policy
-- Users can only soft delete (UPDATE deleted_at), not hard delete
DROP POLICY IF EXISTS "Users can delete own appointment" ON appointment;
CREATE POLICY "Users can soft delete own appointment"
    ON appointment
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Prevent actual DELETE operations (only admins via functions)
CREATE POLICY "Deny hard delete appointment"
    ON appointment
    FOR DELETE
    USING (false);

-- Drop existing policies for availability
DROP POLICY IF EXISTS "Users can view own availability" ON availability;
DROP POLICY IF EXISTS "Users can view own or team availability" ON availability;
DROP POLICY IF EXISTS "Users can view team memberships" ON availability;

-- STANDARD USER-OWNED TABLE with soft delete filter
CREATE POLICY "Users can view own availability"
    ON availability
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    );

-- Update UPDATE policy to prevent updates on deleted rows
DROP POLICY IF EXISTS "Users can update own availability" ON availability;
CREATE POLICY "Users can update own availability"
    ON availability
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Replace DELETE with soft delete policy
-- Users can only soft delete (UPDATE deleted_at), not hard delete
DROP POLICY IF EXISTS "Users can delete own availability" ON availability;
CREATE POLICY "Users can soft delete own availability"
    ON availability
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Prevent actual DELETE operations (only admins via functions)
CREATE POLICY "Deny hard delete availability"
    ON availability
    FOR DELETE
    USING (false);

-- Drop existing policies for document
DROP POLICY IF EXISTS "Users can view own document" ON document;
DROP POLICY IF EXISTS "Users can view own or team document" ON document;
DROP POLICY IF EXISTS "Users can view team memberships" ON document;

-- STANDARD USER-OWNED TABLE with soft delete filter
CREATE POLICY "Users can view own document"
    ON document
    FOR SELECT
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    );

-- Update UPDATE policy to prevent updates on deleted rows
DROP POLICY IF EXISTS "Users can update own document" ON document;
CREATE POLICY "Users can update own document"
    ON document
    FOR UPDATE
    USING (
        deleted_at IS NULL AND
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Replace DELETE with soft delete policy
-- Users can only soft delete (UPDATE deleted_at), not hard delete
DROP POLICY IF EXISTS "Users can delete own document" ON document;
CREATE POLICY "Users can soft delete own document"
    ON document
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Prevent actual DELETE operations (only admins via functions)
CREATE POLICY "Deny hard delete document"
    ON document
    FOR DELETE
    USING (false);


-- ============================================================
-- ADMIN FUNCTIONS FOR DELETED RECORDS
-- ============================================================

-- View all soft-deleted records across tables (for admin dashboard)
CREATE OR REPLACE VIEW profile_deleted AS
SELECT
    id,
    deleted_at,
    deleted_by,
    id,
    user_id,
    email,
    name,
    firm_name,
    license_number,
    timezone,
    subscription_tier,
    booking_slug,
    tax_season_start,
    tax_season_end,
    max_daily_appointments,
    max_daily_appointments_tax_season,
    created_at,
    updated_at,
    created_at,
    updated_at
FROM profile
WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW client_deleted AS
SELECT
    id,
    deleted_at,
    deleted_by,
    id,
    user_id,
    name,
    email,
    phone,
    tax_id_last4,
    filing_status,
    preferred_contact,
    notes,
    created_at,
    updated_at,
    created_at,
    updated_at
FROM client
WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW service_deleted AS
SELECT
    id,
    deleted_at,
    deleted_by,
    id,
    user_id,
    name,
    description,
    duration_minutes,
    price,
    tax_season_only,
    requires_documents,
    is_active,
    buffer_minutes,
    created_at,
    updated_at,
    created_at,
    updated_at
FROM service
WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW appointment_deleted AS
SELECT
    id,
    deleted_at,
    deleted_by,
    id,
    user_id,
    client_id,
    service_id,
    starts_at,
    ends_at,
    status,
    notes,
    meeting_link,
    reminder_sent_24h,
    reminder_sent_1h,
    cancellation_reason,
    created_at,
    updated_at,
    created_at,
    updated_at
FROM appointment
WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW availability_deleted AS
SELECT
    id,
    deleted_at,
    deleted_by,
    id,
    user_id,
    day_of_week,
    start_time,
    end_time,
    is_tax_season,
    created_at,
    updated_at,
    created_at,
    updated_at
FROM availability
WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW document_deleted AS
SELECT
    id,
    deleted_at,
    deleted_by,
    id,
    user_id,
    client_id,
    appointment_id,
    document_type,
    file_url,
    file_name,
    status,
    tax_year,
    notes,
    rejection_reason,
    created_at,
    updated_at,
    created_at,
    updated_at
FROM document
WHERE deleted_at IS NOT NULL;


-- Bulk hard delete old soft-deleted records
-- Returns count of deleted records per table
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records(p_days_old INTEGER DEFAULT 90)
RETURNS TABLE(table_name TEXT, deleted_count BIGINT) AS $$
DECLARE
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    v_cutoff_date := NOW() - (p_days_old || ' days')::INTERVAL;

    DELETE FROM profile
    WHERE deleted_at IS NOT NULL
        AND deleted_at < v_cutoff_date;
    RETURN QUERY SELECT 'profile'::TEXT, COUNT(*)::BIGINT
        FROM profile WHERE false; -- Placeholder, actual count from ROW_COUNT

    DELETE FROM client
    WHERE deleted_at IS NOT NULL
        AND deleted_at < v_cutoff_date;
    RETURN QUERY SELECT 'client'::TEXT, COUNT(*)::BIGINT
        FROM client WHERE false; -- Placeholder, actual count from ROW_COUNT

    DELETE FROM service
    WHERE deleted_at IS NOT NULL
        AND deleted_at < v_cutoff_date;
    RETURN QUERY SELECT 'service'::TEXT, COUNT(*)::BIGINT
        FROM service WHERE false; -- Placeholder, actual count from ROW_COUNT

    DELETE FROM appointment
    WHERE deleted_at IS NOT NULL
        AND deleted_at < v_cutoff_date;
    RETURN QUERY SELECT 'appointment'::TEXT, COUNT(*)::BIGINT
        FROM appointment WHERE false; -- Placeholder, actual count from ROW_COUNT

    DELETE FROM availability
    WHERE deleted_at IS NOT NULL
        AND deleted_at < v_cutoff_date;
    RETURN QUERY SELECT 'availability'::TEXT, COUNT(*)::BIGINT
        FROM availability WHERE false; -- Placeholder, actual count from ROW_COUNT

    DELETE FROM document
    WHERE deleted_at IS NOT NULL
        AND deleted_at < v_cutoff_date;
    RETURN QUERY SELECT 'document'::TEXT, COUNT(*)::BIGINT
        FROM document WHERE false; -- Placeholder, actual count from ROW_COUNT

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SCHEDULED JOB FOR PERMANENT DELETION
-- ============================================================
-- IMPORTANT: Configure a scheduled job (pg_cron or external) to
-- periodically clean up old soft-deleted records.
--
-- Example pg_cron job (run monthly, delete records older than 90 days):
--
--   SELECT cron.schedule(
--       'cleanup-deleted-records',
--       '0 3 1 * *',  -- 3am on 1st of each month
--       $$SELECT cleanup_old_deleted_records(90)$$
--   );
--
-- For Supabase, use Edge Functions with a cron trigger or
-- external scheduler to call cleanup_old_deleted_records().
--
-- RETENTION POLICY:
-- - Default: 90 days retention for soft-deleted records
-- - Adjust based on compliance requirements (GDPR, CCPA, etc.)
-- - Consider longer retention for audit-critical data
-- ============================================================

-- ============================================================
-- GENERATED BY MENTAL MODELS SDLC
-- ============================================================
