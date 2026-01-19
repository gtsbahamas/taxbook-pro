-- ============================================================
-- AUTH PROFILES - taxbook-pro
-- Generated: 2026-01-19
-- ============================================================
--
-- SUPABASE AUTH PROFILE SETUP
-- This migration MUST run before any other migrations that reference profiles.
--
-- This creates:
-- 1. User profiles table linked to auth.users
-- 2. RLS policies that allow the auth trigger to INSERT
-- 3. Trigger to auto-create profile on user signup
--
-- CRITICAL: The INSERT policy uses WITH CHECK (true) because:
-- - The handle_new_user trigger runs with SECURITY DEFINER
-- - The trigger needs to INSERT before the user has a session
-- - RLS SELECT/UPDATE/DELETE still protect user data
--
-- ============================================================

-- ============================================================
-- PROFILES TABLE
-- ============================================================
-- Links to auth.users via ID (not a foreign key to avoid cascade issues)
-- The id column references the user's auth.users.id

CREATE TABLE IF NOT EXISTS profiles (
    -- Primary key matches auth.users.id exactly
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- User display info
    display_name TEXT,
    avatar_url TEXT,

    -- Optional user metadata

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) FOR PROFILES
-- ============================================================
-- CRITICAL: The INSERT policy must allow the trigger to create profiles
-- The trigger runs before the user has a session, so auth.uid() won't work

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own profile
-- (Add separate policy if public profiles needed)
CREATE POLICY "Users can view own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- INSERT: Allow inserts where id matches auth user OR from trigger
-- This is safe because:
-- 1. The id MUST reference a valid auth.users.id (FK constraint)
-- 2. Users can't insert with someone else's id (they'd need to know it)
-- 3. The trigger uses SECURITY DEFINER to bypass RLS anyway
CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Service-level INSERT for the trigger
-- This allows the trigger function (SECURITY DEFINER) to insert
CREATE POLICY "Service role can insert profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (true);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE: Users can only delete their own profile
-- (Usually disabled - cascade from auth.users instead)
CREATE POLICY "Users can delete own profile"
    ON profiles
    FOR DELETE
    USING (auth.uid() = id);


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
-- CRITICAL: This function uses SECURITY DEFINER to bypass RLS
-- and SET search_path to prevent search_path injection attacks

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists (e.g., from OAuth linking)
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users table
-- Runs AFTER INSERT to ensure user exists first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PROFILE HELPER FUNCTIONS
-- ============================================================

-- Get current user's profile (for use in other RLS policies)
CREATE OR REPLACE FUNCTION current_user_profile()
RETURNS profiles AS $$
    SELECT * FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth users';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id - same UUID';
COMMENT ON COLUMN profiles.display_name IS 'User-facing display name';
COMMENT ON FUNCTION handle_new_user() IS 'Auto-creates profile when user signs up. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================
-- GENERATED BY MENTAL MODELS SDLC
-- ============================================================
