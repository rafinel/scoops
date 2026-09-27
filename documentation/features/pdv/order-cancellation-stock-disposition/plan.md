---
title: Destino do estoque por linha no cancelamento de pedido — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 1
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/45
updated_at: 2026-09-27
---

# Execution status

- **Spec:** [`./spec.md`](./spec.md), revision 1, `in_progress`.
- **Rationale:** The Contract crosses Core/Validation, Server persistence and REST, and Web UI; it includes a generated database migration, transaction and authorization risk, design references, and real authenticated runtime validation.
- **Current phase:** F3-T7 — `in_progress`; user authorized fixing all three complexity failures.
- **Next action:** Commit the validated F3-T7 corrections and closure ledger, update PR #46, and wait for Core, Server, Web and Validation checks on its new head. Keep the Spec in progress until all applicable checks pass.
- **Active blockers:** Current-head PR CI is pending. The same independent Implementation Reviewer completed with no findings (EV-73). The final serial Web integration run passed 222/223; its only unrelated Sales Channels validation failure passed twice in focused reruns (EV-70). Migration 0027 remains applied.
- **Builders:** `builder_core` completed F1 including FND-07. `builder_server` completed F2-T1 and its FND-08 correction. `builder_web` completed F2-T2, including the FND-10 browser fixture correction; real HTTP/PostgreSQL and visual exits are recorded in Evaluation.
- **Coordination:** Builder Core owns the tightly coupled Core and small Validation changes. Builder Server and Builder Web start after F1 and run in parallel. The Orchestrator owns generated migration artifacts, the integrated path sensor, Evaluation, final integration, and coordination of one Implementation Reviewer.
- **Status handling:** Keep F3 `in_progress` while integrated validation and review are active. Keep failed or corrective work `in_progress` with its finding and next action; after a contracted-path correction, mark prior path-conformance evidence stale and rerun the sensor before invalidated sensors or the same Reviewer resume.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core and Validation contracts | — | — | `complete` | Focused Core/Validation exits pass and the integrated Spec path sensor reports every contracted path changed. |
| 2 | `Builder Server` | F2 | Server persistence and REST integration | F1 | `Builder Web` | `complete` | Controller integration covers the current HTTP contract and persisted outcomes after F3-T1 applies the migration; `orders.rest` has complete route parity. |
| 2 | `Builder Web` | F2 | Web cancellation and order history | F1 | `Builder Server` | `complete` | Widget suites and fresh visual captures pass; EV-43 verifies the real server-backed request and persisted outcomes. |
| 3 | `Orchestrator` | F3 | Generate and apply the migration | F2-T1 model checkpoint and F2-T1/F2-T2 source handoffs | — | `complete` | The next journal index is confirmed, generated SQL and metadata match the Spec, and the migration applies to local PostgreSQL. |
| 3 | `Orchestrator` | F3 | Integrated validation and review | F3-T1 plus F2 implementation diffs | `Builder Fix product test`, `Builder Fix confirmation test` | `complete` | EV-47–EV-49 pass and the same Implementation Reviewer resumed on the corrected candidate with no findings or blockers. |
| 4 | `Builder Fix` (`builder_fix_product_registration_test`) | F3-T2 | Align product-registration test heading assertion | FND-04 reopened | `builder_fix_order_confirmation_test` | `complete` | EV-47/EV-48: focused test and full Web coverage pass; no product UI changes. |
| 4 | `Builder Fix` (`builder_fix_order_confirmation_test`) | F3-T2 | Provide the application Anchor boundary in the test | FND-04 reopened | `builder_fix_product_registration_test` | `complete` | EV-47/EV-48: focused test and full Web coverage pass; no product UI changes. |
| 5 | `Builder Fix` (`builder_fix_notifications_pagination`) | F3-T3 | Diagnose notification pagination integration failure | FND-11 reopened | `builder_fix_by_brand_registration_browser` | `complete` | EV-52: pagination passes alone and on 3 repeats; the complete notifications file passes 6/6 on rerun. Transient shell-only rendering failures did not reproduce and diagnostics found no page or console errors; full suite passes in EV-50. |
| 5 | `Builder Fix` (`builder_fix_by_brand_registration_browser`) | F3-T3 | Align by-brand registration browser assertion with current UI | FND-11 reopened | `builder_fix_notifications_pagination` | `complete` | EV-51: Playwright confirmed the current “Estoque” heading; focused by-brand case and full suite pass, with no production UI changes. |
| 6 | `Builder Web` (`builder_web`) | F3-T4 | Match selected border to its background and preserve keyboard focus | FND-12 opened by user screenshot | — | `complete` | EV-53–EV-56 record fresh visual evidence, passing focused/browser checks, static checks, full serial suite, and the same Implementation Reviewer report with no blockers. |
| 7 | `Builder Web` (`builder_web`) | F3-T5 | Match the selected radio indicator to its semantic color | FND-13 opened by user screenshot | — | `complete` | EV-57–EV-58 record fresh inspected screenshots, passing focused color/focus checks, affected static checks, final path sensor, and the same Implementation Reviewer report with no findings. Full serial suite evidence from F3-T4 is retained as accepted non-blocking for this bounded visual-only accent-color change. |
| 8 | `Builder Web` (`builder_web`) | F3-T6 | Refresh affected dialog visual evidence for conclusion | FND-14 | Orchestrator evidence reconciliation | `complete` | Fresh captures at 657 × 894 with one loss selected and 375 × 812 keyboard/error states are inspected; radio colors, border, focus, recovery, console/network and responsive results are recorded in EV-11, EV-13, EV-14 and EV-59. No implementation defect or source edit was needed. |
| 9 | `Builder Core` (`builder_core`) | F3-T7 | Reduce cancellation helper complexity reported by PR CI | FND-15 | `Builder Server` CI attribution | `complete` | EV-63: Core complexity, code, types, architecture and full coverage pass; focused cancellation/restoration tests pass. EV-67 records current Contract path conformance. |
| 9 | `Builder Server` (`builder_server`) | F3-T7 | Refactor complex response and mapper functions | FND-16 | `Builder Core`, `Builder Web` | `complete` | EV-68 and EV-71: Server complexity has zero warnings/errors; code, types, architecture, build, focused controller tests and full coverage pass. Behavior and baseline remain unchanged. |
| 9 | `Builder Web` (`builder_web`) | F3-T7 | Resolve current-main complexity blockers surfaced by Web CI | FND-17 | `Builder Core`, `Builder Server` | `complete` | EV-69–EV-72: Web complexity has zero warnings/errors; types, architecture, code, focused UI tests and fresh responsive screenshots pass; coverage floors remain unchanged. |

