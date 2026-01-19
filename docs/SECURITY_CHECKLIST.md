# Security Checklist - taxbook-pro

> Pre-deployment security review checklist and ongoing security practices.

---

## Pre-Deployment Checklist

### Authentication & Session Management

- [ ] **Password hashing** - Supabase handles this, but verify no plaintext storage
- [ ] **Session timeout** - Sessions expire appropriately (default: 1 hour)
- [ ] **Secure session storage** - Using HTTP-only cookies via `@supabase/ssr`
- [ ] **Password requirements** - Minimum 8 characters with complexity
- [ ] **Rate limiting on login** - Verify rate limiting is active (`src/lib/rate-limit.ts`)
- [ ] **Account lockout** - Supabase handles brute force protection
- [ ] **Logout invalidates session** - Verify `signOut()` clears server session

### Authorization & Access Control

- [ ] **RLS policies enabled** - All tables have Row Level Security
- [ ] **RLS policies tested** - Run `npm run test:db` to verify
- [ ] **No public access to sensitive tables** - Review `supabase/migrations/*.sql`
- [ ] **Role-based access** - `src/lib/permissions.ts` enforced
- [ ] **IDOR protection** - Users can only access their own data
- [ ] **Privilege escalation tested** - Verify users can't elevate roles

### Input Validation

- [ ] **All inputs validated** - Using Zod schemas (`src/lib/validation.ts`)
- [ ] **File uploads validated** - Type, size, extension checks
- [ ] **SQL injection prevented** - Using parameterized queries only
- [ ] **NoSQL injection prevented** - N/A (using PostgreSQL)
- [ ] **XSS prevention** - React escapes by default, no `dangerouslySetInnerHTML`
- [ ] **CSRF protection** - Supabase handles via SameSite cookies

### API Security

- [ ] **Authentication required** - Protected routes in `middleware.ts`
- [ ] **Rate limiting** - Per-route limits in `src/lib/rate-limit.ts`
- [ ] **Input validation** - All endpoints validate with Zod
- [ ] **Error messages safe** - No stack traces or internal details exposed
- [ ] **CORS configured** - Verify `next.config.mjs` settings
- [ ] **Content-Type enforcement** - JSON only for API routes

### Headers & Transport

- [ ] **HTTPS enforced** - Vercel/hosting handles this
- [ ] **Security headers** - CSP, X-Frame-Options, etc. in `middleware.ts`
- [ ] **HSTS enabled** - Verify `Strict-Transport-Security` header
- [ ] **Cookie security** - `Secure`, `HttpOnly`, `SameSite=Lax`

### Secrets Management

- [ ] **No secrets in code** - Check `.env.local.example` only has placeholders
- [ ] **Git history clean** - No secrets ever committed
- [ ] **Environment variables** - All secrets in Vercel/hosting env vars
- [ ] **API keys rotated** - No stale keys
- [ ] **.env in .gitignore** - Verify `.env*` patterns present

---

## OWASP Top 10 Verification

### A01:2021 - Broken Access Control

**Check:**
```bash
# Run RLS tests
npm run test:db

# Manual check: Try accessing another user's data
# 1. Create two test users
# 2. Create data as User A
# 3. Try to access via API as User B
```

**Files to review:**
- `supabase/migrations/*_rls.sql`
- `src/lib/permissions.ts`
- API route handlers

### A02:2021 - Cryptographic Failures

**Check:**
- [ ] Passwords hashed (Supabase uses bcrypt)
- [ ] Sensitive data encrypted at rest (Supabase handles)
- [ ] TLS 1.2+ in transit

### A03:2021 - Injection

**Check:**
```bash
# Run injection tests
npx playwright test business-rules.spec.ts

# Manual SQL injection test
curl -X POST /api/profile \
  -H "Content-Type: application/json" \
  -d '{"name": "test'; DROP TABLE users; --"}'
# Should fail validation, not execute SQL
```

### A04:2021 - Insecure Design

**Check:**
- [ ] Threat modeling completed
- [ ] Security requirements documented
- [ ] Defense in depth (RLS + application + API)

### A05:2021 - Security Misconfiguration

**Check:**
```bash
# Verify no default credentials
grep -r "password123\|admin123\|secret" src/

# Check for debug mode
grep -r "DEBUG\|development" src/

# Security headers present
curl -I https://taxbook-pro.vercel.app | grep -i "x-frame\|x-content\|strict"
```

### A06:2021 - Vulnerable Components

**Check:**
```bash
# Run dependency audit
npm audit

# Check for known vulnerabilities
npx snyk test
```

### A07:2021 - Identification and Authentication Failures

**Check:**
- [ ] Strong password policy enforced
- [ ] Rate limiting on auth endpoints
- [ ] Session management secure

