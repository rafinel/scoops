---
title: Authenticated global search — implementation plan
status: completed
spec: ./spec.md
spec_revision: 12
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/47
updated_at: 2026-09-29
---

# Execution status

- **Spec:** [`./spec.md`](./spec.md), revision 12, `completed` after the compatibility review, implementation evidence, PR publication and implementation-candidate CI gate.
- **Plan-backed rationale:** The contract spans Core, Validation, Server and Web, with role and tenant boundaries, an authenticated endpoint, cross-module read adapters, generated route coordination, real HTTP validation and nine design references.
- **Current phase:** All implementation phases and evidence are complete; PR #48 implementation-candidate CI passed. The delivery closure commit is being published for its final-head CI gate.
- **Next action:** Confirm all applicable CI checks pass on the closure commit head.
- **Active blockers:** No implementation blockers. Closure-head CI is pending.
- **Active Builders:** All Builder assignments are complete; no Builder work remains.
- **Shared ownership:** The Orchestrator owns `.dependency-cruiser.mjs`, route generation output (`apps/web/src/routeTree.gen.ts`, only if generation changes it), the integrated path sensor, evidence integration and review coordination. Do not hand-edit generated route metadata.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` (`/root/builder_core`) | F1 | Core search contracts | — | F2 | `completed` | Public structures, provider ports, service/repository contracts and exports compile and pass Core checks. |
| 1 | `Builder Validation` (`/root/builder_validation`) | F2 | Search query schemas | — | F1 | `completed` | Both shared schemas and root exports pass Validation code and type checks. |
| 2 | `Builder Core` (`/root/builder_core`) | F3 | Search use case | F1, F2 | — | `completed` | Focused use-case tests and Core code/type checks prove role policy, scoping, grouping, caps, order and all-or-error behavior. |
| 3 | `Orchestrator` | F4 | Shared-provider architecture boundary | F1, F2, F3 | — | `completed` | `.dependency-cruiser.mjs` encodes only the four source-specific revision 5 allowlists; server and root architecture checks pass without broad shared-provision exceptions. |
| 4 | `Builder Server` (`/root/builder_server`) | F5 | Scoped providers and authenticated search endpoint | F1, F2, F3, F4 | F6 | `completed` | Orchestrator reran Server code, architecture, type and build checks; focused Supertest passed 4/4; full coverage passed 94 files/264 tests above all floors; REST example parity confirmed against the controller and shared query schema. |
| 4 | `Builder Web` (`/root/builder_web`) | F6 | Global search UI, route behavior and channel filter | F1, F2, F4 | F5 | `completed` | F6-T1 and F6-T2 pass their feature and broad integration exits; the full Web Playwright suite passes 229/229 at the default one-worker setting. |
| 5 | `Orchestrator` | F7 | Integrated validation and handoff (revision 5) | F5, F6 | — | `completed — historical` | Revision 5 path sensor, workspace checks, MV-01, visual rows and reviews passed. Revision 6 invalidates role-scope evidence listed in Evaluation. |
| 6 | `Builder Core` (`/root/builder_core`) | F8 | Operator global-search policy and stock-history access | F1, F2, F3; Spec revision 6 review | — | `completed` | Core permits the five Operator page results and scoped product/order/channel/discount record results without Identity user searches; authorized Operators read product-scoped stock history; focused tests, Core code/type checks and coverage pass (96 files/270 tests above floors). |
| 7 | `Builder Server` (`/root/builder_server`) | F9 | Operator read-only server access | F8 | F10 | `completed` | Scoped Operator GETs, foreign-tenant rejection, search groups/no users, and Manager-only write/preview denial passed; focused HTTP passed 11 files/27 tests, 16 added authorization suites passed 16 files/51 tests, Server coverage passed 94 files/281 tests above floors, and Server/Core checks/build/architecture passed. |
| 7 | `Builder Web` (`/root/builder_web`) | F10 | Operator read-only pages and routes | F8 | F9 | `completed` | Operator read-only pages and route behavior are validated. The clean current-main candidate includes the exact Dashboard route test (Modify) and Subscription route test (Create) from revision 12; focused route checks pass 8/8, Biome passes both files, and final path conformance passes 116 paths. |
| 8 | `Orchestrator` | F11 | Revision 10 integrated validation and review | F9, F10 | — | `completed` | Revision 10 path sensor, root architecture/test-integrity gates, Server/Web coverage and build gates, real authenticated MV-01, refreshed visual evidence, and both integrated review follow-ups pass. Evaluation is ready; conclusion remains a separate workflow. |
| 9 | Core, Server, Web Builders | F12 | Complexity corrections and evidence refresh | F11; revision 11 Spec review; revision 12 baseline-path review | Parallel by workspace | `completed` | Feature-owned error-level complexity findings are resolved; the generated baseline is refreshed and reviewed only for this intentional refactor; root/scoped gates, workspace quality checks, affected UI behavior and fresh screenshots pass. |

#### F6-T2 — Correct the broad Web integration regressions

- **Status/owner:** `completed` — Builder Web (`/root/builder_web`, resumed original ownership assignment)
- **Activation:** User requested all broad Web integration failures be fixed. Evaluation preflight EV-00 passed again; the Builder was given Spec revision 5, F6's AC-01–AC-10 coverage, the original Web Rule Pack, the failing route set, and the instruction to distinguish app regressions from test-startup/environment failures before changing files. The second traced full run and two read-only audits identified a shared Vite console-pipe broadcast, browser auth requests that are not isolated by the session fixtures, and one expected Lottie unmount abort.
- **Paths:** Original confirmed failing tests: `apps/web/tests/communication/notifications-page.test.tsx`; `apps/web/tests/mrp/product-prices-page.test.ts`; `apps/web/tests/pdv/order-page.test.tsx`. Verified shared-hook defect: `apps/web/src/ui/communication/hooks/use-mark-notifications-read-action.ts`. Shared harness paths now authorized by trace evidence: `apps/web/vite.config.ts` (disable server-console piping only for the Playwright SSR-auth Vite process); `apps/web/tests/fixtures/identity-module-fixture.ts` (mock browser session endpoints for mocked Manager/Operator flows); `apps/web/tests/pdv/sales-channels-page.test.ts` (classify only the known animation asset's expected `AbortError`); `apps/web/playwright.config.ts` (use the repository's documented single-worker CI setting by default after failures reproduced only under parallel cold Vite startup). Preserve Spec ownership and test integrity; unrelated feature assertions remain strict.
- **Contract:** FR-08; AC-01, AC-04, AC-05, AC-07, AC-08, AC-09 and AC-10 where applicable; existing route behavior remains subject to its owning feature contracts.
- **Exit:** Passed. Reproduced and classified all full-run failures, corrected the notification pagination race, stale Product Prices GET fixture and ambiguous cancellation locator, isolated browser auth mocks, disabled DevTools server-console piping only for the Playwright SSR-auth server, matched the repository's single-worker CI default, and narrowly classified the expected animation asset `AbortError` while retaining all other console and failed-request assertions. `pnpm --filter web test:integration --trace retain-on-failure` passed 229/229 with no failed or unrun tests; the final Sales Channels suite passed 15/15. No Spec-contracted source path changed. EV-13/EV-14 and F-09/F-13 record exact evidence and findings.

### F1 — Core search contracts

#### F1-T1 — Define public search contracts

- **Status/owner:** `completed` — Builder Core (`/root/builder_core`)
- **Depends/parallel:** No dependency; parallel with F2-T1. F3-T1 reuses this Builder after F1 exits.
- **Paths:** `packages/core/src/identity/domain/structures/global-search-hit.ts`; `packages/core/src/identity/domain/structures/global-search-page-key.ts`; `packages/core/src/identity/domain/structures/global-search-results.ts`; `packages/core/src/identity/domain/structures/global-search-provider-input.ts`; `packages/core/src/identity/domain/structures/index.ts`; `packages/core/src/identity/interfaces/identity-global-search-provider.ts`; `packages/core/src/identity/interfaces/mrp-global-search-provider.ts`; `packages/core/src/identity/interfaces/pdv-global-search-provider.ts`; `packages/core/src/identity/interfaces/identity-service.ts`; `packages/core/src/identity/interfaces/index.ts`; `packages/core/src/pdv/interfaces/sales-channels-repository.ts`.
- **Contract:** FR-02–FR-05; AC-02–AC-06 and AC-10.
- **Outcome:** Core exposes typed Identity search results and owning-module provider/repository contracts without infrastructure dependencies.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`.
- **Exit:** Passed `pnpm --filter @scoops/core check:code` and `pnpm --filter @scoops/core check:types`; inspected exports and imports for Core ownership and dependency direction.