#### F3-T7 — Final PR complexity gate correction

- **Status:** `in_progress`; all three complexity failures now pass locally (EV-63, EV-68–EV-71). Core, Server and Web full coverage pass. The same independent reviewer completed with no findings (EV-73); current-head CI on PR #46 is the remaining closure gate.
- **Contract owner:** Builder Core (`builder_core`) owns only `packages/core/src/pdv/use-cases/cancel-order-use-case.ts` and `packages/core/src/mrp/use-cases/restore-order-stock-use-case.ts`. Keep all PRQ/FR/AC outcomes, transaction boundaries, authorization, line identity and excluded-target behavior unchanged.
- **Supporting gate owners:** Builder Server completed the planned repository, DTO and mapper complexity correction within Contract-owned Server paths. Builder Web corrected the current-main stock-control and order-confirmation findings and supporting complex Web components; these changes preserve labels, validation, requests, accessibility and visible behavior. Fresh evidence and exact complexity summaries are in EV-68–EV-72.
- **Prohibited:** Do not edit thresholds or `.code-multivitals-baseline.json`; do not modify any other paths or PRD/Spec behavior. If preserving behavior cannot be verified with current evidence, stop and report.
- **Exits:** Local exact complexity checks, Server build, Core/Server/Web full coverage, code/types/architecture, test-integrity and Spec path sensor pass. The final Web integration result is recorded in EV-70: 222/223 passed, and the one unrelated Sales Channels validation case passed twice on focused reruns; EV-54 retains the earlier full serial 223/223 result. The same Reviewer reports no findings. Run every applicable PR workflow on the updated head before closing F3.

### F1 — Core and Validation contracts

#### F1-T1 — Preserve line disposition through Core and Validation

