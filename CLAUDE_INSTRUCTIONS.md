# Claude Code Build Instructions - taxbook-pro

Generated: 2026-01-19

## CRITICAL: Read This First

This document tells Claude Code EXACTLY how to build taxbook-pro.
Follow these steps IN ORDER. Do not skip ahead. Do not improvise.

**Build Philosophy:**
- Types BEFORE implementation
- Build after every 2-3 files
- Fix errors immediately, not later
- No `// TODO` in error paths
- No placeholder UI - every button must do something

---

## Pre-Build Checklist

Before writing ANY code, verify:

- [ ] Supabase project exists and is accessible
- [ ] Environment variables are set (`.env.local`)
- [ ] `npm install` completes without errors
- [ ] `npx tsc --noEmit` passes (empty project should compile)

---

## Phase 1: Foundation Types (BUILD FIRST)

### Step 1.1: Create Type Files

Create these files in order. After EACH file, run `npx tsc --noEmit`.

```
src/
├── types/
│   ├── index.ts         # Re-exports all types
│   ├── domain.ts        # Entity types (from scaffolding)
│   ├── errors.ts        # Result<T,E> and error types (from scaffolding)
│   └── api.ts           # API request/response contracts (from scaffolding)
```

**Verification:** `npx tsc --noEmit` must pass before proceeding.

### Step 1.2: Entity Types

Generate from these requirements:



**Required patterns:**
```typescript
// Branded IDs - ALWAYS use these, never raw strings
type UserId = Brand<string, "UserId">;
type ProfileId = Brand<string, "ProfileId">;

// Result type - ALWAYS return this from fallible operations
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Entity with audit fields - ALWAYS include these
interface Entity {
  readonly id: EntityId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

**Verification:** After domain.ts and errors.ts exist:
```bash
npx tsc --noEmit
# Must output: no errors
```

---

## Phase 2: Database Schema

### Step 2.1: Create Migration

Create `supabase/migrations/001_initial_schema.sql` using the db-schema.sql template.



### Step 2.2: Apply Migration

```bash
supabase db push
# OR for linked project:
supabase db push --linked
```

**Verification:**
```bash
supabase db diff
# Must output: no changes (schema matches migration)
```

### Step 2.3: RLS Policy Verification

**CRITICAL**: After applying migrations, test RLS policies for infinite recursion:

```sql
-- Test: This should NOT hang or error
SELECT * FROM team_members LIMIT 1;
```

If you get "infinite recursion" errors, the RLS policies are self-referencing.

**RLS Anti-Patterns to AVOID:**

```sql
-- ❌ BAD: Policy on team_members that queries team_members
CREATE POLICY "view" ON team_members FOR SELECT
USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid()));
-- This causes INFINITE RECURSION!

-- ✅ GOOD: Use SECURITY DEFINER function
CREATE FUNCTION is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM team_members WHERE ...);
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE POLICY "view" ON team_members FOR SELECT
USING (is_team_member(team_id, auth.uid()));
```

**Required RLS helper functions** (should exist in migration):
- `is_team_member(team_id, user_id)` - bypasses RLS
- `is_team_owner(team_id, user_id)` - bypasses RLS
- `has_resource_access(user_id, owner_id, team_id)` - composite check

### Step 2.4: Generate Supabase Types

```bash
supabase gen types typescript --local > src/types/database.ts
# OR for linked:
supabase gen types typescript --project-id= > src/types/database.ts
```

**Verification:** Types in database.ts must align with domain.ts entities.

---

## Phase 3: Core Library Layer

### Step 3.1: Database Client

Create `src/lib/db/client.ts`:
- Initialize Supabase client
- Export typed client with Database types

### Step 3.2: Repository Layer

For EACH entity, create `src/lib/db/.ts`:

```typescript
// Pattern to follow:
export const create = async (
  input: CreateInput
): Promise<Result<, Error>> => {
  // Real implementation, no mocks
};
```

**After each repository file:**
```bash
npx tsc --noEmit
npm run build  # if exists
```

### Step 3.3: Validation Layer

Create `src/lib/validation/.ts` for each entity:
- Input validation using Zod
- Return `ValidationResult<T>` (from errors.ts)
- Validate BEFORE database operations

---

## Phase 4: API Routes

### Step 4.1: Route Structure

```
src/app/api/
├── profile/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PATCH (update), DELETE
├── client/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PATCH (update), DELETE
├── service/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PATCH (update), DELETE
├── appointment/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PATCH (update), DELETE
├── availability/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PATCH (update), DELETE
├── document/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (single), PATCH (update), DELETE
```

### Step 4.2: Route Implementation Pattern

Every route handler must:
1. Parse and validate request body
2. Check authentication (auth.uid())
3. Call repository function
4. Return typed ApiResponse

```typescript
// Pattern:
export async function POST(req: Request) {
  const body = await req.json();

  // 1. Validate
  const validation = validateInput(body);
  if (!validation.ok) {
    return Response.json(apiError(badRequest("Validation failed", validation.error)), { status: 400 });
  }

  // 2. Auth
  const user = await getUser();
  if (!user) {
    return Response.json(apiError(unauthorized()), { status: 401 });
  }

  // 3. Execute
  const result = await create(validation.value);
  if (!result.ok) {
    return Response.json(apiError(/* map error */), { status: /* appropriate */ });
  }

  // 4. Respond
  return Response.json(apiSuccess(result.value), { status: 201 });
}
```

**Verification after each route:**
```bash
npx tsc --noEmit
curl -X POST http://localhost:3000/api/profile -H "Content-Type: application/json" -d '{}'
# Should return validation error, not 500
```

---

## Phase 5: UI Components

### Step 5.1: Component Types First

Before creating any component, define its props in `src/types/components.ts`:

```typescript
interface CardProps {
  readonly : ;
  readonly onEdit?: (id: Id) => void;
  readonly onDelete?: (id: Id) => void;
}
```

### Step 5.2: Component Implementation

Create components in order:
1. Layout components (shell, navigation)
2. Display components (cards, lists)
3. Form components (inputs, validation)
4. Page components (compose others)

**After every 2-3 components:**
```bash
npm run build
# Must complete without errors
```

---

## Error Handling Rules

### DO:
- Return `Result<T, E>` from all fallible functions
- Define specific error types (not generic Error)
- Handle all error cases in UI
- Log errors with context (but redact sensitive data)

### DO NOT:
- `throw new Error()` - use Result instead
- `catch (e) { console.error(e) }` - handle explicitly
- `// TODO: handle error` - handle now or don't ship
- `any` type - ever