### F2 — Shared validation schemas

#### F2-T1 — Add global-query and sales-channel route schemas

- **Status/owner:** `completed` — Builder Validation (`/root/builder_validation`)
- **Depends/parallel:** No dependency; parallel with F1-T1.
- **Paths:** `packages/validation/src/identity/global-search-query-schema.ts`; `packages/validation/src/web/sales-channels-search-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** FR-01, FR-08; AC-01, AC-05, AC-06 and AC-10.
- **Outcome:** Shared validation accepts only trimmed 1–100 character global queries and round-trips the optional sales-channel name filter with the existing adjustment filter.
- **Rules:** `documentation/rules/validation-package-rules.md`.
- **Exit:** Passed `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; confirmed public root export and that schemas contain no authorization or persistence policy.

### F3 — Core search use case

#### F3-T1 — Coordinate authorized search results

- **Status/owner:** `completed` — Builder Core (`/root/builder_core`, reuse F1)
- **Depends/parallel:** Depends on F1-T1 and F2-T1; started in Wave 2 after both Wave 1 phases exited. Core use-case code does not depend on the Validation schema.
- **Paths:** `packages/core/src/identity/use-cases/search-global-use-case.ts`; `packages/core/src/identity/use-cases/index.ts`; `packages/core/src/identity/use-cases/tests/search-global-use-case.test.ts`.
- **Contract:** FR-02–FR-06; AC-02, AC-03, AC-06, AC-07 and AC-10.
- **Outcome:** The use case derives role and establishment scope from the authenticated account, calls only permitted providers, returns stable capped groups, and rejects the whole query when an invoked provider fails.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md`.
- **Exit:** Passed the focused use-case test and `pnpm --filter @scoops/core check:code`, `check:types` and `test:coverage`; tests cover Manager and Operator scope, tenant propagation, grouping, ordering, limits, current-user exclusion, query forwarding, provider-supplied snapshot context and provider rejection using typed provider mocks. Coverage floors passed: statements 70.25%, branches 62.74%, functions 76.72%, lines 72.1%. Exact order-number matching and persistence of the historical order snapshot remain F5 owning-provider checks.

### F4 — Shared-provider architecture boundary

#### F4-T1 — Allow only the named global-search provider dependencies

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on Spec revision 5 compatibility review; precedes the F5 architecture exit and F6 Builder activation.
- **Paths:** `.dependency-cruiser.mjs` (Orchestrator-owned root architecture configuration).
- **Contract:** Composition path and exact source-specific allowed imports in Spec revision 5; supports FR-02–FR-06 and AC-02, AC-03, AC-05, AC-06, AC-07 and AC-10.
- **Outcome:** The global-search shared provider composes the three owning modules while every shared adapter remains limited to its own repository-token constants; unrelated shared-to-feature imports remain blocked.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/architecture.md`.
- **Exit:** Added four source-specific rules matching the Spec's permitted-import table. `pnpm --filter server check:architecture` passed (659 modules/3,396 dependencies); `pnpm check:architecture` passed for Core, Validation, Server and Web. Inspected that the generic shared boundary remains active outside the four named files and each new rule has its own target allowlist.

