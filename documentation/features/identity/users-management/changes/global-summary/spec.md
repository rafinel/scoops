---
title: Global Users-table summary
status: in_progress
revision: 1
source:
  type: direct-request
  ref: codex-task
scope:
  - documentation/prds/identity.md
  - documentation/features/identity/users-management/changes/global-summary
  - packages/core/src/identity
  - apps/server/src/identity
  - apps/web/src/ui/identity
  - apps/web/src/rest/services/identity-service.ts
  - apps/web/tests/routes/identity/users.index.test.ts
last_updated_at: 2026-08-20
---

# Global Users-table summary

## 1. Context and scope

The direct request requires the Users table summary and its Todos/Gerentes/Operadores counts
to behave like the Products-page global KPIs. Today the UI derives profile counts from the
current response page and uses filtered pagination total, so search, filters, and pagination
change the overview. The approved Identity PRD amendment now defines these as global counts
for manageable same-establishment users, still excluding the authenticated Manager.

| In scope | Out of scope |
| --- | --- |
| Tenant-global total/Manager/Operator summary in the existing list response; filtered rows and pagination; current UI copy/layout | New endpoint, current Manager inclusion, status-specific summary cards, user-detail or mutation changes |

## 2. Implementation Contract

| ID | Source | Required behavior |
| --- | --- | --- |
| `RF-01` | Identity REQ-06 global-summary rule | `GET /users` returns global `total`, `managers`, and `operators` counts for all manageable users in the actor's establishment, excluding the actor and foreign tenants, independently of search/profile/status/page. |
| `RF-02` | Identity REQ-06 list rules | Items and pagination metadata continue to respect active search/profile/status/page inputs. |
| `RF-03` | Direct request | The Users header summary and Todos/Gerentes/Operadores chips consume the global summary and remain stable as the table query changes. |

| ID | RF coverage | Given | When | Then | Evidence |
| --- | --- | --- | --- | --- | --- |
| `CA-01` | `RF-01`, `RF-02` | Same-tenant users inside/outside a filter and a foreign tenant user | A Manager requests a filtered page | Rows/metadata are filtered; summary counts the full manageable tenant team only | Core and real controller tests |
| `CA-02` | `RF-03` | A populated Users page | Search/profile/status/page changes | Table changes while all summary values remain unchanged and no separate summary request occurs | Widget and Playwright tests |
| `CA-03` | `RF-03` | The filtered browser state at 1481×900 | Evidence is captured | Global counts and filtered table state are visibly clear without layout change | `MV-01`, `VIS-01` |

## 3. Technical Contract

Add Core `UsersSummary` and `UsersPage` read structures; `UsersPage` extends the existing
pagination response with `summary`. Change `UsersRepository.findMany`, `ListUsersUseCase`,
`IdentityService.listUsers`, the REST DTO and adapter mapping to this response. The Drizzle
repository applies tenant + actor exclusion to both query families and search/profile/status
only to rows/pagination. The page/hook consumes `summary`; it must not calculate counts from
visible rows or issue a second request.

## 4. Validation Contract

| Evidence | Command/scenario | Coverage |
| --- | --- | --- |
| `EV-CORE` | Core code/types and focused list-users use-case test | Response contract and mapping |
| `EV-SERVER` | Focused real `list-users.controller.test.ts`, server code/types | Tenant/global summary plus filtered list |
| `EV-WEB` | Focused widget tests, web code/types, mocked Users route Playwright | Stable visible counts and one request per state |
| `MV-01` | At 1481×900, note counts, apply a narrowing filter/search, verify changed table/request and unchanged counts; inspect console/network | `CA-02`, `CA-03` |

Capture the filtered browser state through Playwright into `test-results/` or a CI artifact and
record the exact viewport, comparison result and artifact identifier in `evaluation.md`.

## 5. Documentation alignment and revision history

| Authority | Alignment |
| --- | --- |
| `documentation/prds/identity.md` | REQ-06 now defines global manageable-team counts. |
| Architecture/Modules/Design/Tooling | Existing backend authority, Identity ownership, visual pattern, and commands remain unchanged. |
| Rule Pack | Core, use-case testing, database, REST, controller testing, UI, widget testing, and code conventions apply. |

| Revision | Date | Change |
| --- | --- | --- |
| `1` | `2026-08-20` | Created after the explicit global-summary request and Identity PRD amendment. |