- **Status/owner:** `complete` — Builder Core (`builder_core`), including FND-07 path-conformance correction
- **Depends/parallel:** No dependencies; no parallel Builder.
- **Paths:**
  - `packages/core/src/pdv/domain/structures/order-line-disposition.ts` (Create)
  - `packages/core/src/pdv/domain/structures/order-stock-restoration.ts`
  - `packages/core/src/pdv/domain/structures/order-cancellation.ts`
  - `packages/core/src/pdv/domain/structures/stock-restoration-target.ts`
  - `packages/core/src/pdv/domain/structures/stock-restoration-request.ts`
  - `packages/core/src/pdv/domain/structures/index.ts`
  - `packages/core/src/pdv/domain/entities/fakers/order-faker.ts`
  - `packages/core/src/mrp/domain/structures/order-stock-restoration-request.ts`
  - `packages/core/src/mrp/domain/structures/order-stock-restoration.ts`
  - `packages/core/src/pdv/use-cases/cancel-order-use-case.ts`
  - `packages/core/src/pdv/use-cases/tests/cancel-order-use-case.test.ts`
  - `packages/core/src/mrp/use-cases/restore-order-stock-use-case.ts`
  - `packages/core/src/mrp/use-cases/tests/restore-order-stock-use-case.test.ts`
  - `packages/core/src/pdv/interfaces/stock-provider.ts`
  - `packages/core/src/pdv/interfaces/pdv-service.ts`
  - `packages/validation/src/pdv/cancel-order-schema.ts`
  - `packages/validation/src/index.ts`
- **Contract:** FR-01–FR-04; AC-01–AC-05 at the Core/Validation boundary.
- **Outcome:** Shared contracts and use cases retain line positions, validate an exact disposition for each order line, delegate only returns to MRP, and preserve loss and legacy outcomes as defined by the Spec.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md`; `documentation/rules/validation-package-rules.md`.
- **Exit:** `pnpm --filter @scoops/core test:coverage`, `pnpm --filter @scoops/validation check:types`, and `pnpm --filter @scoops/validation check:code` pass. Use-case evidence covers defaults, mixed lines and accompaniments, excluded targets, invalid or incomplete choices, authorization and tenant failures, retry/rollback, and concurrent cancellation without infrastructure tests in Core.
- **Correction scope:** Only `packages/core/src/pdv/domain/structures/stock-restoration-request.ts`, `packages/core/src/mrp/use-cases/restore-order-stock-use-case.ts`, `packages/core/src/pdv/interfaces/stock-provider.ts`, and `packages/validation/src/index.ts` may be changed; the focused `restore-order-stock-use-case.test.ts` may be added/updated only if required. No other source, test, migration, Spec, Plan, Evaluation, or PRD paths are authorized. After the Builder handoff, the Orchestrator reruns the relevant focused exits and EV-09 before resuming F3-T2.

### F2 — Server and Web integrations

#### F2-T1 — Persist and expose cancellation outcomes through the Server

- **Status/owner:** `complete` — Builder Server (`builder_server`), including FND-08 correction
- **Depends/parallel:** Depends on F1; parallel with F2-T2. The Orchestrator may start F3-T1 as soon as this task's model-change checkpoint is ready; the Server task remains `in_progress` until its real HTTP/PostgreSQL exit is verified after that migration is applied.
- **Paths:**
  - `apps/server/src/pdv/rest/controllers/cancel-order.controller.ts`
  - `apps/server/src/pdv/rest/controllers/tests/cancel-order.controller.test.ts`
  - `apps/server/src/pdv/rest/dtos/order-response.dto.ts`
  - `apps/server/src/shared/provision/pdv-order-registration/mrp-stock-provider.ts`
  - `apps/server/src/pdv/database/drizzle/models/order-stock-restoration-outcome-model.ts`
  - `apps/server/src/pdv/database/drizzle/models/order-stock-restoration-model.ts`
  - `apps/server/src/pdv/database/drizzle/mappers/drizzle-order-mapper.ts`
  - `apps/server/src/pdv/database/drizzle/repositories/drizzle-orders-repository.ts`
  - `apps/server/rest-client/pdv/orders.rest`
- **Contract:** FR-01, FR-03, FR-04; AC-01, AC-03–AC-06.
- **Outcome:** The authenticated Manager-only cancellation route passes validated choices into Core, commits line-attributed outcomes atomically, and returns preserved snapshots and legacy-compatible results. The existing `orders` REST-client artifact stays complete for its whole route group.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`.
- **Exit:** Compare every `OrdersController` route against `apps/server/rest-client/pdv/orders.rest`; verify one clearly labeled request per route, current methods, paths, parameters, headers and bodies, reusable local variables, and no credentials. Record route/schema parity in `./evaluation.md`. After F3-T1 applies the generated migration, `pnpm --filter server test:coverage` must pass with the controller test exercising the real Nest route, repository, mapper, and PostgreSQL persistence before this task closes. Do not create direct repository, mapper, or provider tests.

