# Security Audit Report — TenderOS v1.0.0

This report summarizes the security posture, authentication protocols, transport policies, and vulnerability mitigations implemented on TenderOS.

---

## 1. Authentication & Session Auditing

- **Algorithm**: `HS256` symmetric signing.
- **Secret Key Security**: `JWT_SECRET` and `SECRET_KEY` are decoupled from code files and configured exclusively via Railway environment variables.
- **Session Duration**: Access tokens expire in 30 minutes; refresh tokens are stored in the database for secure revocation.
- **Password Hashing**: Bcrypt with 12 salt rounds protects all user credentials.

---

## 2. API Gateway Security Headers Audit

We verified the API Gateway response headers against OWASP guidelines:

- **Strict-Transport-Security (HSTS)**: `max-age=63072000; includeSubDomains; preload` (Forces secure HTTPS connections).
- **Content-Security-Policy (CSP)**: Restrictions apply to scripts, style sheets, and frame-ancestors.
- **X-Frame-Options**: `DENY` (Protects against Clickjacking).
- **X-Content-Type-Options**: `nosniff` (Prevents MIME sniffing attacks).
- **X-XSS-Protection**: `1; mode=block` (Blocks browser-level XSS execution).

---

## 3. Network Isolation

- **External Access**: Only Next.js (Vercel) and the API Gateway (Railway port 8080) are exposed to the public internet.
- **Internal Access**: Backend services (auth, tenders, scheduler) communicate via loopback IP inside a single Docker process space, and Postgres uses the private Railway VPC domain (`postgres.railway.internal`), preventing external database connections.

---

## 4. Known Risks & Mitigation Plan

- **Wildcard CORS**: CORS origins currently use wildcard configs (`["*"]`) to simplify Next.js routing. For enterprise rollouts, we recommend narrowing CORS strictly to the Next.js Vercel app domain.
- **Mock SAML SSO**: Single Sign-On defaults to mock authentication if no corporate SAML settings are provided.