### F5 — Server providers and authenticated endpoint

#### F5-T1 — Implement scoped adapters and the global-search route

- **Status/owner:** `completed` — Builder Server (`/root/builder_server`)
- **Depends/parallel:** Depends on F1-T1, F2-T1, F3-T1 and F4-T1; parallel with F6-T1. Keep this Server ownership assignment for database, provision, composition, REST and controller-test paths.
- **Paths:** `apps/server/src/pdv/database/drizzle/repositories/drizzle-sales-channels-repository.ts`; `apps/server/src/shared/provision/global-search/identity-global-search-provider.ts`; `apps/server/src/shared/provision/global-search/mrp-global-search-provider.ts`; `apps/server/src/shared/provision/global-search/pdv-global-search-provider.ts`; `apps/server/src/shared/provision/global-search/global-search-provision.module.ts`; `apps/server/src/identity/constants/identity-providers.ts`; `apps/server/src/identity/decorators/global-search-controller.ts`; `apps/server/src/identity/decorators/index.ts`; `apps/server/src/identity/rest/controllers/search-global.controller.ts`; `apps/server/src/identity/rest/controllers/index.ts`; `apps/server/src/identity/rest/dtos/global-search-hit-response.dto.ts`; `apps/server/src/identity/rest/dtos/global-search-response.dto.ts`; `apps/server/src/identity/rest/dtos/index.ts`; `apps/server/src/identity/identity.module.ts`; `apps/server/src/identity/rest/controllers/tests/search-global.controller.test.ts`; `apps/server/rest-client/identity/global-search.rest`.
- **Contract:** FR-02–FR-06; AC-02, AC-03, AC-05, AC-06, AC-07 and AC-10.
- **Outcome:** The authenticated `GET /global-search` resolves server-side account scope, composes owning-module read providers, returns explicit grouped DTOs and fails atomically. The channel-name repository query is establishment-scoped, case-insensitive, stable and bounded.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`.
- **Exit:** Orchestrator reran Server code, architecture, type and build checks plus focused real controller integration through Supertest and full coverage. The integration uses real module wiring, database fixtures and scoped repositories to verify Manager/Operator results, exact `#`/numeric matching, historical order snapshot after product rename, 401/422 handling, tenant isolation and whole-query failure (generic 500 with no partial groups); the role decorator declares the Manager/Operator allowlist, with no third valid persisted profile to exercise a 403 account. Full coverage passed 94 files/264 tests with statements 73.56%, branches 56.86%, functions 75.73%, lines 76.23% (floors 71.6/52.7/71.6/75.2). Compared the single `.rest` request with the controller and shared 1–100-character trimmed `q` schema; its cookie is an unresolved environment variable and contains no credential. No migration is expected.

