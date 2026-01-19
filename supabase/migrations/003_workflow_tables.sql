-- ============================================================
-- WORKFLOW TABLES - taxbook-pro
-- Generated: 2026-01-19
-- ============================================================
--
-- DATABASE SCHEMA FOR WORKFLOW PERSISTENCE
--
-- Tables:
-- - workflow_instances: Running and completed workflow instances
-- - workflow_history: Detailed history for audit and debugging
--
-- Features:
-- - Optimistic locking via version column
-- - JSONB for flexible variable storage
-- - Indexes for common query patterns
-- - RLS for data isolation
--
-- DEFENSIVE PATTERNS (Inversion Mental Model):
-- - What if concurrent updates? -> Version-based optimistic locking
-- - What if history grows too large? -> Partitioning/archival ready
-- - What if queries are slow? -> Strategic indexes
--
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- WORKFLOW INSTANCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_instances (
    -- Primary key
    instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Workflow identification
    workflow_id TEXT NOT NULL,
    entity_id UUID NOT NULL,

    -- Current state
    current_state TEXT NOT NULL,
    current_step_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'waiting', 'completed', 'failed', 'compensating', 'compensated', 'cancelled')),

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Data (JSONB for flexibility)
    variables JSONB NOT NULL DEFAULT '{}',
    history JSONB NOT NULL DEFAULT '[]',
    compensation_state JSONB,

    -- Optimistic locking
    version INTEGER NOT NULL DEFAULT 1,

    -- Ownership (for RLS)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Audit
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT workflow_instances_version_positive CHECK (version > 0)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Fast lookup by workflow and entity
CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_entity
    ON workflow_instances(workflow_id, entity_id);

-- Active workflows (for monitoring)
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status
    ON workflow_instances(status)
    WHERE status NOT IN ('completed', 'failed', 'compensated', 'cancelled');

-- User's workflows
CREATE INDEX IF NOT EXISTS idx_workflow_instances_user
    ON workflow_instances(user_id, status);

-- Failed workflows (for ops attention)
CREATE INDEX IF NOT EXISTS idx_workflow_instances_failed
    ON workflow_instances(updated_at DESC)
    WHERE status IN ('failed', 'compensating');

-- Waiting workflows (for event routing)
CREATE INDEX IF NOT EXISTS idx_workflow_instances_waiting
    ON workflow_instances(workflow_id, current_step_id)
    WHERE status = 'waiting';

-- Partial index for active workflows
CREATE INDEX IF NOT EXISTS idx_workflow_instances_active
    ON workflow_instances(workflow_id, updated_at DESC)
    WHERE status IN ('pending', 'running', 'waiting');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION workflow_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflow_instances_updated_at_trigger ON workflow_instances;
CREATE TRIGGER workflow_instances_updated_at_trigger
    BEFORE UPDATE ON workflow_instances
    FOR EACH ROW
    EXECUTE FUNCTION workflow_instances_updated_at();

-- ============================================================
-- VERSION INCREMENT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION workflow_instances_version_check()
RETURNS TRIGGER AS $$
BEGIN
    -- Enforce optimistic locking
    IF OLD.version != NEW.version - 1 THEN
        RAISE EXCEPTION 'Version conflict: expected %, got %', OLD.version + 1, NEW.version
            USING ERRCODE = '23505';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflow_instances_version_trigger ON workflow_instances;
CREATE TRIGGER workflow_instances_version_trigger
    BEFORE UPDATE ON workflow_instances
    FOR EACH ROW
    EXECUTE FUNCTION workflow_instances_version_check();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

-- Users can see their own workflow instances
CREATE POLICY "Users can view own workflow instances"
    ON workflow_instances
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.uid() = created_by
    );

-- Users can create workflow instances
CREATE POLICY "Users can create workflow instances"
    ON workflow_instances
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        auth.uid() = created_by
    );

-- Users can update their own workflow instances
CREATE POLICY "Users can update own workflow instances"
    ON workflow_instances
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        auth.uid() = created_by
    )
    WITH CHECK (
        auth.uid() = user_id OR
        auth.uid() = created_by
    );

-- Service role can access all
CREATE POLICY "Service role full access"
    ON workflow_instances
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- WORKFLOW HISTORY TABLE (Optional - for detailed audit)
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_history (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to instance
    instance_id UUID NOT NULL REFERENCES workflow_instances(instance_id) ON DELETE CASCADE,

    -- History entry data
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    step_id TEXT NOT NULL,
    state TEXT NOT NULL,
    event TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    variables JSONB,
    error TEXT,
    duration_ms INTEGER,

    -- For partitioning/archival
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching history by instance
CREATE INDEX IF NOT EXISTS idx_workflow_history_instance
    ON workflow_history(instance_id, timestamp DESC);

-- Index for audit queries by user
CREATE INDEX IF NOT EXISTS idx_workflow_history_user
    ON workflow_history(user_id, timestamp DESC)
    WHERE user_id IS NOT NULL;

-- RLS for history
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;

-- Users can view history for their workflow instances
CREATE POLICY "Users can view own workflow history"
    ON workflow_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workflow_instances wi
            WHERE wi.instance_id = workflow_history.instance_id
            AND (wi.user_id = auth.uid() OR wi.created_by = auth.uid())
        )
    );

-- Only system can insert history
CREATE POLICY "Service role can insert history"
    ON workflow_history
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get active workflow for an entity
CREATE OR REPLACE FUNCTION get_active_workflow(
    p_workflow_id TEXT,
    p_entity_id UUID
)
RETURNS workflow_instances AS $$
    SELECT *
    FROM workflow_instances
    WHERE workflow_id = p_workflow_id
    AND entity_id = p_entity_id
    AND status IN ('pending', 'running', 'waiting')
    ORDER BY started_at DESC
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get workflow status summary
CREATE OR REPLACE FUNCTION get_workflow_summary(
    p_workflow_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    workflow_id TEXT,
    status TEXT,
    count BIGINT,
    avg_duration_hours NUMERIC
) AS $$
    SELECT
        wi.workflow_id,
        wi.status,
        COUNT(*),
        AVG(EXTRACT(EPOCH FROM (COALESCE(wi.completed_at, NOW()) - wi.started_at)) / 3600)::NUMERIC(10, 2)
    FROM workflow_instances wi
    WHERE (p_workflow_id IS NULL OR wi.workflow_id = p_workflow_id)
    GROUP BY wi.workflow_id, wi.status
    ORDER BY wi.workflow_id, wi.status;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Archive completed workflows older than N days
CREATE OR REPLACE FUNCTION archive_completed_workflows(
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move old completed workflows to archive
    -- In production, you'd insert into an archive table first

    DELETE FROM workflow_instances
    WHERE status IN ('completed', 'compensated', 'cancelled')
    AND completed_at < NOW() - (p_days_old || ' days')::INTERVAL;

    GET DIAGNOSTICS archived_count = ROW_COUNT;

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SAMPLE DATA (for development)
-- ============================================================

-- Uncomment to insert sample data
/*
INSERT INTO workflow_instances (
    instance_id,
    workflow_id,
    entity_id,
    current_state,
    current_step_id,
    status,
    variables
) VALUES (
    uuid_generate_v4(),
    'order-fulfillment',
    uuid_generate_v4(),
    'pending',
    'validate-order',
    'pending',
    '{"orderId": "ORD-001", "items": []}'::jsonb
);
*/

-- ============================================================
-- GENERATED BY MENTAL MODELS SDLC
-- ============================================================
