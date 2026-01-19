# Architecture Diagrams - taxbook-pro

Generated: 2026-01-19

---

## Overview

This document provides C4 model architecture diagrams for taxbook-pro using Mermaid syntax. The C4 model visualizes software architecture at four levels of abstraction: Context, Container, Component, and Code.

**Rendering:** These diagrams use Mermaid syntax. View them in:
- GitHub/GitLab (native support)
- VS Code with Mermaid extension
- [Mermaid Live Editor](https://mermaid.live)

---

## Level 1: System Context

The System Context diagram shows taxbook-pro and its relationships with users and external systems.

```mermaid
C4Context
    title System Context Diagram - taxbook-pro

    Person(user, "User", "Primary application user who interacts with the system")
    Person(admin, "Administrator", "Manages system configuration and user access")

    System(app, "taxbook-pro", "Web application providing core business functionality")

    System_Ext(auth, "Supabase Auth", "Authentication and user management service")
    System_Ext(db, "Supabase Database", "PostgreSQL database with Row Level Security")
    System_Ext(storage, "Supabase Storage", "File and media storage service")
    System_Ext(email, "Email Service", "Transactional email delivery (Resend/SendGrid)")
    System_Ext(analytics, "Analytics", "User behavior tracking (PostHog/Mixpanel)")

    Rel(user, app, "Uses", "HTTPS")
    Rel(admin, app, "Administers", "HTTPS")
    Rel(app, auth, "Authenticates via", "HTTPS/JWT")
    Rel(app, db, "Reads/Writes data", "PostgreSQL/REST")
    Rel(app, storage, "Stores files", "HTTPS")
    Rel(app, email, "Sends emails via", "HTTPS/API")
    Rel(app, analytics, "Tracks events", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Context Narrative

taxbook-pro is a web application that serves users and administrators. The system leverages Supabase for:

- **Authentication**: Secure user sign-up, login, and session management
- **Database**: PostgreSQL with Row Level Security for data isolation
- **Storage**: Secure file uploads with access control


---

## Level 2: Container Diagram

The Container diagram shows the high-level technical building blocks of taxbook-pro.

```mermaid
C4Container
    title Container Diagram - taxbook-pro

    Person(user, "User", "Application user")

    Container_Boundary(app, "taxbook-pro") {
        Container(web, "Web Application", "Next.js 14", "React-based SPA with App Router, server components, and API routes")
        Container(api, "API Routes", "Next.js API", "RESTful endpoints for profile, client, service, appointment, availability, document")
        Container(middleware, "Middleware", "Next.js", "Auth protection, rate limiting, security headers")
    }

    Container_Boundary(supabase, "Supabase Platform") {
        ContainerDb(db, "PostgreSQL", "Supabase DB", "Stores profile, client, service, appointment, availability, document with RLS policies")
        Container(auth, "Auth Service", "Supabase Auth", "JWT-based authentication, OAuth providers")
        Container(storage, "Storage", "Supabase Storage", "File uploads with bucket policies")
        Container(realtime, "Realtime", "Supabase Realtime", "WebSocket subscriptions for live updates")
    }

    Container_Boundary(external, "External Services") {
        Container(email, "Email", "Resend", "Transactional emails")
        Container(analytics, "Analytics", "PostHog", "Event tracking")
    }

    Rel(user, web, "Uses", "HTTPS")
    Rel(web, api, "Calls", "HTTP")
    Rel(web, middleware, "Protected by", "")
    Rel(api, db, "Queries", "SQL/REST")
    Rel(api, auth, "Validates tokens", "JWT")
    Rel(api, storage, "Manages files", "REST")
    Rel(web, realtime, "Subscribes", "WebSocket")
    Rel(api, email, "Sends", "API")
    Rel(web, analytics, "Tracks", "JS SDK")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

### Container Responsibilities

| Container | Technology | Responsibility |
|-----------|------------|----------------|
| Web Application | Next.js 14 + React | UI rendering, client-side state, server components |
| API Routes | Next.js API Routes | Business logic, validation, data access |
| Middleware | Next.js Middleware | Auth guards, rate limiting, headers |
| PostgreSQL | Supabase | Data persistence with RLS |
| Auth Service | Supabase Auth | User identity, sessions, OAuth |
| Storage | Supabase Storage | File management with policies |

---

## Level 3: Component Diagram

The Component diagram shows the internal structure of key containers.

### Web Application Components

```mermaid
C4Component
    title Component Diagram - Web Application

    Container_Boundary(web, "Web Application") {
        Component(pages, "Page Components", "React/Next.js", "Route handlers: /profile, /client, /service, /appointment, /availability, /document, /settings, /admin")
        Component(layouts, "Layout Components", "React", "Dashboard layout, auth layout, root layout")
        Component(ui, "UI Components", "shadcn/ui", "Button, Card, Dialog, Table, Form components")
        Component(forms, "Form Components", "React Hook Form + Zod", "Entity CRUD forms with validation")
        Component(hooks, "Custom Hooks", "React", "useAuth, useApi, useToast, useDebounce")
        Component(stores, "State Management", "React Context/Zustand", "Auth state, UI state, cache")
    }

    Container_Boundary(lib, "Library Layer") {
        Component(apiClient, "API Client", "TypeScript", "Type-safe fetch wrappers with React Query")
        Component(validation, "Validation", "Zod", "Input schemas for Profile, Client, Service, Appointment, Availability, Document")
        Component(auth, "Auth Utils", "TypeScript", "Session management, guards")
        Component(i18n, "Internationalization", "TypeScript", "Translation helpers, locale detection")
    }

    Rel(pages, layouts, "Uses")
    Rel(pages, ui, "Renders")
    Rel(pages, forms, "Includes")
    Rel(pages, hooks, "Calls")
    Rel(hooks, stores, "Reads/Writes")
    Rel(hooks, apiClient, "Fetches via")
    Rel(forms, validation, "Validates with")
    Rel(hooks, auth, "Checks auth via")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

### API Layer Components

```mermaid
C4Component
    title Component Diagram - API Layer

    Container_Boundary(api, "API Routes") {
        Component(apiProfile, "Profile API", "Next.js Route", "GET/POST /api/profile, GET/PATCH/DELETE /api/profile/[id]")
        Component(apiClient, "Client API", "Next.js Route", "GET/POST /api/client, GET/PATCH/DELETE /api/client/[id]")
        Component(apiService, "Service API", "Next.js Route", "GET/POST /api/service, GET/PATCH/DELETE /api/service/[id]")
        Component(apiAppointment, "Appointment API", "Next.js Route", "GET/POST /api/appointment, GET/PATCH/DELETE /api/appointment/[id]")
        Component(apiAvailability, "Availability API", "Next.js Route", "GET/POST /api/availability, GET/PATCH/DELETE /api/availability/[id]")
        Component(apiDocument, "Document API", "Next.js Route", "GET/POST /api/document, GET/PATCH/DELETE /api/document/[id]")
        Component(apiWebhooks, "Webhooks API", "Next.js Route", "POST /api/webhooks - HMAC verified")
        Component(apiAuth, "Auth Callbacks", "Next.js Route", "OAuth callbacks, magic links")
    }

    Container_Boundary(lib, "Library Layer") {
        Component(repos, "Repositories", "TypeScript", "Database access: profileRepo, clientRepo, serviceRepo, appointmentRepo, availabilityRepo, documentRepo")
        Component(validation, "Validation", "Zod", "Request body validation")
        Component(errors, "Error Handling", "TypeScript", "Result types, error mappers")
        Component(jobs, "Background Jobs", "TypeScript", "Async task queue")
    }

    Container_Boundary(infra, "Infrastructure") {
        Component(supabase, "Supabase Client", "TypeScript", "Server-side client with service role")
        Component(rateLimit, "Rate Limiter", "Upstash Redis", "Sliding window algorithm")
        Component(analytics, "Analytics", "TypeScript", "Event tracking abstraction")
    }

    Rel(apiProfile, repos, "Uses")
    Rel(apiProfile, validation, "Validates")
    Rel(apiClient, repos, "Uses")
    Rel(apiClient, validation, "Validates")
    Rel(apiService, repos, "Uses")
    Rel(apiService, validation, "Validates")
    Rel(apiAppointment, repos, "Uses")
    Rel(apiAppointment, validation, "Validates")
    Rel(apiAvailability, repos, "Uses")
    Rel(apiAvailability, validation, "Validates")
    Rel(apiDocument, repos, "Uses")
    Rel(apiDocument, validation, "Validates")
    Rel(repos, supabase, "Queries via")
    Rel(repos, errors, "Returns")
    Rel(apiWebhooks, jobs, "Enqueues")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Component Inventory

| Layer | Component | Purpose |
|-------|-----------|---------|
| API | Profile Routes | CRUD operations for Profile |
| API | Client Routes | CRUD operations for Client |
| API | Service Routes | CRUD operations for Service |
| API | Appointment Routes | CRUD operations for Appointment |
| API | Availability Routes | CRUD operations for Availability |
| API | Document Routes | CRUD operations for Document |
| API | Webhooks | External event ingestion |
| Library | Repositories | Data access abstraction |
| Library | Validation | Input sanitization |
| Library | Error Handling | Consistent error responses |
| UI | Page Components | Route-based views |
| UI | Form Components | Data entry with validation |
| UI | UI Components | Reusable design system |

---

## Level 4: Code (Entity Relationships)

The Code level diagram shows the data model and entity relationships.

### Entity Relationship Diagram

```mermaid
erDiagram
    PROFILE {
        uuid id PK "Primary key"
        uuid id "NOT NULL"
        uuid user_id "NOT NULL"
        text email "NOT NULL"
        text name "NOT NULL"
        text firm_name
        text license_number
        text timezone "NOT NULL"
        text subscription_tier "NOT NULL"
        text booking_slug
        text tax_season_start
        text tax_season_end
        int max_daily_appointments "NOT NULL"
        int max_daily_appointments_tax_season "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }
    CLIENT {
        uuid id PK "Primary key"
        uuid id "NOT NULL"
        uuid user_id "NOT NULL"
        text name "NOT NULL"
        text email "NOT NULL"
        text phone
        text tax_id_last4
        text filing_status
        text preferred_contact "NOT NULL"
        text notes
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }
    SERVICE {
        uuid id PK "Primary key"
        uuid id "NOT NULL"
        uuid user_id "NOT NULL"
        text name "NOT NULL"
        text description
        int duration_minutes "NOT NULL"
        text price
        boolean tax_season_only "NOT NULL"
        boolean requires_documents "NOT NULL"
        boolean is_active "NOT NULL"
        int buffer_minutes "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }
    APPOINTMENT {
        uuid id PK "Primary key"
        uuid id "NOT NULL"
        uuid user_id "NOT NULL"
        uuid client_id "NOT NULL"
        uuid service_id "NOT NULL"
        timestamp starts_at "NOT NULL"
        timestamp ends_at "NOT NULL"
        text status "NOT NULL"
        text notes
        text meeting_link
        boolean reminder_sent_24h "NOT NULL"
        boolean reminder_sent_1h "NOT NULL"
        text cancellation_reason
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }
    AVAILABILITY {
        uuid id PK "Primary key"
        uuid id "NOT NULL"
        uuid user_id "NOT NULL"
        int day_of_week "NOT NULL"
        text start_time "NOT NULL"
        text end_time "NOT NULL"
        boolean is_tax_season "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }
    DOCUMENT {
        uuid id PK "Primary key"
        uuid id "NOT NULL"
        uuid user_id "NOT NULL"
        uuid client_id "NOT NULL"
        uuid appointment_id
        text document_type "NOT NULL"
        text file_url
        text file_name
        text status "NOT NULL"
        int tax_year
        text notes
        text rejection_reason
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    PROFILE ||--o{ CLIENT : "has many"
    PROFILE ||--o{ SERVICE : "has many"
    PROFILE ||--o{ APPOINTMENT : "has many"
    CLIENT ||--o{ APPOINTMENT : "has many"
    SERVICE ||--o{ APPOINTMENT : "has many"
    PROFILE ||--o{ AVAILABILITY : "has many"
    PROFILE ||--o{ DOCUMENT : "has many"
    CLIENT ||--o{ DOCUMENT : "has many"
    APPOINTMENT ||--o{ DOCUMENT : "has many"
```

### Domain Type Definitions

```typescript
// Branded ID types (prevent ID type confusion)
type ProfileId = Brand<string, "ProfileId">;
type ClientId = Brand<string, "ClientId">;
type ServiceId = Brand<string, "ServiceId">;
type AppointmentId = Brand<string, "AppointmentId">;
type AvailabilityId = Brand<string, "AvailabilityId">;
type DocumentId = Brand<string, "DocumentId">;

// Entity interfaces
interface Profile {
  readonly id: ProfileId;
  readonly id: string;
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly firmName: string;
  readonly licenseNumber: string;
  readonly timezone: string;
  readonly subscriptionTier: string;
  readonly bookingSlug: string;
  readonly taxSeasonStart: Date;
  readonly taxSeasonEnd: Date;
  readonly maxDailyAppointments: number;
  readonly maxDailyAppointmentsTaxSeason: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface Client {
  readonly id: ClientId;
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly taxIdLast4: string;
  readonly filingStatus: string;
  readonly preferredContact: string;
  readonly notes: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface Service {
  readonly id: ServiceId;
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly price: number;
  readonly taxSeasonOnly: boolean;
  readonly requiresDocuments: boolean;
  readonly isActive: boolean;
  readonly bufferMinutes: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface Appointment {
  readonly id: AppointmentId;
  readonly id: string;
  readonly userId: string;
  readonly clientId: string;
  readonly serviceId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: string;
  readonly notes: string;
  readonly meetingLink: string;
  readonly reminderSent24h: boolean;
  readonly reminderSent1h: boolean;
  readonly cancellationReason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface Availability {
  readonly id: AvailabilityId;
  readonly id: string;
  readonly userId: string;
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly isTaxSeason: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface Document {
  readonly id: DocumentId;
  readonly id: string;
  readonly userId: string;
  readonly clientId: string;
  readonly appointmentId: string;
  readonly documentType: string;
  readonly fileUrl: string;
  readonly fileName: string;
  readonly status: string;
  readonly taxYear: number;
  readonly notes: string;
  readonly rejectionReason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

```

### Relationship Summary

| From | To | Type | Foreign Key | On Delete |
|------|----|----- |-------------|-----------|
| Client | Profile | many-to-one | user_id | CASCADE |
| Service | Profile | many-to-one | user_id | CASCADE |
| Appointment | Profile | many-to-one | user_id | CASCADE |
| Appointment | Client | many-to-one | client_id | CASCADE |
| Appointment | Service | many-to-one | service_id | CASCADE |
| Availability | Profile | many-to-one | user_id | CASCADE |
| Document | Profile | many-to-one | user_id | CASCADE |
| Document | Client | many-to-one | client_id | CASCADE |
| Document | Appointment | many-to-one | appointment_id | CASCADE |

---

## Data Flow Diagrams

### User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant M as Middleware
    participant A as Supabase Auth
    participant D as Database

    U->>W: Navigate to /login
    W->>U: Render login form
    U->>W: Submit credentials
    W->>A: signInWithPassword()
    A->>A: Validate credentials
    A->>D: Fetch user profile
    A-->>W: Return session + JWT
    W->>W: Store session
    W-->>U: Redirect to /dashboard

    Note over M: Subsequent requests
    U->>W: Request protected page
    W->>M: Check auth
    M->>A: Verify JWT
    A-->>M: Valid session
    M-->>W: Allow request
    W-->>U: Render page
```

### Entity CRUD Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant V as Validation
    participant A as API Route
    participant R as Repository
    participant D as Database

    U->>W: Submit form
    W->>V: Validate input (Zod)
    alt Validation fails
        V-->>W: Validation errors
        W-->>U: Display errors
    else Validation passes
        V-->>W: Valid data
        W->>A: POST /api/profile
        A->>A: Check auth
        A->>R: createProfile(input)
        R->>D: INSERT with RLS
        D-->>R: New record
        R-->>A: Result<Entity, Error>
        A-->>W: 201 Created + data
        W-->>U: Success toast + redirect
    end
```

---

## Key Architectural Decisions

### 1. Authentication Strategy

**Decision:** Supabase Auth with JWT tokens

**Rationale:**
- Built-in RLS integration for data isolation
- OAuth provider support (Google, GitHub, etc.)
- Session management handled by platform
- Secure token refresh mechanism

### 2. Data Access Pattern

**Decision:** Repository pattern with Result types

**Rationale:**
- Explicit error handling (no thrown exceptions)
- Type-safe database operations
- Testable data layer
- RLS policies at database level

### 3. API Design

**Decision:** RESTful routes with typed contracts

**Rationale:**
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Consistent response format (`{ success, data, error }`)
- OpenAPI documentation
- Type generation from database schema

### 4. State Management

**Decision:** Server components + React Query for client state

**Rationale:**
- Minimize client-side JavaScript
- Automatic cache invalidation
- Optimistic updates where appropriate
- SSR-first approach


---

## Integration Points

### External Service Integration

| Service | Purpose | Integration Method | Error Handling |
|---------|---------|-------------------|----------------|
| Supabase Auth | User authentication | SDK + JWT | Redirect to login |
| Supabase DB | Data persistence | SDK + REST | Result type errors |
| Supabase Storage | File uploads | SDK | Upload retry logic |
| Email (Resend) | Transactional email | REST API | Queue for retry |
| Analytics | Event tracking | JS SDK | Fire and forget |

### Webhook Endpoints

| Endpoint | Source | Verification | Handler |
|----------|--------|--------------|---------|
| `/api/webhooks` | External services | HMAC signature | Event router |
| `/api/auth/callback` | OAuth providers | State parameter | Session creation |

---

## Security Architecture

### Authentication Layers

```mermaid
flowchart TB
    subgraph Client
        U[User Browser]
    end

    subgraph Edge["Edge Layer"]
        M[Middleware]
        RL[Rate Limiter]
    end

    subgraph App["Application Layer"]
        A[API Routes]
        V[Validation]
    end

    subgraph Data["Data Layer"]
        RLS[Row Level Security]
        DB[(PostgreSQL)]
    end

    U -->|"1. HTTPS Request"| M
    M -->|"2. Check JWT"| RL
    RL -->|"3. Rate Check"| A
    A -->|"4. Validate Input"| V
    V -->|"5. Query with auth.uid()"| RLS
    RLS -->|"6. Apply Policies"| DB

    style RLS fill:#f9f,stroke:#333
    style M fill:#bbf,stroke:#333
```

### RLS Policy Strategy

All tables with user data enforce Row Level Security:

```sql
-- Example: Users can only access their own data
CREATE POLICY "Users can view own data"
    ON profile
    FOR SELECT
    USING (auth.uid() = user_id);

-- Team access uses SECURITY DEFINER functions to avoid recursion
CREATE FUNCTION is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM team_members WHERE ...);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph Users
        U[End Users]
    end

    subgraph CDN["CDN (Vercel Edge)"]
        E[Edge Network]
        MW[Edge Middleware]
    end

    subgraph Compute["Compute (Vercel)"]
        SSR[Server Components]
        API[API Routes]
        ISR[Incremental Static Regen]
    end

    subgraph Supabase["Supabase Platform"]
        PG[(PostgreSQL)]
        AUTH[Auth Service]
        STOR[Storage]
        RT[Realtime]
    end

    subgraph Monitoring
        LOG[Logging]
        APM[Performance]
        ERR[Error Tracking]
    end

    U --> E
    E --> MW
    MW --> SSR
    MW --> API
    SSR --> PG
    API --> PG
    API --> AUTH
    API --> STOR
    SSR --> RT

    API --> LOG
    SSR --> APM
    API --> ERR
```

### Environment Configuration

| Environment | URL Pattern | Database | Purpose |
|-------------|-------------|----------|---------|
| Development | localhost:3000 | Local/Branch DB | Feature development |
| Preview | pr-*.vercel.app | Branch DB | PR review |
| Staging | staging.*.com | Staging DB | Pre-production testing |
| Production | *.com | Production DB | Live users |

---

## Appendix: Diagram Legend

### C4 Diagram Shapes

| Shape | Meaning |
|-------|---------|
| Person | Human user or actor |
| System | Software system (yours or external) |
| Container | Deployable unit (app, database, etc.) |
| Component | Module within a container |

### Relationship Lines

| Line Style | Meaning |
|------------|---------|
| Solid arrow | Direct dependency |
| Dashed arrow | Async/eventual |
| Double line | Bidirectional |

### Entity Relationship Cardinality

| Symbol | Meaning |
|--------|---------|
| `\|\|` | Exactly one |
| `o\|` | Zero or one |
| `\|{` | One or more |
| `o{` | Zero or more |

---

*Generated by Mental Models SDLC - Architecture-First Design*