### F6 — Web search and route behavior

#### F6-T1 — Integrate the Header search, navigation and sales-channel filter

- **Status/owner:** `completed` — Builder Web (`/root/builder_web`)
- **Depends/parallel:** Depends on F1-T1, F2-T1 and F4-T1; parallel with F5-T1. Own the Spec-listed Web paths as one cohesive UI boundary.
- **Paths:** `apps/web/src/ui/identity/widgets/components/global-search/index.tsx`; `apps/web/src/ui/identity/widgets/components/global-search/use-global-search.ts`; `apps/web/src/ui/identity/widgets/components/global-search/tests/global-search.test.tsx`; `apps/web/src/ui/identity/widgets/components/global-search/tests/use-global-search.test.ts`; `apps/web/src/ui/identity/hooks/use-global-search-query.ts`; `apps/web/src/ui/identity/hooks/identity-query-keys.ts`; `apps/web/src/ui/shared/widgets/layouts/app-layout/header/index.tsx`; `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx`; `apps/web/src/rest/services/identity-service.ts`; `apps/web/src/constants/routes.ts`; `apps/web/src/constants/sidebar-items.ts`; `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/use-sales-channels-page.ts`; `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/tests/sales-channels-page.test.tsx`; `apps/web/src/routes/_authenticated/sales-channels/index.tsx`; `apps/web/src/routes/_authenticated/products/index.tsx`; `apps/web/src/routes/_authenticated/subscription/index.tsx`; `apps/web/src/middlewares/require-dashboard-or-redirect-operator-middleware.ts`; `apps/web/src/routes/_authenticated/index.tsx`; `apps/web/tests/analytics/dashboard-page.test.ts`; `apps/web/tests/mrp/products-page.test.tsx`; `apps/web/tests/billing/subscription-page.test.tsx`; `apps/web/tests/identity/account-page.test.ts`; `apps/web/tests/pdv/sales-channels-page.test.ts`.
- **Contract:** FR-01–FR-08; AC-01–AC-10.
- **Outcome:** The authenticated Header renders the debounced, grouped and keyboard-accessible search with pending, empty, error and retry states; typed results navigate through canonical routes; direct role guards and the sales-channel URL filter follow the Spec.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/ui-layer-rules.md` — `Antipatterns to Avoid`; `documentation/rules/widget-testing-rules.md` — `Antipatterns to Avoid`; `documentation/rules/web-app-routing-rules.md`.
- **Exit:** Run `pnpm --filter web generate-routes` for the changed route files, then in order `pnpm --filter web check:code`, `pnpm --filter web check:types`, and `pnpm --filter web test`; run the focused widget tests and affected Playwright CLI route suites. Assert visible state plus exact URL and mocked transport contract, and identify mocked transport as UI evidence only. Compare the final widget tree with the Spec. Exercise ArrowUp/ArrowDown, Enter, Escape, Tab/focus return, announcements and 320 × 700 behavior; inspect console and failed requests. Capture fresh Playwright CLI screenshots for each of the nine manifest references at its mapped state and viewport, including the five `MV-01` success captures and the `gs-loading`, `gs-empty` and `gs-error` artifacts. Store transient captures under `test-results/` or CI artifacts and compare each reference independently.

### F7 — Integrated validation and handoff

#### F7-T1 — Integrate evidence, reviews and delivery readiness

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F5-T1 and F6-T1. Generated route metadata, when any, is Orchestrator-owned. Run the path sensor before integrated sensors or Implementation Reviewer activation.
- **Paths:** `documentation/features/identity/global-search/plan.md`; `documentation/features/identity/global-search/evaluation.md`; `apps/web/src/routeTree.gen.ts` only if route generation produces a contracted change.
- **Contract:** AC-01–AC-10 and all Spec Validation Contract rows, including MV-01 and visual reference coverage.
- **Outcome:** The complete candidate has current structural, automated, runtime and visual evidence, both required review cycles are resolved, and the Plan is ready to route to `conclude-spec`.
- **Rules:** `documentation/sdd.md`; `documentation/tooling.md`; `documentation/architecture.md`; `documentation/design.md`.
- **Exit:** Run `pnpm check:spec-implementation -- documentation/features/identity/global-search/spec.md` on the complete integrated candidate and record its result before other integrated sensors or review. Then run every affected workspace's code, architecture, type, coverage, test, integration and build commands listed in the Spec and Tooling; preserve coverage floors. Complete real-server MV-01, inspect URL/network/console evidence, capture/compare all nine design rows, complete exactly one Implementation Reviewer after the sensor passes, and complete exactly one Visual Reviewer after all nine current captures exist. Verify all findings, fixture/service cleanup, REST parity and the final handoff checklist below. After any contracted-path correction, mark the prior path-sensor evidence stale and rerun it before invalidated sensors or the same Reviewer resume.

## Revision 6–9 — Operator read-only expansion and implementation-boundary mapping

The phases below follow the user-approved Operator scope. Revision 6 established that behavior and passed compatibility review. Revision 7 maps exact Core authorization and nested Web view-only paths found during implementation; revision 8 adds precise populated-child role tests after review identified gaps in mocked/empty fixtures; revision 9 captures the stock-history separation found by route validation; revision 10 confirms baseline-denial test paths. These revisions clarify implementation/evidence for the same approved read-only behavior. F1–F7 and their evidence remain historical delivery context; F8–F11 are now complete.

### F8 — Operator search policy

#### F8-T1 — Expand Operator page and record groups

- **Status/owner:** `completed` — Builder Core (`/root/builder_core`)
- **Depends/parallel:** Depends on F1–F3 and revision 6 Spec review; must finish before F9/F10.
- **Paths:** `packages/core/src/identity/use-cases/search-global-use-case.ts`; `packages/core/src/identity/use-cases/tests/search-global-use-case.test.ts`; `packages/core/src/mrp/use-cases/list-stock-transactions-use-case.ts`; `packages/core/src/mrp/use-cases/tests/list-stock-transactions-use-case.test.ts`.
- **Contract:** FR-02, FR-04; AC-03, AC-05, AC-10, AC-11.
- **Outcome:** Operators receive Products, Sales Channels and Discounts page matches and scoped product/order/channel/discount groups; Identity user search remains Manager-only. Product stock-history reads follow the authorized product and remain tenant-scoped.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md`.
- **Exit:** Passed Core code and type checks; focused two-file suite passed 10/10; full coverage passed 96 files/270 tests at 70.29/62.83/76.72/72.14 percent, above all floors. Tests prove exact Operator page/group policy, tenant forwarding, provider invocation, caps/order, no Identity provider call, and scoped stock-history access with invalid actor/missing/foreign records denied.

