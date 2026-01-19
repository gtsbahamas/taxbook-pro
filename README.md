# taxbook-pro

A modern web application built with Next.js, Supabase, TypeScript, and Tailwind CSS.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 14](https://nextjs.org/) | React framework with App Router, server components, and API routes |
| [Supabase](https://supabase.com/) | Backend-as-a-Service: PostgreSQL database, authentication, storage, and realtime |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript with strict mode enabled |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible, customizable React components |
| [Zod](https://zod.dev/) | Runtime type validation for forms and API requests |
| [React Query](https://tanstack.com/query) | Server state management with caching and synchronization |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (create one at [supabase.com](https://supabase.com))
- Supabase CLI (optional, for local development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd taxbook-pro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:

   ```bash
   cp .env.local.example .env.local
   ```

4. **Fill in your Supabase credentials**

   Open `.env.local` and add your Supabase project details:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   Find these values in your Supabase dashboard under **Settings > API**.

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |
| `npm run test` | Run test suite |
| `npm run test:db` | Run database integration tests |
| `npm run typecheck` | Run TypeScript type checking |

---

## Project Structure

```
taxbook-pro/
├── src/
│   ├── app/                    # Next.js App Router pages and layouts
│   │   ├── (auth)/             # Authentication pages (login, signup)
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── api/                # API route handlers
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── forms/              # Form components with validation
│   │   ├── layouts/            # Layout components (dashboard, etc.)
│   │   └── ...                 # Feature-specific components
│   ├── lib/
│   │   ├── supabase/           # Supabase client configuration
│   │   ├── repositories/       # Database access layer
│   │   ├── validation.ts       # Zod validation schemas
│   │   └── utils.ts            # Utility functions
│   └── types/
│       ├── domain.ts           # Domain entity types
│       ├── errors.ts           # Result types and error handling
│       ├── api.ts              # API request/response types
│       └── database.ts         # Supabase generated types
├── supabase/
│   └── migrations/             # Database migration files
├── tests/
│   ├── e2e/                    # Playwright E2E tests
│   └── db-integration.test.ts  # Database integration tests
├── docs/
│   ├── ARCHITECTURE.md         # C4 architecture diagrams
│   └── MIGRATIONS.md           # Database migration guide
├── public/                     # Static assets
└── scripts/                    # Build and utility scripts
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | No | Application URL (defaults to localhost) |

---

## Database

taxbook-pro uses Supabase (PostgreSQL) with Row Level Security (RLS) for data isolation.

### Core Entities

- **Profile**: Tax professional profile extending auth.users
- **Client**: Tax clients belonging to a practitioner
- **Service**: Service offerings by a tax professional
- **Appointment**: Scheduled appointments between practitioners and clients
- **Availability**: Practitioner working hours
- **Document**: Client tax documents

### Migrations

Database schema is managed through migrations in `supabase/migrations/`. See [docs/MIGRATIONS.md](docs/MIGRATIONS.md) for the complete migration workflow.

```bash
# Apply migrations locally
supabase db push

# Generate TypeScript types after schema changes
supabase gen types typescript --local > src/types/database.ts
```

---

## Documentation

- [Architecture Diagrams](docs/ARCHITECTURE.md) - C4 model system diagrams
- [Migration Guide](docs/MIGRATIONS.md) - Database schema management
- [CLAUDE_INSTRUCTIONS.md](CLAUDE_INSTRUCTIONS.md) - Build instructions for Claude Code

---

## Development Guidelines

### Type-First Development

All code follows type-first principles:

1. Define types before implementation
2. Use `Result<T, E>` for fallible operations (no thrown exceptions)
3. Validate inputs at boundaries with Zod
4. Ensure invalid states cannot be represented

### Error Handling

```typescript
// All fallible functions return Result types
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Usage
const result = await createUser(input);
if (!result.ok) {
  // Handle specific error
  return handleError(result.error);
}
// Use result.value safely
```

### Code Quality

- TypeScript strict mode enabled
- ESLint with recommended rules
- Prettier for consistent formatting
- Pre-commit hooks for quality gates

---

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com).

1. Push to your Git repository
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

For other platforms, ensure the environment supports Next.js 14 with App Router.

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code guidelines
3. Run tests: `npm test && npm run typecheck`
4. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Generated by [Mental Models SDLC](https://github.com/mental-models-sdlc) - Type-First, Build-Verified*
