# AGENTS.md

> Project context for AI coding agents (GitHub Copilot, Claude Code, Cursor, Windsurf, etc.)
> This file follows the [AGENTS.md](https://agents.md) open standard.

## Project

- **Name:** taxbook-pro
- **Stack:** Next.js 15, TypeScript, Supabase, Tailwind CSS, shadcn/ui
- **Entities:** 6 (Profile, Client, Service, Appointment, Availability, Document)
- **State Machines:** Yes (2 entities)
- **File Uploads:** Supabase Storage

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Development server | `npm run dev` |
| Production build | `npm run build` |
| Type check | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Unit tests | `npm test` |
| E2E tests | `npm run test:e2e` |

**Before committing:** Always run `npm run build` and `npm test`.

## Directory Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   └── profile/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/route.ts   # GET, PATCH, DELETE by ID
│   │   └── client/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/route.ts   # GET, PATCH, DELETE by ID
│   │   └── service/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/route.ts   # GET, PATCH, DELETE by ID
│   │   └── appointment/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/route.ts   # GET, PATCH, DELETE by ID
│   │   └── availability/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/route.ts   # GET, PATCH, DELETE by ID
│   │   └── document/
│   │       ├── route.ts        # GET (list), POST (create)
│   │       └── [id]/route.ts   # GET, PATCH, DELETE by ID
│   ├── (auth)/                 # Auth pages (login, register)
│   └── (dashboard)/            # Protected app pages
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   └── profile/     # Profile components
│   └── client/     # Client components
│   └── service/     # Service components
│   └── appointment/     # Appointment components
│   └── availability/     # Availability components
│   └── document/     # Document components
├── lib/
│   ├── supabase/               # Supabase client setup
│   ├── repositories/           # Database access layer
│   │   └── profile.ts
│   │   └── client.ts
│   │   └── service.ts
│   │   └── appointment.ts
│   │   └── availability.ts
│   │   └── document.ts
│   └── validation/             # Zod schemas
│       └── profile.ts
│       └── client.ts
│       └── service.ts
│       └── appointment.ts
│       └── availability.ts
│       └── document.ts
└── types/
    ├── domain.ts               # Entity types with branded IDs
    ├── errors.ts               # Result<T, E> and error types
    ├── api.ts                  # API request/response types
    └── database.ts             # Supabase generated types
```

## Code Patterns

### Entity CRUD Pattern

Every entity follows this structure:

1. **Types** in `src/types/domain.ts`:
   ```typescript
   type EntityId = Brand<string, "EntityId">;
   interface Entity { id: EntityId; createdAt: Date; updatedAt: Date; /* fields */ }
   ```

2. **Validation** in `src/lib/validation/[entity].ts`:
   ```typescript
   export const createEntitySchema = z.object({ /* fields */ });
   ```

3. **Repository** in `src/lib/repositories/[entity].ts`:
   ```typescript
   export async function createEntity(input): Promise<Result<Entity, EntityError>>
   ```

4. **API Route** in `src/app/api/[entity]/route.ts`:
   - Validate input with Zod
   - Check authentication
   - Call repository
   - Return typed response

### Error Handling

**Always use Result types, never throw:**

```typescript
// Correct
const result = await createUser(input);
if (!result.ok) {
  return Response.json(apiError(result.error), { status: 400 });
}
return Response.json(apiSuccess(result.value));

// Incorrect - don't do this
try {
  const user = await createUser(input);
} catch (e) {
  // ...
}
```

### Validation Pattern

**Always validate before database operations:**

```typescript
const validation = createUserSchema.safeParse(body);
if (!validation.success) {
  return Response.json(
    apiError(badRequest("Validation failed", validation.error.flatten())),
    { status: 400 }
  );
}
// Now safe to use validation.data
```

## State Machines

### Appointment

**States:** `draft` → `confirmed` → `in_progress` → `completed` → `cancelled` → `no_show`

**Transitions:**
- From `draft`:
  - `confirm` → `confirmed`
  - `cancel_draft` → `cancelled`
- From `confirmed`:
  - `start` → `in_progress`
  - `cancel` → `cancelled`
  - `mark_no_show` → `no_show`
- From `in_progress`:
  - `complete` → `completed`

### Document

**States:** `requested` → `uploaded` → `reviewed` → `accepted` → `rejected`

**Transitions:**
- From `requested`:
  - `upload` → `uploaded`
- From `uploaded`:
  - `review` → `reviewed`
- From `reviewed`:
  - `accept` → `accepted`
  - `reject` → `rejected`
- From `rejected`:
  - `reupload` → `uploaded`

## Security Requirements

### Row Level Security (RLS)

All database tables have RLS policies. When adding new tables:

1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Add policies for SELECT, INSERT, UPDATE, DELETE
3. Use `auth.uid()` to get current user
4. Test policies don't cause infinite recursion

### Authentication

- All API routes (except public) require authentication
- Use `createClient()` from `@/lib/supabase/server`
- Check `supabase.auth.getUser()` before operations

### Sensitive Fields

These fields contain PII and must be handled carefully:
- `Client.tax_id_last4`

- Never log sensitive fields
- Encrypt at rest (Supabase handles this)
- Validate access in RLS policies

## Testing

### Unit Tests (Vitest)

Location: `tests/` directory

```bash
npm test              # Watch mode
npm test -- --run     # Single run
npm test -- --coverage
```

### E2E Tests (Playwright)

Location: `tests/e2e/` directory

```bash
npm run test:e2e      # Run all E2E tests
npm run test:e2e:ui   # Interactive mode
```

### Test Before Commit

```bash
npm run build && npm test
```

## Environment Variables

Required in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |

## Deployment

**Platform:** Vercel (recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy triggers automatically on push to main

**Database migrations:**
```bash
supabase db push --linked
```

## Additional Resources

- `CLAUDE_INSTRUCTIONS.md` - Detailed build instructions for Claude Code
- `docs/ARCHITECTURE.md` - System architecture diagrams
- `docs/MIGRATIONS.md` - Database migration guide
- `docs/DEFENSIVE_PATTERNS.md` - Error handling patterns

---

*Generated by [Mental Models SDLC](https://github.com/tywells/mental-model-sdlc)*