### F9 — Server read authorization and search providers

#### F9-T1 — Permit scoped Operator reads and retain Manager-only writes

- **Status/owner:** `completed` — Builder Server (`/root/builder_server`)
- **Depends/parallel:** Depends on F8; parallel with F10. Keep the existing Server Builder ownership for MRP/PDV REST, the exact Core read-authorization use cases/tests listed in the Spec, repository behavior, provider adapters, module wiring and Server controller tests.
- **Paths:** Spec section 3 `apps/server` Existing read authorization and provider paths; the five MRP and three PDV Core read use cases and their eight exact use-case test paths; plus the MRP/PDV write-controller authorization tests named in the Validation Contract.
- **Contract:** FR-02, FR-04; AC-03, AC-05, AC-10, AC-11.
- **Outcome:** Product list/details and immutable stock history, sales-channel list and Combo discount list/details support same-establishment Operator GET reads; search exposes the Operator product/channel/discount providers; all product/channel/discount mutations retain Manager authorization. MRP administration, production previews and Combo editor catalog reads remain Manager-only.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/provision-layer-rules.md`.
- **Exit:** Real Nest/Supertest tests verified allowed same-establishment Operator GETs, direct foreign Product/Combo denial, list/search foreign-row exclusion, write/preview denial and Manager success. Global-search integration verified Operator product/channel/discount groups and no user results. Focused HTTP passed 11 files/27 tests; the 16 added authorization suites passed 16 files/51 tests. Core coverage passed 96 files/270 tests (70.44/63.34/77.12/72.28%); Server coverage passed 94 files/281 tests (73.56/56.86/75.73/76.23%). Server code, architecture (659 modules/3,398 dependencies), types and build passed. Code check retained seven pre-existing `useHookAtTopLevel` warnings.

### F10 — Web read-only pages and routes

#### F10-T1 — Expose Operator pages without management controls

- **Status/owner:** `completed` — Builder Web (`/root/builder_web`)
- **Depends/parallel:** Depends on F8; parallel with F9. Keep Web ownership for route, page, role guard, navigation, widget and route-test paths in the revision 6 Spec.
- **Paths:** Spec section 3 `apps/web` UI, composition and route path tables; exact Products, Sales Channels, Discounts, Product detail child widgets, Operator Order detail, and their route/widget test paths in the Validation Contract.
- **Contract:** FR-02, FR-04; AC-03, AC-05, AC-10, AC-11.
- **Outcome:** Operators can use scoped Products (including stock history), Order details, Sales Channels and Discounts read surfaces. Product/discount/channel management, Order cancellation and the product-registration empty-state CTA are unavailable; New Sale remains available; other Manager-only destinations stay guarded.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/design.md`.
- **Exit:** Route/page/widget tests cover both roles, role-specific empty state, available read details, hidden mutations, direct-route restrictions and canonical result navigation. Generate routes when needed, then pass Web code, types, tests, coverage, build and relevant Playwright route checks. Fresh desktop captures for Operator Products, Sales Channels and Discounts match the current designs; search remains aligned to the content column beside the sidebar.

