---
feature: "communication/notification-center"
spec: ./spec.md
plan: ./plan.md
spec_revision: 4
status: ready
updated_at: 2026-09-06
---

# Evaluation

Evaluation of Spec revision `4` against the untouched implementation at kickoff, with a mechanical path-classification correction recorded during F4 conformance, a history-aware back-control correction during closure validation, and a shared back-navigation visual correction.

Current result: `ready`; the Spec is frozen at revision 4, the history-aware back-control and shared visual corrections are implemented and validated, all affected Web gates pass, and fresh visual captures are stored in ignored `apps/web/test-results/communication/` output.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-02`, `EV-03`, `MV-03` | `passed` |
| `CA-02` | `EV-02`, `EV-03`, `MV-03` | `passed` |
| `CA-03` | `EV-02`, `EV-03`, `MV-04` | `passed` |
| `CA-04` | `EV-03`, `MV-03`, `MV-04` | `passed` |
| `CA-05` | `EV-02`, `EV-03`, `MV-03`, `MV-04` | `passed` |
| `CA-06` | `EV-02`, `EV-03`, `MV-02`, `MV-05` | `passed` |
| `CA-07` | `EV-03`, `EV-REST-01`, `EV-REST-02`, `EV-REST-03`, `EV-REST-04`, `MV-05` | `passed` |
| `CA-08` | `EV-03`, `EV-04`, `EV-05`, `MV-01`, `MV-02` | `passed` |
| `CA-09` | `EV-04`, `EV-05`, `VIS-01`, `VIS-17`, `MV-01` | `passed` |
| `CA-10` | `EV-04`, `EV-05`, `VIS-03`–`VIS-08`, `MV-01` | `passed` |
| `CA-11` | `EV-04`, `EV-05`, `VIS-02`, `VIS-09`–`VIS-12`, `VIS-15`–`VIS-16`, `MV-02` | `passed` |
| `CA-12` | `EV-04`, `EV-05`, `VIS-02`, `VIS-13`–`VIS-14`, `VIS-15`–`VIS-16`, `MV-02` | `passed` |
| `CA-13` | `EV-04`, `EV-05`, all visual rows, `MV-01`, `MV-02` | `passed` |
| `CA-14` | `EV-02`, `EV-03`, `MV-03`, `MV-04` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-00` | Cross-layer preflight | `pnpm --filter web check:playwright` | Playwright CLI health passed: 1 test passed; browser, dev-server, page-load, console, network, keyboard, and screenshot checks completed. | `passed` |
| `EV-00-A` | SDD kickoff | Spec/Plan revision freeze and Builder activation | Spec revision 2 set to `in_progress`; Plan set to `in_progress`; Builder Core activated with exact F1 paths, RF/CA scope, Rule Pack, required tree, design references, and exits. Builder Server/Web remain dependency-gated for F2. | `passed` |
| `EV-01` | Cross-layer test integrity | `pnpm check:test-integrity` | Failed only on seven pre-existing unrelated direct-test gaps: six Billing use cases and `packages/core/src/mrp/use-cases/create-product-use-case.ts`; no Communication-center path was reported. Feature-owned changed test paths remain represented in the path sensor and focused suites. | `passed` |
| `EV-02` | Core and Validation | `pnpm --filter @scoops/core test:coverage`; Core/Validation code and type checks | Core coverage passed: 88 files, 222 tests; statements 65.91%, branches 60.73%, functions 70.78%, lines 67.97%. F1 Core/Validation code/types and focused tests also passed. | `passed` |
| `EV-F1-01` | Core and Validation | `pnpm --filter @scoops/core check:code`; `pnpm --filter @scoops/core check:types`; `pnpm --filter @scoops/core test`; `pnpm --filter @scoops/validation check:code`; `pnpm --filter @scoops/validation check:types`; `git diff --check` | Orchestrator independently verified: Core code/types passed; Core test passed with 88 files and 222 tests; Validation code/types passed; diff check passed. | `passed` |
| `EV-03` | Server | `pnpm --filter server test:coverage`; server code/types/build and focused controller, database, messaging, source-transaction suites | Final stale-evidence rerun passed: 90 files, 240 tests; statements 73.26%, branches 54.44%, functions 72.15%, lines 76.57%. Server code/types/architecture/build, Communication list/read/job/outbox, source-controller suites, and migration integration gates passed. | `passed` |
| `EV-04` | Web | `pnpm --filter web test:coverage`; Web code/types and focused widget suites | Web coverage passed: 181 files, 497 tests; statements 59.23%, branches 58.47%, functions 56.12%, lines 60.85%. Web code/types, focused widget tests, and focused Chromium route suite passed after the shared `BackLink` visual correction. | `passed` |
| `EV-F2-WEB-01` | Web transport/context | `pnpm --filter web check:code`; `pnpm --filter web check:types`; `git diff --check` | Orchestrator independently verified code/types and diff checks passed. Code reports four pre-existing `global.css` `!important` warnings; no new warning is attributed to the feature. No dedicated context test exists under the repository test-integrity rules. | `passed` |
| `EV-F2-SERVER-01` | Server persistence/fixture | `pnpm --filter server check:code`; `pnpm --filter server check:types`; `pnpm --filter server check:architecture`; `pnpm --filter server build`; Identity integration test; Communication fixture PostgreSQL smoke; `git diff --check` | Orchestrator independently verified all server gates passed. Identity integration passed with 2 tests; Communication fixture PostgreSQL smoke passed; FND-001 is resolved. Direct repository tests were omitted under the Database Layer Rule; migration generation remains an Orchestrator handoff. | `passed` |
| `EV-F3-SERVER-01` | Server runtime/source/messaging/REST | Server code/types/architecture/build; Communication job/outbox tests; MRP/PDV/Identity controller/source suites; REST artifact inspection | Builder Server and Orchestrator independently verified Server code/types/architecture/build and diff checks. Focused source suites passed: MRP 5/5, 4/4, 9/9, 2/2; PDV 12/12, 4/4; Identity 3/3, 7/7, 1/1. Communication job/outbox tests passed (6). Communication controller fixture tests remain covered by the integrated migration/runtime stage. | `passed` |
| `EV-05` | Web browser integration | `pnpm --filter web exec playwright test tests/routes/communication/notifications.index.test.tsx --project=chromium --workers=1` | Focused Chromium route suite passed: 6 tests. The suite verifies the shared purple borderless back link, previous-page navigation, home fallback, and no captured console/request failures. | `passed` |
| `EV-05-A` | Web browser integration | `pnpm --filter web exec playwright test tests/routes --workers=1` | CI-equivalent route gate passed: 200 tests. The one stale MRP back-link assertion was corrected through the Web Builder before this run; expected route-boundary console diagnostics remained confined to tests intentionally exercising invalid/error states. | `passed` |
| `EV-F3-WEB-01` | Web F3 handoff | Focused Vitest; Web code/types; Playwright health; fresh state screenshots | Orchestrator verified the focused page tests (2 files/6 tests), Web code/types, and the 6-test focused Chromium route suite after the history-aware Button back-control correction. Four pre-existing global CSS `!important` warnings remain classified; all required populated/state screenshots are present. | `passed` |
| `EV-06` | Cross-layer path conformance | `pnpm check:spec-implementation -- documentation/features/communication/notification-center/spec.md` | Passed against `main` baseline at Spec revision 4: 147 contracted paths; all Create/Modify/Generate classifications satisfied. Unrelated changed paths (247) were ignored by the sensor. | `passed` |
| `EV-07` | Database/migration | `pnpm --filter server db:migration:generate --name notification-center`; migration review and safe apply | Generated `0021_notification-center.sql`, snapshot, and journal entry from the shared schema; normalized generated metadata formatting; applied successfully to local PostgreSQL with Drizzle. | `passed` |
| `EV-REST-01` | REST client | `apps/server/rest-client/communication/notifications.rest` compared with `GET /notifications`, `PATCH /notifications/read`, and shared schemas | Created route-complete examples for default, bounded, cursor, all-period, valid, and empty read requests; paths and bodies match the implemented controllers and schemas. | `passed` |
| `EV-REST-02` | REST client | `apps/server/rest-client/mrp/products.rest` compared with changed product/brand/adjustment/production routes | Existing artifact reviewed; product registration, brand, adjustment, and production examples remain route- and body-parity compliant. | `passed` |
| `EV-REST-03` | REST client | `apps/server/rest-client/pdv/orders.rest` compared with changed order registration/cancellation routes | Existing artifact reviewed; order registration and cancellation examples include the current route contracts and failure variants. | `passed` |
| `EV-REST-04` | REST client | `apps/server/rest-client/identity/users.rest` compared with changed invitation/profile/status routes | Existing artifact reviewed; invitation, profile, and status examples match the changed source routes. | `passed` |
| `EV-08` | Runtime | Real source mutation through outbox to Communication materialization, including retry/idempotency | Fresh authenticated server replay covered product registration, stock transition to zero, recovery, and later downward re-entry; published outbox rows were consumed by Inngest and materialized scoped rows for both seeded recipients. Identity profile/inactivate/reactivate transitions also published and materialized enriched rows. Focused job/outbox tests cover duplicate source IDs and dependency failure propagation. | `passed` |
| `EV-09` | Runtime | Real authenticated list/read HTTP with private tenant/user predicates and persisted `readAt` | Fresh Manager sign-in returned 20 notifications with a next cursor and unread count; mixed owned/foreign PATCH returned only the owned ID, unauthenticated GET returned 401, invalid limit returned 422, and persisted reads were verified. Controller/integration suites cover second-tenant predicates. | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Authenticated Manager/Operator Header dropdown at `1560 × 1020` and `390 × 844`: open, inspect newest three, exercise visibility reads, close by button/Escape/outside/footer, retry lifecycle, and verify focus/navigation | `CA-08`–`CA-10`, `CA-13` | Focused Chromium and widget suites passed Manager/Operator behavior, visibility batching, lifecycle states, dismissal/focus/footer paths, and narrow bounding-box assertions. Fresh desktop and narrow captures show the panel fully contained within the viewport after the responsive correction. | `passed` |
| `MV-02` | Authenticated `/notifications` at `1560 × 1020` and `390 × 844`: inspect default period/date groups, change 7/30/90/all, load more, retry, and visibility reads | `CA-06`, `CA-08`, `CA-11`–`CA-13` | Focused Chromium route suite passed period URL/bounds, cursor append, lifecycle/retry, keyboard, console/network, and narrow overflow checks. Seeded real history now spans four September dates and 22 rows per account; fresh populated page and lifecycle captures match the approved shell and local-date grouping. | `passed` |
| `MV-03` | Real stock registration/mutation/production/PDV transition sequence with rollback and persisted balance/ledger/outbox inspection | `CA-01`, `CA-02`, `CA-04`, `CA-05`, `CA-14` | Real API replay registered a product, crossed below-ideal, crossed to zero, recovered, and re-entered below-ideal; persisted outbox rows were published and Communication rows were materialized for both recipients. Real PostgreSQL-backed MRP/PDV source/controller suites additionally passed production, sale, cancellation rollback, by-brand, and suppression cases; no mocked transport is presented as server evidence. | `passed` |
| `MV-04` | Real Identity acceptance/profile/status transitions with Manager/Operator audience and inactive-target/reactivation checks | `CA-03`–`CA-05`, `CA-14` | Real authenticated Manager API replay changed the Operator profile, inactivated the target, and reactivated it; each enriched event published and materialized recipient snapshots for the Manager and affected user. Real PostgreSQL-backed Identity suites cover invitation acceptance, inactive-target access, reactivation, and excluded transitions. | `passed` |
| `MV-05` | Real Manager/Operator, same-establishment second user, and second-tenant list/read requests with mixed IDs plus representative `401`/`422` requests | `CA-06`, `CA-07` | Real Manager and Operator list/read replays returned only account-derived rows; mixed owned/foreign IDs changed only the owned row; representative 401/422 responses matched the contract. Real PostgreSQL-backed Communication controller/integration suites cover same-establishment and second-tenant predicates, duplicate/idempotent reads, and persisted foreign-row neutrality. | `passed` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | Populated notification dropdown | `1560 × 1020` | `documentation/features/communication/notification-center/design/n5xnGg.png` | `apps/web/test-results/communication/notification-center-dropdown-populated.png` | Fresh capture matches the anchored panel, hierarchy, scoped rows, close control, footer, and design-token treatment; date headings intentionally follow the approved Spec divergence. | `passed` |
| `VIS-02` | Populated notifications page, default period | `1560 × 1020` | `documentation/features/communication/notification-center/design/K3Vu9o.png` | `apps/web/test-results/communication/notification-center-page-populated.png` | Fresh standalone capture matches the authenticated shell, borderless purple history-aware `BackLink`, hierarchy, 30-day control, browser-local date sections, rows, and card geometry. | `passed` |
| `VIS-03` | Dropdown loading | `1560 × 1020` | Manifest accepted assumption: `VA-DROPDOWN-LOADING` | Widget state tests plus focused route lifecycle evidence | Loading skeleton, named dismissal, and footer remain operable and token-aligned; route suite and direct widget tests passed. | `passed` |
| `VIS-04` | Dropdown loading | `390 × 844` | Manifest accepted assumption: `VA-DROPDOWN-LOADING` | Responsive widget assertions plus `notification-center-dropdown-populated-narrow.png` | Narrow containment and gutters use the corrected viewport-bounded panel rules; bounding-box assertions pass. | `passed` |
| `VIS-05` | Dropdown empty | `1560 × 1020` | Manifest accepted assumption: `VA-DROPDOWN-EMPTY` | Widget state tests plus focused route lifecycle evidence | Empty copy, footer navigation, and dismissal semantics passed direct widget and route assertions. | `passed` |
| `VIS-06` | Dropdown empty | `390 × 844` | Manifest accepted assumption: `VA-DROPDOWN-EMPTY` | Responsive widget assertions plus focused route suite | Narrow empty layout shares the corrected viewport-bounded panel containment and has no overflow. | `passed` |
| `VIS-07` | Dropdown error/retry | `1560 × 1020` | Manifest accepted assumption: `VA-DROPDOWN-ERROR` | Widget state tests plus focused route lifecycle evidence | Semantic error, retry, dismissal, and footer controls passed direct widget assertions. | `passed` |
| `VIS-08` | Dropdown error/retry | `390 × 844` | Manifest accepted assumption: `VA-DROPDOWN-ERROR` | Responsive widget assertions plus focused route suite | Narrow recovery remains contained and keyboard-operable under the corrected panel rules. | `passed` |
| `VIS-09` | Notifications page loading | `1560 × 1020` | Manifest accepted assumption: `VA-PAGE-LOADING` | `apps/web/test-results/communication/notification-center-loading.png` | Fresh capture preserves page/filter geometry and bounded skeleton rows; comparison is consistent with the approved page shell. | `passed` |
| `VIS-10` | Notifications page loading | `390 × 844` | Manifest accepted assumption: `VA-PAGE-LOADING` | Responsive page assertions plus focused route suite | Stacked controls, card containment, and no horizontal overflow passed the narrow route check. | `passed` |
| `VIS-11` | Notifications page with no history | `1560 × 1020` | Manifest accepted assumption: `VA-PAGE-EMPTY` | `apps/web/test-results/communication/notification-center-empty.png` | Fresh capture shows the distinct no-history state without unrelated CTA and preserves the page hierarchy. | `passed` |
| `VIS-12` | Notifications page with no history | `390 × 844` | Manifest accepted assumption: `VA-PAGE-EMPTY` | Responsive page assertions plus focused route suite | Narrow readability and containment passed the route suite’s viewport check. | `passed` |
| `VIS-13` | Notifications page filtered empty | `1560 × 1020` | Manifest accepted assumption: `VA-PAGE-FILTERED-EMPTY` | Page widget tests and focused route lifecycle evidence | Filtered-empty explanation and recovery/reset semantics passed the direct page-widget assertions. | `passed` |
| `VIS-14` | Notifications page filtered empty | `390 × 844` | Manifest accepted assumption: `VA-PAGE-FILTERED-EMPTY` | Responsive page assertions plus focused route suite | Narrow filtered-empty layout uses the same stacked controls and accessible reset path validated in the route suite. | `passed` |
| `VIS-15` | Notifications page error/retry | `1560 × 1020` | Manifest accepted assumption: `VA-PAGE-ERROR` | `apps/web/test-results/communication/notification-center-error-retry.png` | Fresh capture matches semantic alert, preserved page/filter geometry, and retry control. | `passed` |
| `VIS-16` | Notifications page error/retry | `390 × 844` | Manifest accepted assumption: `VA-PAGE-ERROR` | Responsive page assertions plus focused route suite | Narrow recovery and no-overflow behavior passed the route suite. | `passed` |
| `VIS-17` | Populated notification dropdown narrow containment | `390 × 844` | Manifest supplemental coverage: `VA-DROPDOWN-NARROW` | `apps/web/test-results/communication/notification-center-dropdown-populated-narrow.png` | Fresh narrow capture shows the populated dropdown fully inside the viewport with bounded gutters and accessible focus controls. | `passed` |
| `VIS-18` | Populated notifications page narrow containment | `390 × 844` | Manifest supplemental coverage: `VA-PAGE-NARROW` | `apps/web/test-results/communication/notification-center-populated-narrow.png` | Fresh narrow capture shows stacked controls, full-width card, date groups, rows, and no horizontal overflow. | `passed` |

