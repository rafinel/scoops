---
title: Refactor authentication and PostgreSQL infrastructure
status: completed
revision: 14
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/28
last_updated_at: 2026-09-04
---

# Delivery outcome

Revision 14 is complete and was delivered through [PR #32](https://github.com/rafinel/scoops/pull/32)
at head `96d68d1ea5af8754672e07a6c3a08c50f574688f`.

The implementation replaces active Supabase authentication infrastructure with Better Auth,
PostgreSQL/Neon configuration and server-issued HttpOnly cookie sessions. It preserves approved
Identity authorization, onboarding, invitation, recovery, reset, revocation and audit behavior,
adds Communication-owned Identity email delivery and a transactional outbox boundary, migrates
Web SSR/browser transport, and removes obsolete Supabase runtime/configuration/cutover artifacts.

No production cutover, DNS change, data migration, merge or deployment was performed.

## Delivery validation

- All acceptance criteria `CA-01`–`CA-12`, `CA-16`–`CA-18` passed.
- Core, Validation, Server and Web checks, builds, coverage floors, migrations, route generation,
  Test Integrity, REST parity and removal/configuration sensors passed.
- Local MV-01–MV-06/MV-08 evidence passed; the exact Web route suite passed 190/190.
- Final PR CI passed for Core, Validation, Server, Web and both Vercel previews at the recorded
  head. See [`evaluation.md`](./evaluation.md) for commands, metrics and run links.

## PRD traceability

Fully delivered Identity requirements are REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-08, REQ-09
and REQ-13. Identity REQ-10 and Communication REQ-01, REQ-04, REQ-05 and REQ-08 remain explicitly
partial or deferred and their checkboxes remain unchecked in the PRDs.
