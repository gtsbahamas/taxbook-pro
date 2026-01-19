# Database Migration Guide - taxbook-pro

> Generated: 2026-01-19
>
> This guide covers Supabase migration management for taxbook-pro.
> Follow these practices to evolve your database schema safely.

---

## Migration Workflow

### 1. Creating a New Migration

```bash
# Generate a new migration file with timestamp
supabase migration new <migration_name>

# Example: Adding a new feature
supabase migration new add_notifications_table
```

This creates a file in `supabase/migrations/` with the format:
```
YYYYMMDDHHMMSS_add_notifications_table.sql
```

### 2. Writing the Migration

Open the generated file and add your SQL:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_notifications_table.sql

-- ============================================================
-- MIGRATION: Add Notifications Table
-- Description: User notification system for taxbook-pro
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_notifications_user_unread
    ON notifications (user_id, created_at)
    WHERE read_at IS NULL;
```

### 3. Testing Locally

```bash
# Reset local database and apply all migrations
supabase db reset

# Or apply only new migrations
supabase db push

# Verify the changes
supabase db diff
# Should show no changes if migrations are applied correctly
```

### 4. Applying to Production

```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref 

# Push migrations to production
supabase db push --linked

# Verify production schema matches
supabase db diff --linked
```

---

## Naming Conventions

### Migration File Names

Use descriptive, action-oriented names in snake_case:

| Pattern | Example | Use Case |
|---------|---------|----------|
| `add_<table>_table` | `add_notifications_table` | New table |
| `add_<column>_to_<table>` | `add_avatar_url_to_profiles` | New column |
| `remove_<column>_from_<table>` | `remove_legacy_field_from_users` | Drop column |
| `rename_<old>_to_<new>` | `rename_name_to_display_name` | Rename column |
| `add_<name>_index` | `add_email_search_index` | New index |
| `update_<table>_rls` | `update_posts_rls` | RLS policy changes |
| `add_<function>_function` | `add_is_team_member_function` | New function |

### Sequential Numbering

For projects with ordered migrations, use three-digit prefixes:

```
supabase/migrations/
├── 000_auth_profiles.sql          # Auth system (always first)
├── 001_initial_schema.sql         # Core entities
├── 002_storage_buckets.sql        # File storage
├── 003_soft_delete.sql            # Soft delete support
├── 004_add_notifications.sql      # Feature additions
└── 005_performance_indexes.sql    # Performance tuning
```

---

## Best Practices

### Atomic Migrations

Each migration should be a single, complete unit of work:

```sql
-- GOOD: Single focused change
-- Migration: add_status_to_orders.sql
ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
CREATE INDEX idx_orders_status ON orders (status);
```

```sql
-- BAD: Multiple unrelated changes in one file
-- Migration: various_updates.sql
ALTER TABLE orders ADD COLUMN status TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;  -- Unrelated!
DROP TABLE legacy_data;                    -- Unrelated!
```

### Backwards Compatibility

When modifying existing tables, ensure old code continues to work:

```sql
-- GOOD: Add column with default (old code unaffected)
ALTER TABLE profile
    ADD COLUMN priority INTEGER DEFAULT 0;

-- GOOD: Make column nullable before removing
ALTER TABLE profile
    ALTER COLUMN deprecated_field DROP NOT NULL;

-- BAD: Drop column without migration period
ALTER TABLE profile
    DROP COLUMN important_field;  -- Breaks running code!
```

### Data Migrations vs Schema Migrations

Separate data changes from schema changes:

```sql
-- Schema migration: 004_add_role_column.sql
ALTER TABLE team_members ADD COLUMN role TEXT DEFAULT 'member';

-- Data migration: 005_populate_roles.sql
-- Run AFTER schema migration, potentially in batches
UPDATE team_members
SET role = 'owner'
WHERE user_id IN (SELECT owner_id FROM teams);
```

### Handling Large Tables

For tables with millions of rows, avoid blocking operations:

```sql
-- GOOD: Create index concurrently (non-blocking)
CREATE INDEX CONCURRENTLY idx_large_table_column
    ON large_table (column);

-- GOOD: Add column without default first, then backfill
ALTER TABLE large_table ADD COLUMN new_field TEXT;
-- Then backfill in batches via application code

-- BAD: This locks the entire table!
ALTER TABLE large_table ADD COLUMN new_field TEXT DEFAULT 'value';
```

---

## Supabase CLI Reference

### Essential Commands

```bash
# Create new migration
supabase migration new <name>

# Apply migrations to local database
supabase db push

# Apply migrations to production
supabase db push --linked

# Reset local database (drops all data!)
supabase db reset

# Show pending migrations
supabase migration list

# Generate TypeScript types after migration
supabase gen types typescript --local > src/types/database.ts
```

### Diff and Inspection

```bash
# Show difference between migrations and current schema
supabase db diff

# Show difference against production
supabase db diff --linked

# Inspect current schema
supabase inspect db schema

# View migration history
supabase migration list --linked
```

### Remote Operations

```bash
# Link to Supabase project
supabase link --project-ref 

# Pull production schema (creates migration from diff)
supabase db pull

# Push local migrations to production
supabase db push --linked
```

---

## Common Migration Patterns

### Adding Columns with Defaults

```sql
-- Safe pattern for adding non-nullable columns
-- Step 1: Add as nullable
ALTER TABLE profile
    ADD COLUMN priority INTEGER;