### F11 — Revision 10 integrated evaluation

#### F11-T1 — Refresh evidence and review the integrated candidate

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F9 and F10. Run the complete Spec path sensor before integrated sensors or Implementation Reviewer activation.
- **Paths:** `documentation/features/identity/global-search/plan.md`; `documentation/features/identity/global-search/evaluation.md`; generated route tree only if route generation changes it.
- **Contract:** AC-01–AC-11 and all current Validation Contract rows.
- **Outcome:** Revision 10 has current path, regression, role, runtime and visual evidence; AC-11 is fully evaluated and prior role evidence is either refreshed or marked historical.
- **Rules:** `documentation/sdd.md`; `documentation/tooling.md`; `documentation/architecture.md`; `documentation/design.md`.
- **Exit:** Passed the revision 10 Spec path sensor (114 paths: 27 Create/87 Modify), root architecture and test-integrity checks, Core/Validation/Server/Web gates including Server 94 files/282 tests and Web 211 files/544 tests, prior broad Web integration (237/237), and a real authenticated Manager/Operator MV-01 with read-only pages and rejected writes. Literal wildcard cases pass real Server HTTP coverage. Fresh Operator page and desktop/mobile Header captures were visually inspected; Implementation and Visual Reviewer follow-ups found no remaining P1/P2 findings. Evaluation is `ready`; no PRD requirement checkbox was changed.

### F12 — Complexity corrections

#### F12-T1 — Refactor Core and Server complexity findings

