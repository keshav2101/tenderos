# TenderOS Security Architecture & Policy

## Threat Model & Security Controls

1. Authentication: JWT tokens signed with HS256 algorithm.
2. Role-Based Access Control (RBAC): Admin, Analyst, and Viewer roles enforced by Governance Service.
3. Tenant Isolation: Multi-tenant isolation enforced via `x-tenant-id` HTTP header.
4. Data Protection: Database passwords, API keys, and JWT secrets stored in environment variables, never hardcoded.
5. Static Analysis: Bandit (Python SAST) and Gitleaks (Secrets detection) integrated into CI/CD.

## Vulnerability Reporting

Please report security issues directly to the security team via security@tenderos.in.