## PRD implementation traceability

The following disposition maps each scoped source requirement through the current Spec
requirements and acceptance criteria to the evidence above. Only fully delivered requirements
receive an Implemented checkbox in the authoritative PRD; partial and deferred requirements
remain unchecked.

| PRD requirement | Spec RF coverage | Acceptance/evidence | Final disposition | PRD checkbox |
| --- | --- | --- | --- | --- |
| Communication REQ-01 | `RF-03`, `RF-04` | `CA-04`–`CA-05`, `MV-03`–`MV-04` | Partial: scoped recipient matrices and retained snapshots are delivered; all channel/message types remain broader product scope. | Unchecked |
| Communication REQ-02 | `RF-03`–`RF-05` | `CA-01`–`CA-02`, `CA-04`–`CA-05`, `MV-03` | Fully delivered for stock-below-ideal and zero-stock in-product messages. | Checked |
| Communication REQ-03 | — | — | Deferred: Billing notifications are explicitly out of scope. | Unchecked |
| Communication REQ-04 | `RF-02`–`RF-04` | `CA-03`–`CA-05`, `CA-14`, `MV-04` | Partial: scoped Identity in-product facts are delivered; email-only and other Identity communications remain separate work. | Unchecked |
| Communication REQ-05 | `RF-04` | `CA-05`, `CA-09`–`CA-13`, visual evidence | Partial: Brazilian Portuguese in-product content is delivered; email content remains separate work. | Unchecked |
| Communication REQ-06 | `RF-06`, `RF-08`, `RF-10`–`RF-12` | `CA-06`, `CA-08`–`CA-13`, `MV-01`–`MV-02` | Fully delivered for the authenticated Header dropdown and permanent notification center. | Checked |
| Communication REQ-07 | `RF-07`, `RF-09`, `RF-12` | `CA-08`–`CA-09`, `CA-13`, `MV-01`–`MV-02` | Fully delivered for thresholded automatic per-user read state. | Checked |
| Communication REQ-08 | `RF-02`, `RF-05` | `CA-01`, `CA-03`–`CA-04`, `EV-03`, `MV-03`–`MV-04` | Partial: transactional initiation and durable continuation are delivered for scoped source facts; Billing and other communication obligations remain separate work. | Unchecked |
| Communication REQ-09 | `RF-04`–`RF-06`, `RF-10`–`RF-11` | `CA-05`–`CA-06`, `CA-10`–`CA-12`, `MV-01`–`MV-02` | Fully delivered for immutable, permanent, context-rich in-product notifications. | Checked |
| MRP REQ-03 | `RF-01`–`RF-02` | `CA-01`–`CA-02`, `MV-03` | Partial: authoritative threshold transition facts are delivered; the complete inventory-control requirement remains broader MRP scope. | Unchecked |
| Identity REQ-05 | `RF-02`–`RF-04` | `CA-03`–`CA-05`, `CA-14`, `MV-04` | Partial: post-acceptance in-product delivery is delivered; invitation communication remains email-only. | Unchecked |
| Identity REQ-07 | `RF-02`–`RF-04` | `CA-03`–`CA-05`, `CA-14`, `MV-04` | Partial: committed promotion/demotion facts and in-product delivery are delivered; the complete Identity capability remains broader scope. | Unchecked |
| Identity REQ-08 | `RF-02`–`RF-04` | `CA-03`–`CA-05`, `CA-14`, `MV-04` | Partial: committed inactivation/reactivation facts, inactive-target retention, and in-product delivery are delivered; the complete Identity capability remains broader scope. | Unchecked |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| SDD | `documentation/sdd.md` | `passed` | Plan-backed workflow selected from current Plan revision 4; Evaluation uses the canonical structure. |
| Modules | `documentation/modules.md` | `passed` | Communication owns notification policy/history; MRP/Identity/PDV own source facts; Composition owns the audience bridge. |
| Architecture | `documentation/architecture.md` | `passed` | Modular monolith, Core contracts, transactional outbox, REST, and Web boundaries confirmed at kickoff. |
| Dynamic Rule router | `documentation/rules.md` | `passed` | Selected Rule Pack is recorded in the Spec and task cards. |
| Core/use-case Rules | `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md` | `passed` | Core contracts, use-case ownership, deterministic time, direct tests, and infrastructure-free checks passed. |
| Validation Rules | `documentation/rules/validation-package-rules.md` | `passed` | Strict transport schemas, root exports, and boundary ownership passed code/types and event-validation checks. |
| Server/Database Rules | `documentation/rules/server-app-layer-rules.md`; `documentation/rules/database-layer-rules.md` | `passed` | Module ownership, tokenized persistence, migration review/application, seed boundaries, and composition wiring passed. |
| REST/Messaging/Provision Rules | `documentation/rules/rest-layer-rules.md`; `documentation/rules/messaging-layer-rules.md`; `documentation/rules/provision-layer-rules.md` | `passed` | Route ownership, typed events, transaction-bound publication, and Composition-only cross-module adaptation passed static, focused, and runtime gates. |
| Controller/Widget test Rules | `documentation/rules/controllers-testing-rules.md`; `documentation/rules/widget-testing-rules.md` | `passed` | Direct controller/widget behavior and required hook coverage passed focused suites and route evidence. |
| Web routing/UI/code Rules | `documentation/rules/web-app-routing-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/code-conventions-rules.md` | `passed` | Generated routing, widget boundaries, accessible states, pt-BR labels, responsive behavior, and conventions passed. |
| Design | `documentation/design.md`; `design/manifest.md`; saved PNG references | `passed` | Manifest inventory and accepted supplemental state decisions exist; fresh desktop/narrow screenshots were captured and inspected against the saved references. |
| Tooling | `documentation/tooling.md` | `passed` | pnpm workspace checks, Playwright health/focused route suite, Docker health, migration application, seed, and real server/Inngest runtime commands were verified. |
| Repository instructions | `AGENTS.md` | `passed` | Playwright CLI is the required browser path; no browser-use/CDP workflow selected. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | implementation handoff | F1 Builder Core report and current Core interface change | `EV-03` | `resolved` | F2 Server added `DrizzleUsersRepository.findManyActiveByEstablishment`; the Orchestrator independently verified Server code/types/architecture/build and the focused Identity/Communication fixture checks. This was an expected cross-layer dependency, not a Spec ambiguity. |
| `FND-002` | browser validation | Orchestrator reproduction of F3 Web handoff | `EV-05`, `MV-01`, `VIS-01`, `VIS-17` | `resolved` | Web Builder added nearest-scroll-container visibility evaluation with scroll/resize checks and IntersectionObserver deduplication, and tightened cursor-request evidence. Orchestrator reran the focused Chromium suite: 5 passed; the read batch and cursor request were both observed. |
| `FND-003` | product correction | User feedback on notifications page back navigation | `EV-05`, `MV-02`, `VIS-02` | `resolved` | The page now calls the shared router history back action when history exists and retains the authenticated home route as the link fallback. The focused page tests, Web coverage, and 6-test Chromium route suite passed. |
| `FND-004` | final Web coverage | `pnpm --filter web test:coverage` on the revision-3 candidate | `EV-04`, `EV-05`, `MV-01`, `MV-02`, `VIS-01`–`VIS-18` | `resolved` | Isolated component tests now mock the shared router-backed `BackLink` boundary; Web coverage passed with 181 files and 497 tests. Fresh visual and focused Chromium evidence was regenerated. |
| `FND-005` | visual consistency | User feedback on page-level back-button styling | `EV-04`, `EV-05`, `EV-05-A`, `VIS-02` | `resolved` | The shared `BackLink` now owns the compact borderless transparent treatment with a purple `chevron-left` and label. Notifications, Combo Discounts, and order-not-found recovery use the shared component; the stale MRP consumer assertion was updated through the Web Builder, focused tests and the full 200-test Chromium route gate passed. |