---

## Build Verification Checkpoints

After completing each phase, verify:

### After Phase 1 (Types):
```bash
npx tsc --noEmit
# Zero errors
```

### After Phase 2 (Database):
```bash
supabase db diff
# No changes (schema applied)
```

### After Phase 3 (Library):
```bash
npm run build
npm test  # if tests exist
```

### After Phase 4 (API):
```bash
npm run build
# Test each endpoint manually or with integration tests
```

### After Phase 5 (UI):
```bash
npm run build
npm run dev
# Visually verify in browser
```

---

## Phase 6: UI Completeness Verification

**CRITICAL**: This phase catches bugs that compile but fail at runtime.

### Step 6.1: Button Audit

Every `<Button>` must have one of:
- `onClick` handler that does something
- Be inside a `<form>` with `onSubmit`
- Be wrapped in a `<Link>` with valid `href`

**Verification:**
```bash
# Search for potentially orphan buttons
grep -r "<Button" src/components src/app | grep -v "onClick\|href\|type=\"submit\""
# Each result must be justified or fixed
```

### Step 6.2: File Upload Pattern

If UI shows an upload area, it MUST have:
1. Hidden `<input type="file">` with ref
2. Button `onClick` that triggers `inputRef.current?.click()`
3. `onChange` handler that processes the file
4. Supabase Storage bucket with proper RLS policies

**Correct pattern:**
```tsx
const fileInputRef = useRef<HTMLInputElement>(null);

<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleFileChange}
  className="hidden"
/>
<Button onClick={() => fileInputRef.current?.click()}>
  Choose File
</Button>
```

### Step 6.3: Interactive Element Checklist

Before marking Phase 5 complete, verify EACH:

| Element | Required |
|---------|----------|
| Every `<Button>` | Has onClick OR is in form OR wrapped in Link |
| Every `<DropdownMenuItem>` | Has onClick or onSelect |
| Every file upload UI | Has connected file input |
| Every form | Has onSubmit handler |
| Every delete button | Has confirmation dialog |

### Step 6.4: Manual Click Testing

Open the app and click EVERY interactive element:
- [ ] All buttons trigger expected behavior
- [ ] All forms submit correctly
- [ ] All file uploads open file picker
- [ ] All dropdowns trigger actions
- [ ] No "nothing happens" on click

**If anything does nothing when clicked, it's a bug. Fix before shipping.**

---

## When Something Breaks

1. **Type error?** Fix the type, not the implementation
2. **Build fails?** Fix before adding more code
3. **Runtime error?** Add to error union, handle explicitly
4. **Test fails?** Fix the code, not the test (usually)

---

## Files Generated by This Scaffolding

- `src/types/domain.ts` - from types-domain.ts.hbs
- `src/types/errors.ts` - from types-errors.ts.hbs
- `src/types/api.ts` - from types-api.ts.hbs
- `supabase/migrations/001_initial_schema.sql` - from db-schema.sql.hbs
- `CLAUDE_INSTRUCTIONS.md` - this file

---

## Project-Specific Notes




---

*Generated by Mental Models SDLC - Type-First, Build-Verified*
