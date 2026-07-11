# Security Policy & Architecture — TenderOS v1.0.0

This document describes the security policies, authentication mechanisms, access controls, encryption practices, and compliance features implemented in the TenderOS architecture.

---

## 1. Authentication & Token Management

TenderOS uses **JSON Web Tokens (JWT)** for session authentication.

- **Signature Verification**: Tokens are signed using the `HS256` symmetric algorithm with a 256-bit environment key (`JWT_SECRET`).
- **Access Tokens**: Have a TTL of 30 minutes. Stored client-side in secure HTTP headers.
- **Refresh Tokens**: Have a TTL of 7 days. Stored inside PostgreSQL with a one-to-many relationship with users, allowing administrators to audit active sessions and revoke refresh tokens on-demand.

---

## 2. Role-Based Access Control (RBAC)

The system enforces strict RBAC constraints inside the API Gateway and downstream routers:

| Role | Permissions | Access Level |
|---|---|---|
| **bid_manager** | Read/write tenders, watchlist, proposals, digital twin profiles | **Standard** |
| **executive** | Read-only tenders, view analytics summaries | **Read-Only** |
| **admin** | Full read/write access, health logs, microservice configuration | **Full Admin** |

---

## 3. Data Integrity & Cryptography

### 3.1 Password Hashing
User passwords are never stored in plain text. TenderOS uses **bcrypt** (`passlib[bcrypt]`) with a work factor of 12 (salt rounds) to hash credentials during registration.

### 3.2 SSL/TLS & In-Transit Encryption
- All public web traffic routed to Railway is encrypted using **TLS v1.3**.
- Internal microservices communicate inside the private Railway VPC network (`100.64.0.0/10`) using internal IP resolution, preventing external snooping of service traffic.

---

## 4. API Security Header Configuration

The API Gateway enforces HSTS and CSP headers to block injection and cross-site scripting (XSS):

```python
# Content Security Policy (CSP)
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...

# Strict Transport Security (HSTS)
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

# X-Frame-Options (Prevent Clickjacking)
X-Frame-Options: DENY

# X-Content-Type-Options (MIME Sniffing Prevention)
X-Content-Type-Options: nosniff
```

---

## 5. Security Environment Variables

To protect production keys, the project mandates that no secrets (e.g. `SECRET_KEY`, `POSTGRES_PASSWORD`, `GEMINI_API_KEY`) be committed to source control:

- **`.gitignore`**: Blocks files like `.env`, `.env.local`, and keys from being pushed to public git repos.
- **Secret Rotation**: Secrets are injected dynamically at runtime via the Railway settings dashboard.

---

## 6. Known Security Limitations

* **Wildcard CORS**: `CORS_ORIGINS` is currently set to `["*"]` to simplify Next.js frontend deployment. For enterprise compliance, this should be narrowed to the explicit domain of the frontend app.
* **Mock SAML SSO**: Single Sign-On configs fall back to local test profiles if no enterprise SAML server details are configured.