#### F2-T2 — Implement accessible cancellation choices and per-line history in Web

- **Status/owner:** `complete` — Builder Web (`builder_web`), including FND-10 correction
- **Depends/parallel:** Depends on F1; parallel with F2-T1.
- **Paths:**
  - `apps/web/src/ui/pdv/hooks/use-cancel-order-action.ts`
  - `apps/web/src/rest/services/pdv-service.ts`
  - `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/index.tsx`
  - `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/use-cancel-order-dialog.ts`
  - `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/tests/cancel-order-dialog.test.tsx`
  - `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/tests/use-cancel-order-dialog.test.ts`
  - `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-items/index.tsx`
  - `apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/order-details-page.test.tsx`
  - `apps/web/tests/pdv/order-page.test.tsx` (supporting Playwright browser contract fixture)
- **Contract:** FR-02, FR-04, FR-05; AC-02, AC-04, AC-06, AC-07.
- **Outcome:** Every line starts with return selected; the form sends one choice per line; retryable failures remain recoverable; canceled details show returned and lost consumption by line, preserve sale facts, and hide skipped outcomes.
- **Rules:** `documentation/design.md`; `documentation/rules/code-conventions-rules.md`; `documentation/rules/ui-layer-rules.md` (including `Antipatterns to Avoid` for user-visible technical values); `documentation/rules/widget-testing-rules.md` (including `Antipatterns to Avoid` for standalone shared/action-hook tests and the widget-suite completion criteria); `documentation/rules/rest-layer-rules.md`; `documentation/rules/validation-package-rules.md`.
- **Exit:** Run `pnpm --filter web test:coverage` and record its full result; pass all Spec-owned dialog, dialog-state-hook, and order-details widget suites, plus Web type/code checks. The two clean-base coverage failures recorded in Evaluation FND-04 were corrected under F3-T2. Compare the implementation tree to the Spec's `OrderDetailsPage` → `CancelOrderDialog`, `OrderItems`, and `OrderSummary` tree. Exercise labeled choices, keyboard focus, narrow layout, pending/error/recovery, and success states. Fresh screenshots for both supplied frames and each scheduled supplemental state are inspected in EV-11–EV-16; EV-43 verifies the real request/response and persisted outcome through MV-01/MV-02. The complete Web Playwright CI suite passes 223/223 in EV-50.
- **Correction scope:** Following EV-37, the same Web Builder owned only `apps/web/tests/pdv/order-page.test.tsx` to align the existing browser fixture and assertions with the Spec API. `pnpm check:test-integrity` passes. The by-brand heading assertion and transient notification pagination findings were resolved/investigated under F3-T3; the complete route suite passes 223/223.

### F3 — Migration, integrated validation, and review

#### F3-T1 — Generate, review, and apply the cancellation migration

- **Status/owner:** `complete` — Orchestrator
- **Depends/parallel:** Depends on the F2-T1 model checkpoint and both F2 Builder source handoffs; runs after the Server and Web implementation wave, per the user-confirmed sequence. The model checkpoint does not close the Server task, whose real HTTP/PostgreSQL evidence follows after migration application.
- **Paths:**
  - `apps/server/src/shared/database/drizzle/migrations/0027_order_cancellation_stock_disposition.sql` (Generate)
  - `apps/server/src/shared/database/drizzle/migrations/meta/0027_snapshot.json` (Generate)
  - `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json` (Generate)
- **Contract:** FR-03, FR-04; AC-03–AC-05.
- **Outcome:** Model-derived migration adds `lost` and nullable historical `line_position`, preserves existing facts, and supports current per-line reads without inferring legacy choices.
- **Rules:** `documentation/rules/database-layer-rules.md`; `documentation/tooling.md`.
- **Exit:** Confirm `0027` is the next journal index, then run `pnpm --filter server db:migration:generate --name order_cancellation_stock_disposition`. Review the generated SQL, snapshot, and journal against the Spec without hand-editing generated output. Apply it with `pnpm --filter server db:migration:apply` against local PostgreSQL and verify legacy rows remain unchanged. If the next index differs, keep this task `in_progress` and return to the Spec amendment workflow.