## Lessons learned

- `FND-001` exposed a cross-module audience lookup dependency. The existing
  [`documentation/modules.md`](../../../modules.md) and [`documentation/architecture.md`](../../../architecture.md)
  already require Communication policy to remain separate from Identity ownership and Composition
  to bridge modules, so no durable documentation change was warranted.
- `FND-002` exposed a feature-local browser visibility/read-batching assertion gap. The existing
  [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md),
  [`documentation/rules/web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md), and
  [`documentation/design.md`](../../../design.md) already require behavior-first widget and
  responsive validation, so no durable documentation change was warranted.
- `FND-003` clarified that a page-level back control should preserve browser history when the
  destination is contextual. No durable documentation change was warranted because the existing
  routing rules already support `router.history.back()` with a safe fallback; this is recorded as
  feature-specific behavior in Spec revision 3.
- `FND-004` exposed a component-test boundary that renders router-backed navigation without its
  application router wrapper. The existing [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md)
  already requires mocking application wrappers or providing the owning router boundary, so no
  durable documentation change is warranted; the implementation correction remains feature-local.
- `FND-005` clarified that page-level back controls should share one compact visual treatment. The
  reusable guidance is recorded in [`documentation/design.md`](../../../design.md); no global
  routing or testing-rule change was warranted.

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked by CI; it
is not SDD current-commit metadata. Retain failed and superseded-head runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `CI-01` | `<applicable workflow>` | `<sha>` | `pending` | `<run URL when available>` |

## History

| Date/Time | Event |
| --- | --- |
| `2026-09-05` | Evaluation created for Spec revision 1. Playwright health preflight passed. Spec/Plan revision frozen at 1; Builder Core `01a07414-5c79-7721-bf32-041d60f66bb4` activated for F1-T1/F1-T2. Baseline conformance found no existing notification-center implementation tree, no Communication REST artifact, and no feature evaluation evidence; design manifest and saved references are present. |
| `2026-09-05` | Spec revised from 1 to 2 for mechanical baseline conformance: the already-tracked server Communication fixture is `Modify`, and the newly introduced outbox event-validation registry is `Create`. Product behavior and implementation contracts were unchanged; Plan/Evaluation metadata now track revision 2. |
| `2026-09-05` | F1 Builder Core handoff independently verified. Core code/types/tests and Validation code/types passed; F1 completed. Downstream Server type compatibility requires the additive active-audience repository method and is assigned to F2 Server. |
| `2026-09-05` | F2 activation recorded. Builder Server `01a07424-a91e-7f71-8161-9828e05e82c5` owns F2-T1 persistence/fixture foundations plus the Identity active-audience repository method; Builder Web `01a07424-b27f-75a2-b4de-105a892add34` owns F2-T2 REST transport/context. Their exact paths, RF/CA scope, Rules, and exits were supplied before implementation. |
| `2026-09-05` | F2-T2 Web handoff independently verified. REST transport/context code and types passed; four pre-existing global CSS warnings were classified and no dedicated context test was required by repository test-integrity rules. F2-T2 completed. |
| `2026-09-05` | F2-T1 Server handoff independently verified. Server code/types/architecture/build passed; Identity integration passed with 2 tests; Communication fixture PostgreSQL smoke passed; `DrizzleUsersRepository.findManyActiveByEstablishment` resolved FND-001; migration generation remains an Orchestrator handoff. |
| `2026-09-05` | F2 completed. The same Server and Web Builders were reused and activated for F3-T1 and F3-T2 with exact ownership paths, RF/CA scope, Rules, and exits supplied before implementation. |
| `2026-09-05` | F3-T1 Server handoff independently verified from the Builder report. Server code/types/architecture/build, Communication job/outbox tests, and PostgreSQL-backed MRP/PDV/Identity source/controller suites passed. Communication fixture controller tests and root Inngest registration remain Orchestrator-owned integration work. |
| `2026-09-05` | F3-T2 Web handoff independently reproduced. Focused Vitest (8 files, 16 tests), Web code/types, and Playwright health passed; focused route suite was 3 passed/2 failed because read batching emitted no PATCH and the cursor assertion selected an invalidation refetch. FND-002 opened; the same Web Builder was resumed for correction. |
| `2026-09-05` | F3-T2 correction independently verified. Web focused Vitest passed (7 files, 13 tests); Web code/types passed with only four pre-existing global CSS warnings; focused Chromium route suite passed 5/5. FND-002 resolved; populated desktop/narrow screenshots and loading/empty/error screenshots are present. F4 integration opened. |
| `2026-09-05` | F4 integration completed. Root module wiring, generated route tree, Playwright fixture registration, migration generation/application, REST artifact parity, final Server coverage (90 files/240 tests), focused Chromium route suite (5/5), and Spec path conformance passed. |
| `2026-09-05` | Runtime replay completed on the configured Inngest discovery port. A real authenticated product registration published a stock-alert event; Inngest consumed it and materialized deduplicated notifications for both seeded active recipients. Authenticated list/read smoke persisted `readAt` only for owned rows. |
| `2026-09-05` | Fresh visual evidence captured and inspected at `1560×1020` and `390×844`; populated dropdown/page, loading, empty, and error/retry states align with the saved references and accepted manifest assumptions. |
| `2026-09-05` | Implementation Reviewer pass found and routed Core boundary/content, root command, job-test, Web lifecycle/containment, dropdown visual, and seed fixture issues. All findings were corrected by the owning Builders or reconciled in the Evaluation evidence ledger; refreshed coverage and root gates passed. |
| `2026-09-05` | Final reviewer confirmation cycle: Web narrow containment assertion and screenshot passed; September seed dates and complete zero-stock snapshots passed; Operator focused route rerun passed 1/1; real stock/Identity/list-read runtime evidence was recorded. |
| `2026-09-05` | Final read-only Implementation Reviewer confirmation completed after tracking all seven required PNG artifacts. Structural conformance, visual evidence readability, runtime evidence scope, and all prior corrections passed; no remaining findings. |
| `2026-09-06` | Final local closure preflight passed on the revision-2 candidate: Spec conformance (147 paths), diff check, root code/types/architecture, Core coverage (88 files/222 tests), Server coverage (90 files/240 tests), Web coverage (181 files/495 tests), Server/Web builds, and focused Chromium route integration (5/5). Test-integrity remains limited to the seven documented unrelated baseline gaps. |
| `2026-09-06` | Spec revision 3 applied from explicit product feedback: the notifications page back control now returns through browser history when available and falls back to `/`, using the shared `Button` + `arrow-left` pattern. Page tests (2 files/6 tests), Web coverage (181 files/497 tests), Web code/types, and focused Chromium route integration (6/6) passed. |
| `2026-09-06` | Reconciled the SDD evidence location after validation: fresh visual captures are retained in ignored `apps/web/test-results/communication/` output and referenced by the Evaluation ledger; feature-local `evidence/` is excluded from the delivery candidate. |
| `2026-09-06` | Spec revision 4 applied from explicit visual feedback: page-level back controls now use the shared borderless purple `BackLink` treatment with `chevron-left`; Notifications, Combo Discounts, and order-not-found recovery were aligned. Web coverage (181 files/497 tests), focused widget tests (4 files/9 tests), detector, fresh populated-page screenshot, and focused Chromium route suite (6/6) passed. |
| `2026-09-06` | Final local closure preflight passed on the revision-4 candidate: path conformance (147 contracted paths), root code/types/architecture, Server coverage (90 files/240 tests), Web coverage (181 files/497 tests), Server/Web builds, exact focused Chromium notification route (6/6), and the CI-equivalent Web route gate (200/200). Test-integrity remains limited to the seven documented unrelated baseline gaps; legacy feature-local `evidence/` PNGs remain excluded from the delivery candidate. |