-- Step 2: Backfill existing rows
UPDATE profile
    SET priority = 0
    WHERE priority IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE profile
    ALTER COLUMN priority SET NOT NULL;

-- Step 4: Add default for new rows
ALTER TABLE profile
    ALTER COLUMN priority SET DEFAULT 0;
```

### Renaming Columns Safely

```sql
-- Two-phase rename for zero-downtime deployment
-- Phase 1: Add new column, copy data
ALTER TABLE profile
    ADD COLUMN display_name TEXT;

UPDATE profile
    SET display_name = name;

-- Deploy code that reads/writes both columns
-- Phase 2: (After code deployed) Drop old column
ALTER TABLE profile
    DROP COLUMN name;
```

### Adding Indexes

```sql
-- Standard index
CREATE INDEX idx_profile_created
    ON profile (created_at DESC);

-- Partial index (more efficient for filtered queries)
CREATE INDEX idx_profile_active
    ON profile (user_id, created_at)
    WHERE deleted_at IS NULL;

-- Composite index for common queries
CREATE INDEX idx_profile_user_status
    ON profile (user_id, status, created_at DESC);

-- GIN index for full-text search
CREATE INDEX idx_profile_search
    ON profile
    USING GIN (to_tsvector('english', title || ' ' || description));
```

### Modifying RLS Policies

```sql
-- Drop existing policy before recreating
DROP POLICY IF EXISTS "Users can view own items"
    ON profile;

-- Create updated policy
CREATE POLICY "Users can view own items"
    ON profile
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_team_member(team_id, auth.uid())
    );
```

### Adding Foreign Key Relationships

```sql
-- Add FK with proper handling
ALTER TABLE child_table
    ADD COLUMN parent_id UUID;

-- Update existing data if needed
UPDATE child_table
    SET parent_id = (SELECT id FROM parent_table LIMIT 1)
    WHERE parent_id IS NULL;

-- Add constraint
ALTER TABLE child_table
    ADD CONSTRAINT fk_child_parent
    FOREIGN KEY (parent_id)
    REFERENCES parent_table(id)
    ON DELETE CASCADE;
```

---

## Emergency Procedures

### Identifying Broken Migrations

```bash
# Check migration status
supabase migration list --linked

# Look for failed migrations in logs
supabase logs --service postgres

# Verify current schema state
supabase inspect db schema
```

### Manual Rollback Steps

**WARNING: These operations can cause data loss. Always backup first.**

```bash
# 1. Create a backup before any rollback
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql --linked
```

```sql
-- 2. Identify what needs to be reverted
-- Review the migration that caused issues

-- 3. Create a rollback migration
-- supabase migration new rollback_<original_migration_name>

-- Example rollback for "add_notifications_table"
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP TABLE IF EXISTS notifications;
```

### Data Recovery

```bash
# Restore from Supabase dashboard Point-in-Time Recovery
# Go to: Settings > Database > Point-in-Time Recovery

# Or restore from backup file
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
    < backup_20240101_120000.sql
```

### Fixing Infinite Recursion in RLS

If you encounter "infinite recursion detected in policy":

```sql
-- PROBLEM: Policy references its own table
CREATE POLICY "bad_policy" ON team_members FOR SELECT
USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid()));
-- ^^^ This causes infinite recursion!

-- SOLUTION: Use SECURITY DEFINER function
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id AND user_id = p_user_id
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Now use the function in policy
DROP POLICY IF EXISTS "bad_policy" ON team_members;
CREATE POLICY "good_policy" ON team_members FOR SELECT
USING (is_team_member(team_id, auth.uid()));
```

---

## Migration Checklist

Before applying a migration to production:

- [ ] Migration file has descriptive name
- [ ] SQL is tested locally with `supabase db reset`
- [ ] `supabase db diff` shows expected changes only
- [ ] RLS policies don't cause infinite recursion
- [ ] Large table operations use `CONCURRENTLY` where possible
- [ ] Rollback procedure is documented
- [ ] TypeScript types regenerated: `supabase gen types typescript --local`
- [ ] Application code handles both old and new schema (if applicable)

---

## Project-Specific Entities

Your taxbook-pro database includes these core entities:

| Entity | Description |
|--------|-------------|
| `profile` | Tax professional profile extending auth.users |
| `client` | Tax clients belonging to a practitioner |
| `service` | Service offerings by a tax professional |
| `appointment` | Scheduled appointments between practitioners and clients |
| `availability` | Practitioner working hours |
| `document` | Client tax documents |

When creating migrations for these entities, follow the patterns above and ensure RLS policies maintain proper access control.

---

## Quick Reference Card

| Task | Command |
|------|---------|
| New migration | `supabase migration new <name>` |
| Apply locally | `supabase db push` |
| Apply to prod | `supabase db push --linked` |
| Reset local | `supabase db reset` |
| Check diff | `supabase db diff` |
| Generate types | `supabase gen types typescript --local > src/types/database.ts` |
| View logs | `supabase logs --service postgres` |
| Backup | `supabase db dump -f backup.sql --linked` |

---

*Generated by Mental Models SDLC - Safe Schema Evolution*