#### F3-T2 — Validate the integrated candidate and prepare handoff

- **Status/owner:** `complete` — Orchestrator; two bounded Web test corrections and final review complete
- **Depends/parallel:** Depends on F3-T1 and all F1/F2 diffs being available in the integrated candidate. This phase verifies the remaining F2 runtime exits and closes those tasks only after their evidence passes. The Implementation Reviewer starts only after the integrated Spec path sensor passes; it may run alongside integrated workspace sensors.
- **Paths:** `./evaluation.md` (created at implementation kickoff); ephemeral Playwright captures under `apps/web/test-results/` using the evidence targets below. The Orchestrator also updates this Plan's execution state.
- **Contract:** FR-01–FR-05; AC-01–AC-07; MV-01 and MV-02.
- **Outcome:** Current automated, REST parity, migration, real HTTP/PostgreSQL, manual, and visual evidence is recorded; the complete candidate has one read-only Implementation Reviewer report, every verified finding is resolved, and no blocking finding remains.
- **Rules:** `documentation/sdd.md`; `documentation/tooling.md`; `documentation/design.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/widget-testing-rules.md` (including `Antipatterns to Avoid` and widget-suite completion criteria).
- **Exit:** Run `pnpm check:spec-implementation -- documentation/features/pdv/order-cancellation-stock-disposition/spec.md` on the complete candidate before integrated sensors or the Reviewer. Then pass all affected workspace checks and coverage floors, `pnpm check:test-integrity`, and `pnpm check:architecture`; run `pnpm --filter web test:integration`; execute MV-01 and MV-02 against healthy local PostgreSQL, Server, and Web services; inspect real requests, responses, persisted outcomes and stock, URL, console, failed requests, keyboard path, and narrow viewport. Verify Manager/Operator accounts and fixtures before Playwright setup; if seeding is required, run `pnpm --filter server db:seed` explicitly before `pnpm --filter web test:auth:setup`, never implicitly. Stop processes started for validation and leave shared Docker services running. The single Implementation Reviewer inspects all affected surfaces and final visual comparisons and independently replays high-risk Playwright interactions. On discrepancy, record a finding, invalidate affected evidence, and resume the same Builder through `implement-spec` for an in-Contract correction. Mark prior path-conformance evidence stale after any contracted-path correction, rerun the Spec path sensor on the corrected candidate, and only then resume invalidated sensors and the same Reviewer. Verify every review finding and refresh stale evidence before handoff.

#### User-authorized clean-base coverage corrections

| Builder Fix | Exclusive owned path | Baseline failure | Required correction | Exit |
| --- | --- | --- | --- | --- |
| `builder_fix_product_registration_test` | `apps/web/src/ui/mrp/widgets/pages/product-registration-page/tests/product-registration-page.test.tsx` | Assertion expects superseded “Controle de estoque” heading while the current UI renders “Estoque”. | Align the assertion with current existing user-visible copy; do not change product UI or broaden tests. | Focused Vitest run and final Web coverage. |
| `builder_fix_order_confirmation_test` | `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/order-confirmation.test.tsx` | Component test renders `OrderConfirmation` outside Router while its application `Anchor` invokes TanStack `useLinkProps`. | Mock the closest application `Anchor` boundary using its exported props and canonical `ROUTES`; do not mock TanStack Router or change production UI. | Focused Vitest run and final Web coverage. |

These corrections are test-only, outside Spec revision 1's Technical Contract, and user-authorized after clean-base reproduction. They do not amend product behavior or any PRQ/AC. Focused tests, Web code/type/architecture checks, `pnpm check:test-integrity`, full `pnpm --filter web test:coverage`, and the Spec path sensor pass; the same Implementation Reviewer resumed and reported no findings or blockers.

#### F3-T3 — Resolve remaining Web integration failures