### A08:2021 - Software and Data Integrity Failures

**Check:**
- [ ] CI/CD pipeline secured
- [ ] Dependency integrity (package-lock.json committed)
- [ ] Subresource Integrity for CDN resources

### A09:2021 - Security Logging and Monitoring

**Check:**
- [ ] Auth events logged (`src/lib/observability.ts`)
- [ ] Failed access attempts tracked
- [ ] Monitoring alerts configured

### A10:2021 - Server-Side Request Forgery (SSRF)

**Check:**
- [ ] URL inputs validated
- [ ] Outbound requests restricted
- [ ] Internal network access blocked

---

## RLS Policy Audit

Run this query to verify all tables have RLS enabled:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

### Policy Coverage Check

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

Verify each table has policies for:
- SELECT (read)
- INSERT (create)
- UPDATE (modify)
- DELETE (remove)

---

## API Security Verification

### Test Each Endpoint

#### Profile API

```bash
# Unauthenticated access (should fail)
curl -X GET /api/profile -v
# Expected: 401 Unauthorized

# Authenticated access
curl -X GET /api/profile \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with user's data only

# Cross-user access (should fail)
curl -X GET /api/profile/OTHER_USER_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found (not 403, to avoid enumeration)
```

#### Client API

```bash
# Unauthenticated access (should fail)
curl -X GET /api/client -v
# Expected: 401 Unauthorized

# Authenticated access
curl -X GET /api/client \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with user's data only

# Cross-user access (should fail)
curl -X GET /api/client/OTHER_USER_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found (not 403, to avoid enumeration)
```

#### Service API

```bash
# Unauthenticated access (should fail)
curl -X GET /api/service -v
# Expected: 401 Unauthorized

# Authenticated access
curl -X GET /api/service \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with user's data only

# Cross-user access (should fail)
curl -X GET /api/service/OTHER_USER_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found (not 403, to avoid enumeration)
```

#### Appointment API

```bash
# Unauthenticated access (should fail)
curl -X GET /api/appointment -v
# Expected: 401 Unauthorized

# Authenticated access
curl -X GET /api/appointment \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with user's data only

# Cross-user access (should fail)
curl -X GET /api/appointment/OTHER_USER_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found (not 403, to avoid enumeration)
```

#### Availability API

```bash
# Unauthenticated access (should fail)
curl -X GET /api/availability -v
# Expected: 401 Unauthorized

# Authenticated access
curl -X GET /api/availability \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with user's data only

# Cross-user access (should fail)
curl -X GET /api/availability/OTHER_USER_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found (not 403, to avoid enumeration)
```

#### Document API

```bash
# Unauthenticated access (should fail)
curl -X GET /api/document -v
# Expected: 401 Unauthorized

# Authenticated access
curl -X GET /api/document \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with user's data only

# Cross-user access (should fail)
curl -X GET /api/document/OTHER_USER_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found (not 403, to avoid enumeration)
```


---

## Secret Rotation Procedures

### Supabase Keys

1. Go to Supabase Dashboard > Settings > API
2. Generate new keys (anon, service_role)
3. Update in Vercel environment variables
4. Redeploy application
5. Verify functionality
6. Revoke old keys

### Third-Party API Keys

| Service | Rotation Frequency | Procedure |
|---------|-------------------|-----------|
| Stripe | Annually | Dashboard > Developers > API keys |
| Resend | Annually | Settings > API Keys |
| Upstash | Annually | Console > Database > Security |

### Emergency Rotation

If a key is compromised:
1. Immediately rotate the affected key
2. Deploy with new key
3. Check logs for unauthorized access
4. Document the incident

---

## Dependency Audit Commands

```bash
# Full audit
npm audit

# Fix automatically where possible
npm audit fix

# Check for outdated packages
npm outdated

# Deep dependency check
npx snyk test

# License compliance
npx license-checker --summary
```

---

## Security Review Cadence

| Review Type | Frequency | Owner |
|-------------|-----------|-------|
| Dependency audit | Weekly (automated via Renovate) | CI/CD |
| OWASP Top 10 check | Monthly | Security lead |
| Penetration test | Quarterly | External vendor |
| Full security audit | Annually | External vendor |
| Secret rotation | Annually | DevOps |

---

## Incident Response

If a security issue is discovered:

1. **Contain** - Disable affected functionality
2. **Assess** - Determine scope and impact
3. **Notify** - Inform stakeholders per policy
4. **Remediate** - Fix the vulnerability
5. **Review** - Post-incident analysis
6. **Update** - Improve detection and prevention

See `docs/INCIDENT_RUNBOOK.md` for detailed procedures.
