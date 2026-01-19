# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests | `npm test` |
| Single test | `npm test -- --run path/to/test.ts` |
| DB integration tests | `npm run test:db` |
| E2E tests | `npm run test:e2e` |
| Smoke tests | `npm run test:smoke` |
| Load tests | `npm run test:load` |
| Storybook | `npm run storybook` |
| Generate DB types | `supabase gen types typescript --local > src/types/database.ts` |
| Apply migrations | `supabase db push` |

**Pre-commit:** Run `npm run build && npm test`

## Architecture Overview

### Tech Stack
- **Next.js 15** with App Router, React 19, server components
- **Supabase** for auth, PostgreSQL (with RLS), storage, realtime
- **TypeScript** strict mode with path alias `@/*` → `./src/*`
- **shadcn/ui** components in `src/components/ui/`
- **React Query** for server state, **Zod** for validation

### Core Pattern: Result Types (No Exceptions)

All fallible operations return `Result<T, E>` instead of throwing:

```typescript
import { ok, err, Result } from "@/types/errors";

// Returning results
const result = await createClient(input);
if (!result.ok) {
  return Response.json(apiError(result.error), { status: 400 });
}
return Response.json(apiSuccess(result.value));
```

Key utilities: `ok()`, `err()`, `isOk()`, `isErr()`, `map()`, `andThen()`, `all()`

### Entity CRUD Structure

Six main entities: **Profile**, **Client**, **Service**, **Appointment**, **Availability**, **Document**

Each follows:
1. **Types** → `src/types/domain.ts` (branded IDs: `ProfileId`, `ClientId`, etc.)
2. **Validation** → `src/lib/validation.ts` (Zod schemas)
3. **Repository** → `src/lib/repositories/index.ts` (database access)
4. **API routes** → `src/app/api/[entity]/route.ts` (dynamic routing)

### API Routes (Dynamic)

Routes use dynamic `[entity]` segments:
- `src/app/api/[entity]/route.ts` → GET (list), POST (create)
- `src/app/api/[entity]/[id]/route.ts` → GET, PATCH, DELETE
- `src/app/api/[entity]/[id]/transition/route.ts` → State machine transitions

### State Machines

Two entities have state machines defined in `src/lib/state-machines.ts`:

**Appointment:** `draft` → `confirmed` → `in_progress` → `completed` / `cancelled` / `no_show`

**Document:** `requested` → `uploaded` → `reviewed` → `accepted` / `rejected`

Use `src/lib/state-machine-runtime.ts` for transitions.

### Authentication

- Server: `import { createClient } from "@/lib/supabase/server"`
- Client: `import { createClient } from "@/lib/supabase/client"`
- All protected routes check `supabase.auth.getUser()` first
- RLS policies enforce data isolation at database level

### Page Structure

- `src/app/(auth)/` → Login, signup, password reset (unprotected)
- `src/app/(dashboard)/` → Protected pages with `src/components/layouts/dashboard.tsx`
- `src/app/(dashboard)/[entity]/` → Dynamic entity list/create pages

## Code Patterns

### Validation Before Database

```typescript
const validation = createClientSchema.safeParse(body);
if (!validation.success) {
  return Response.json(
    apiError(badRequest("Validation failed", validation.error.flatten())),
    { status: 400 }
  );
}
// Safe to use validation.data
```

### Error Type Mapping

Use constructors from `src/types/errors.ts`:
- `badRequest(message, details?)` → 400
- `unauthorized(message?)` → 401
- `forbidden(message, resource?)` → 403
- `notFound(resource, id?)` → 404
- `conflict(message, field?)` → 409
- `rateLimited(retryAfter)` → 429
- `internalError(message, requestId?)` → 500

### File Uploads

Use Supabase Storage with `src/components/files/index.tsx`. Pattern:
1. Hidden `<input type="file">` with ref
2. Button triggers `inputRef.current?.click()`
3. `onChange` handler uploads to Supabase Storage

### Rate Limiting

Implemented via Upstash Redis in `src/lib/rate-limit.ts`

## Database

### Migrations

Located in `supabase/migrations/`. After schema changes:
```bash
supabase db push                    # Apply migrations
supabase gen types typescript --local > src/types/database.ts  # Regenerate types
```

### RLS Policy Pattern

Avoid infinite recursion by using `SECURITY DEFINER` functions:
```sql
CREATE FUNCTION is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM team_members WHERE ...);
$$ LANGUAGE SQL SECURITY DEFINER;
```

### Sensitive Fields

`Client.tax_id_last4` contains PII. Use `redactSensitiveData()` before logging.

## Testing

- **Unit tests (Vitest):** `tests/` directory
- **E2E tests (Playwright):** `tests/e2e/` directory
- **DB integration:** `npm run test:db`
- **Load tests (k6):** `tests/load/`