- **Status/owner:** `complete` — Orchestrator; both Builder Fix investigations complete and the complete Web integration suite passes
- **Paths:** `apps/web/tests/communication/notifications-page.test.tsx`; `apps/web/tests/mrp/new-product-page.test.tsx`; production paths only if the owning Builder demonstrates that a current user-visible behavior defect, rather than an outdated test expectation or timing issue, causes the failure
- **Contract:** Spec revision 1 remains unchanged; these are user-authorized repository integration-suite corrections outside its behavioral scope
- **Evidence:** EV-38–EV-42 are historical classification only. The latest full suite and any changed-path focused reruns must be recorded in Evaluation before conclusion.
- **Exit:** EV-51 and EV-52 record passing focused browser checks; the repository's complete serial Web CI suite passes 223/223 in EV-50. No Spec-contracted production path changed, so the existing Implementation Reviewer remains current.

#### F3-T4 — Refine selected disposition border and focus appearance

- **Status/owner:** `complete` — Builder Web (`builder_web`), integrated validation by Orchestrator; refreshed after F3-T5 in EV-59
- **Paths:** `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/index.tsx`; `apps/web/tests/pdv/order-page.test.tsx` for a focused semantic border/focus regression assertion and fresh screenshots; `./evaluation.md` and this Plan
- **Contract:** Spec revision 1; AC-02 and AC-07; preserve one accessible return/loss selection per order line and visible keyboard focus. PRD behavior and cancellation outcomes do not change.
- **Design reference:** User-provided selected-choice screenshot. On pointer selection the choice border must blend into its selected fill; keyboard focus must remain discernible.
- **Exit:** Capture and inspect the selected state at the supplied desktop scale and the narrow viewport. Verify pointer selection uses a fill-matched border with no pointer-only purple ring, keyboard navigation retains visible focus, focused cancellation browser/widget tests pass, complete serial Web CI suite passes, final Spec path sensor passes, and the same Implementation Reviewer resumes without blockers.

#### F3-T5 — Match selected radio indicator to its semantic color