- **Status/owner:** `completed` — Builder Core (`/root/builder_fix_core`) and Builder Server (`/root/builder_fix_server`).
- **Depends/parallel:** Depends on conclusion preflight finding F-19; parallel with F12-T2 because workspace ownership is disjoint.
- **Paths:** Core owns `packages/core/src/identity/use-cases/search-global-use-case.ts`. Server owns `apps/server/src/identity/rest/dtos/global-search-response.dto.ts`, `apps/server/src/shared/provision/global-search/identity-global-search-provider.ts`, `apps/server/src/shared/provision/global-search/mrp-global-search-provider.ts`, `apps/server/src/shared/provision/global-search/pdv-global-search-provider.ts`, `apps/server/src/mrp/database/drizzle/repositories/drizzle-products-repository.ts`, and `apps/server/src/pdv/database/drizzle/repositories/drizzle-sales-channels-repository.ts`.
- **Contract:** Preserve FR-01–FR-08 and AC-01–AC-11; retain DTO shape, query scoping, literal wildcard behavior, role policy and API behavior.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/rest-layer-rules.md`.
- **Exit:** Core and Server complexity, code, type and focused test checks pass; Server architecture remains valid. Core passed its focused use-case suite (5/5); Server passed its real controller/Testcontainers suite (6/6). Final revision 12 path conformance passed all 116 paths, and root/Core/Server/clean-candidate-Web complexity gates pass with zero warnings/errors after the reviewed baseline refresh.

#### F12-T2 — Refactor Web complexity findings

- **Status/owner:** `completed` — Builder Web (`/root/builder_fix_web`) and Sales Channels/IdentityService helper (`/root/sales_channels_list_split`).
- **Depends/parallel:** Depends on conclusion preflight finding F-19; parallel with F12-T1. Preserve excluded analytics dashboard edits.
- **Paths:** Existing mapped Web complexity files: `apps/web/src/rest/services/identity-service.ts`; `apps/web/src/ui/identity/widgets/components/global-search/index.tsx`; `apps/web/src/ui/identity/widgets/components/global-search/use-global-search.ts`; `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-table/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-resale-settings-card/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/product-recipe-card/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/recipe-ingredients-table/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-settings-slot/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/product-brands-card/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-sizes-card/product-sizes-table/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/use-combo-discount-page.ts`; `apps/web/src/ui/pdv/widgets/pages/discounts-page/use-discounts-page.ts`; `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/use-sales-channels-page.ts`; and `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/index.tsx`. The new child widget paths are the 24 revision 11 `Create` paths enumerated in Spec section 3. Do not modify `apps/web/src/ui/analytics/widgets/pages/dashboard-page/index.tsx` or `apps/web/src/server/analytics/log-analytics-interaction.ts`; these are excluded user-owned changes.
- **Contract:** Preserve FR-01–FR-08 and AC-01–AC-11, role-based read-only behavior, routes, search keyboard behavior, accessibility, responsive layout and existing API behavior.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/design.md`.
- **Exit:** Web code and focused tests pass; all feature-owned error-level complexity findings are resolved. The clean-candidate Web type check passed; the shared dirty worktree command reports one diagnostic in excluded user-owned analytics code. Clean-candidate Web scoped complexity passes with zero warnings/errors. Orchestrator captured and inspected current desktop, narrow, keyboard, loading, empty, error and Operator read-only screenshots and reran live browser behavior with console/network checks.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Integrated path conformance: `pnpm check:spec-implementation -- documentation/features/identity/global-search/spec.md` | Complete affected-path map | Spec Technical Contract | `./evaluation.md` | `completed` |
| Automated | Core: `pnpm --filter @scoops/core check:code`; `pnpm --filter @scoops/core check:architecture`; `pnpm --filter @scoops/core check:types`; `pnpm --filter @scoops/core test:coverage` | AC-02, AC-03, AC-06, AC-07, AC-10 | Spec Testing Strategy | `./evaluation.md` | `completed` |
| Automated | Validation: `pnpm --filter @scoops/validation check:code`; `pnpm --filter @scoops/validation check:types` | FR-01, FR-08; AC-01, AC-06 | Validation Contract | `./evaluation.md` | `completed` |
| Automated | Shared-provider architecture boundary: `pnpm --filter server check:architecture`; `pnpm check:architecture` | F4 exact source-specific dependency table | Spec revision 5 architecture boundary | `.dependency-cruiser.mjs`; `./evaluation.md` | `completed` |
| Automated | Server: `pnpm --filter server check:code`; `pnpm --filter server check:architecture`; `pnpm --filter server check:types`; `pnpm --filter server test:coverage`; `pnpm --filter server build`; plus focused controller HTTP integration | AC-02, AC-03, AC-05, AC-06, AC-07, AC-10 | Server Technical and Validation Contracts | `./evaluation.md` | `completed` |
| Automated | Web, in order: `pnpm --filter web generate-routes`; `pnpm --filter web check:code`; `pnpm --filter web check:types`; `pnpm --filter web test`; then `pnpm --filter web test:coverage`; `pnpm --filter web test:integration`; `pnpm --filter web build` | AC-01, AC-04, AC-05, AC-07, AC-08, AC-09, AC-10 | Web Validation Contract | `./evaluation.md` | `completed` |
| Automated | Root: `pnpm check:architecture`, `pnpm check:test-integrity` | All affected layer and test boundaries | Architecture and Tooling | `./evaluation.md` | `completed` |
| REST client | Identity global-search route example | AC-02, AC-03, AC-05, AC-10 | Controller and `global-search-query-schema.ts` | `apps/server/rest-client/identity/global-search.rest`; record route/schema parity in `./evaluation.md` | `completed` |
| Manual | MV-01 — successful Manager/Operator search and navigation at 1280 × 720 and 320 × 700 | AC-01–AC-06, AC-08–AC-11 | Spec MV-01 | `./evaluation.md`; fresh named screenshots under `apps/web/test-results/` or CI artifacts | `completed` |
| Visual | Desktop Header, 1280 × 720 | AC-01, AC-09 | `design/vCsG7.png` | Independent comparison and fresh Playwright capture path in `./evaluation.md` | `completed` |
| Visual | Grouped desktop results, 1280 × 720 | AC-03, AC-04, AC-09 | `design/sqqJg.png` | Independent comparison and fresh Playwright capture path in `./evaluation.md` | `completed` |
| Visual | Record result row, 1280 × 720 | AC-03, AC-04 | `design/iUxIp.png` | Independent comparison and fresh Playwright capture path in `./evaluation.md` | `completed` |
| Visual | Grouped narrow results, 320 × 700 | AC-07, AC-09 | `design/j9VUB.png` | Independent comparison and fresh Playwright capture path in `./evaluation.md` | `completed` |
| Visual | Loading state, 1280 × 720 | AC-07 | `design/htlE8.png` | `gs-loading` artifact; independent comparison and fresh capture path in `./evaluation.md` | `completed` |
| Visual | No-results state, 1280 × 720 | AC-07 | `design/Ef8y4.png` | `gs-empty` artifact; independent comparison and fresh capture path in `./evaluation.md` | `completed` |
| Visual | Error and retry state, 1280 × 720 | AC-07 | `design/qRMgq.png` | `gs-error` artifact; independent comparison and fresh capture path in `./evaluation.md` | `completed` |
| Visual | Full narrow Header and results, 320 × 700 | AC-01, AC-09 | `design/IzLCK.png` | Independent comparison and fresh Playwright capture path in `./evaluation.md` | `completed` |
| Visual | Keyboard-focused result, 1280 × 720 | AC-08 | `design/w3kxj.png` | `gs-keyboard-focus` artifact; independent comparison and fresh capture path in `./evaluation.md` | `completed` |
| Review | One Implementation Reviewer on the integrated Core, Validation, Server and Web candidate | AC-01–AC-11 | `./spec.md`, `./evaluation.md` | Advisory report; verified findings in `./evaluation.md`; follow-up on current candidate had no P1/P2 findings | `completed` |
| Review | One Visual Reviewer on the integrated UI and all nine reference/capture pairs | Design-backed AC-01, AC-03, AC-04, AC-07, AC-08, AC-09 | `./design/manifest.md` | Advisory report; follow-up on current Header and Operator captures found no actionable findings | `completed` |

## Final handoff condition

Revision 5's implementation and validation handoff was complete, including its 229/229 Web integration result and nine visual comparisons. Revisions 6–10 established and mapped the approved Operator behavior and current test-path classifications. F8–F11, F12 and the final F10 route-test conformance correction are complete. Final revision 12 local evidence is current; PRD requirements remain unchecked because the mapped outcomes are partially delivered. Delivery publication and PR CI remain.