- **Status/owner:** `complete` — Builder Web; integrated validation and Evaluation are recorded in EV-57–EV-59.
- **Paths:** `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/index.tsx`; `apps/web/tests/pdv/order-page.test.tsx`; this Plan and `./evaluation.md`.
- **Contract:** Spec revision 1; AC-02 and AC-07. Selected return and loss controls use the matching semantic green/red hue while retaining a visible keyboard focus ring.
- **Design reference:** User-provided screenshot dated 2026-09-27 showing the purple radio dot on both green and red selected backgrounds.
- **Exit:** Fresh desktop and 375 × 812 screenshots show the radio dot using the corresponding success/danger hue; focused pointer/keyboard browser and dialog widget checks, affected Web static checks, final Spec path sensor, and same Implementation Reviewer pass. The full serial Web suite passed 223/223 after F3-T4 and is not rerun for this bounded accent-color-only refinement.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Complete Spec path conformance, run before integrated sensors and review | All contracted paths | `./spec.md` Technical Contract | `./evaluation.md` EV-09 | `in_progress` |
| Automated | Core cancellation and MRP restoration use cases | AC-01, AC-02, AC-03, AC-05 | Spec Validation Contract | `./evaluation.md` EV-20, EV-43 | `passed` |
| Automated | Validation schema and shared package checks | AC-02, AC-03 | Spec Technical Contract | `./evaluation.md` EV-21–EV-22 | `passed` |
| Automated | Server controller integration, persistence, rollback, and response mapping | AC-01, AC-03–AC-06 | Spec Validation Contract | `./evaluation.md` EV-33, EV-36, EV-43 | `passed` |
| Automated | Web dialog, dialog hook, and order details widget suites | AC-02, AC-04, AC-06, AC-07 | Spec Validation Contract and widget tree | `./evaluation.md` EV-26, EV-43, EV-46 and EV-53–EV-57; visual tree states EV-11–EV-16 | `in_progress` |
| Automated | Affected workspace code/type/architecture checks, test-integrity, focused browser/widget checks, and complete Web browser suite from F3-T4 | FR-01–FR-05 | `documentation/tooling.md` and Spec Validation Contract | `./evaluation.md` EV-10, EV-20–EV-24, EV-36, EV-48–EV-50, EV-54–EV-57 | `accepted_non_blocking` |
| Runtime | Authenticated cancellation and persisted stock/order outcomes against local PostgreSQL | AC-01, AC-03, AC-05, AC-06 | MV-01 and MV-02 | `./evaluation.md` EV-43–EV-45 | `passed` |
| REST client | `apps/server/rest-client/pdv/orders.rest` compared with every `OrdersController` route and shared request schema | AC-02, AC-03 | Spec REST and Validation Contracts | `apps/server/rest-client/pdv/orders.rest` plus EV-44 in `./evaluation.md` | `passed` |
| Manual | MV-01 — Manager choice and order details at 1481 × 1050 and 375 × 812 | AC-02, AC-04, AC-07 | Spec MV-01 | `./evaluation.md` EV-43, EV-12–EV-13 | `passed` |
| Manual | MV-02 — Role/tenant access, excluded target, atomic failure, and retry at 375 × 812 | AC-01, AC-03, AC-06 | Spec MV-02 | `./evaluation.md` EV-43–EV-45 | `passed` |
| Visual | Cancellation confirmation, three lines with one loss selected, 657 × 894 | AC-02, AC-07 | `./design/c52HsC.png` | `apps/web/test-results/order-cancellation-stock-disposition/cancel-dialog-c52HsC-657x894.png`; EV-11 | `passed` |
| Visual | Canceled order details with returned and lost outcomes, 1481 × 1050 | AC-04 | `./design/dPHci.png` | `apps/web/test-results/order-cancellation-stock-disposition/order-details-dPHci-1481x1050.png`; EV-12 | `passed` |
| Visual | Cancellation dialog keyboard/focus state, 375 × 812 | AC-07 | `./design/manifest.md` supplemental recommendation | `apps/web/test-results/order-cancellation-stock-disposition/cancel-dialog-keyboard-375x812.png`; EV-13 | `passed` |
| Visual | Cancellation dialog recoverable submission error, 375 × 812 | AC-06, AC-07 | `./design/manifest.md` supplemental recommendation | `apps/web/test-results/order-cancellation-stock-disposition/cancel-dialog-error-375x812.png`; EV-14 | `passed` |
| Visual | Canceled order details with long names, 375 × 812 | AC-04, AC-07 | `./design/manifest.md` supplemental recommendation | `apps/web/test-results/order-cancellation-stock-disposition/order-details-long-names-375x812.png`; EV-15 | `passed` |
| Visual | Skipped outcome hidden from details after persisted excluded-target result, 375 × 812 | AC-03, AC-04 | `./design/manifest.md` supplemental recommendation | `apps/web/test-results/order-cancellation-stock-disposition/order-details-skipped-hidden-375x812.png`; EV-16 | `passed` |
| Review | One read-only Implementation Reviewer for the integrated candidate and all affected surfaces | FR-01–FR-05, AC-01–AC-07 | Spec, Rule Pack, Design Contract, and current Evaluation | The same Reviewer resumed after F3-T5 implementation, path sensor, refreshed screenshots and focused browser evidence; see EV-58 | `passed` |

**Commands scheduled for integrated evidence:**

- `pnpm --filter @scoops/core check:code`
- `pnpm --filter @scoops/core check:types`
- `pnpm --filter @scoops/core check:architecture`
- `pnpm --filter @scoops/core test:coverage`
- `pnpm --filter @scoops/validation check:code`
- `pnpm --filter @scoops/validation check:types`
- `pnpm --filter @scoops/validation check:architecture`
- `pnpm --filter server check:code`
- `pnpm --filter server check:types`
- `pnpm --filter server check:architecture`
- `pnpm --filter server test:coverage`
- `pnpm --filter server build`
- `pnpm --filter web check:code`
- `pnpm --filter web check:types`
- `pnpm --filter web check:architecture`
- `pnpm --filter web test:coverage`
- `pnpm --filter web test:integration`
- `pnpm --filter web build`
- `pnpm check:test-integrity`
- `pnpm check:architecture`

**Handoff:** Route directly to `conclude-spec` when all phases and tasks are complete; validation evidence is current on the integrated candidate and all affected workspace coverage commands pass without lowering floors; generated migrations are reviewed and applied locally; services and fixtures are restored; MV-01 and MV-02 are evidenced; all six scheduled visual comparisons and the Spec widget-tree comparison are current; transient failures are classified in Evaluation; REST-client parity is verified; the latest Spec path sensor passed after the last contracted-path correction; the same Implementation Reviewer completed on the corrected candidate and all verified findings are resolved; and no configured coverage floor was lowered.
