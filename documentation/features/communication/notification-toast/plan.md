---
title: Realtime in-product notification toast — implementation plan
status: completed
spec: ./spec.md
spec_revision: 7
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/35
updated_at: 2026-09-11
---

# Execution status

- **Spec:** [`spec.md`](./spec.md), revision `7`, `in_progress`.
- **Rationale:** Plan-backed execution is required because this delivery crosses Core, Validation, server persistence/REST, Web provision/UI, a generated PostgreSQL migration, cross-tab concurrency, and complex real-runtime and visual validation.
- **Current phase:** `F7` — Integrated validation and handoff complete for revision 7.
- **Next action:** Route to `conclude-spec` when delivery publication is requested.
- **Active blockers:** None.
- **Active Builders:** None. Builder Web `01a090f2-a632-76d0-9825-c9f7d2735507` completed the direct `AppLayout` composition and wrapper removal; the orchestrator owns final delivery publication.
- **Shared coordination:** The Orchestrator owns `evaluation.md`, generated `0024_notification_realtime.sql` and `_journal.json`, package/lockfile or root configuration changes, transient Playwright evidence, integrated sensors, and final evidence/review. `Builder Server` must hand off migration inputs and must not edit the generated migration artifacts in parallel with the Orchestrator.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core realtime contracts and stream policy | — | — | `completed` | Core interfaces, scoped repository capability, stream use case and infrastructure-free tests satisfy the revision-1 Core contract and Core checks. |
| 2 | `Builder Validation` | F2 | Versioned realtime transport schema | F1 | F3 | `completed` | The strict version-1 event schema is root-exported and passes Validation checks. |
| 2 | `Builder Server` | F3 | Committed-notification database subscription | F1 | F2 | `completed` | Scoped lookup, dedicated process listener, provider binding and listener-registry changes compile and preserve existing outbox behavior. |
| 3 | `Orchestrator` | F4 | Generated transactional notification trigger | F3 | F5 | `completed` | The next custom migration and journal entry exist, contain only the approved trigger/function work, and pass generated-artifact review. |
| 3 | `Builder Web` | F5 | Browser realtime shell and toast experience | F2 | F4 | `completed` | Provision, shell/listener, toast, shared presentation, dropdown integration, layout composition, widget tests and fresh mocked-browser evidence satisfy the UI Contract. |
| 4 | `Builder Server` | F6 | Authenticated SSE route and composition | F2, F3, F4 | F5 | `completed` | SSE framing, auth/isolation/capacity behavior, module wiring, controller integration coverage and route-complete REST examples are ready for integrated validation. |
| 5 | `Orchestrator` | F7 | Integrated validation and handoff | F5, F6 | — | `completed` | Path conformance, package/build/architecture/test-integrity gates, real focused SSE evidence, visual comparisons, one Implementation Reviewer and aggregate coverage are complete with no active feature finding. |

### F1 — Core realtime contracts and stream policy

#### F1-T1 — Add the Core realtime ports, scoped notification lookup contract, and stream use case

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** No dependencies; F2 and F3 wait for the public Core names. All work remains inside Builder Core ownership.
- **Paths:** `packages/core/src/communication/interfaces/notification-realtime-subscriber.ts`; `packages/core/src/communication/interfaces/notification-realtime-provider.ts`; `packages/core/src/communication/interfaces/notifications-repository.ts`; `packages/core/src/communication/interfaces/index.ts`; `packages/core/src/communication/use-cases/stream-notifications-use-case.ts`; `packages/core/src/communication/use-cases/tests/stream-notifications-use-case.test.ts`; `packages/core/src/communication/use-cases/index.ts`.
- **Contract:** Spec `FR-01`, `FR-02`, `FR-07`, `FR-08`; `AC-01`, `AC-02`, `AC-03`, `AC-11`, `AC-12`; Core Technical Contract interfaces and `StreamNotificationsUseCase` tables.
- **Outcome:** Core exposes framework-free subscription/provider contracts, recipient-and-establishment scoped lookup capability, and authorization, current-session, five-connection, bounded-queue, cancellation and cleanup policy through the stream use case.
- **Rules:** [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming, declarations, errors and barrels); [`core-package-rules.md`](../../../rules/core-package-rules.md) (one exported type per file, contracts under interfaces and business rules in use cases); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (one typed infrastructure-free use-case test with mocked contracts, deterministic fixtures and complete behavior coverage). No dedicated `Antipatterns to Avoid` subsection applies.
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, the focused stream use-case test, and `pnpm --filter @scoops/core test:coverage`; verify successful delivery, actor/profile/session/audience rejection, exact tenant/recipient checks, five-stream capacity, FIFO queue/overflow, cancellation, unsubscribe and terminal cleanup without server or browser imports.

### F2 — Versioned realtime transport schema

#### F2-T1 — Add and export the strict notification realtime event schema

- **Status/owner:** `completed` — Builder Validation
- **Depends/parallel:** Depends on F1’s `NotificationKind` and `Notification` field contract; runs in parallel with F3 and blocks F5/F6 transport consumers.
- **Paths:** `packages/validation/src/communication/notification-realtime-event-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** Spec `FR-03`, `FR-08`; `AC-01`, `AC-02`, `AC-06`, `AC-08`; Validation Technical Contract schema table and SSE envelope boundary.
- **Outcome:** `notificationRealtimeEventSchema` validates only the strict version-1 envelope, canonical notification fields, supported Core kind values, bounded nonblank copy and ISO date representations, with an inferred public type from the package root.
- **Rules:** [`validation-package-rules.md`](../../../rules/validation-package-rules.md) (one primary schema per file, Core-derived enum, syntax-only validation, explicit root export and no application imports); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming and explicit exports). No dedicated `Antipatterns to Avoid` subsection applies.
- **Exit:** Run `pnpm --filter @scoops/validation check:code`, `pnpm --filter @scoops/validation check:types`, and the relevant consumer checks; verify accepted version-1 payloads, rejected versions/unknown kinds/malformed dates/blank or overlong fields, nullable read dates, and package-root importability.

### F3 — Committed-notification database subscription

#### F3-T1 — Implement the scoped repository lookup and dedicated PostgreSQL subscriber foundation

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1’s Core ports and repository method; runs in parallel with F2. F4 owns generated migration files, while F6 owns REST/module-root registration.
- **Paths:** `apps/server/src/communication/constants/communication-providers.ts`; `apps/server/src/communication/database/drizzle/repositories/drizzle-notifications-repository.ts`; `apps/server/src/communication/database/drizzle/subscribers/postgres-notification-realtime-subscriber.ts`; `apps/server/src/communication/database/drizzle/subscribers/index.ts`; `apps/server/src/communication/database/communication-database.module.ts`; `apps/server/src/shared/database/drizzle/drizzle-client.ts`.
- **Contract:** Spec `FR-01`, `FR-02`, `FR-08`; `AC-01`, `AC-02`, `AC-03`, `AC-11`, `AC-12`; Database Technical Contract lookup, singleton listener, reconnect, fan-out and shutdown behavior.
- **Outcome:** Communication can resolve a committed notification only when all three scope IDs match, subscribe through one dedicated process-level PostgreSQL listener, fan out complete domain values to active callbacks, reconnect future-only, reject duplicate same-channel registrations, and clean up safely without disturbing the existing outbox listener.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (module-owned persistence, mapper boundary, Core repository implementation, token binding, no repository/adapter test files and shared listener lifecycle); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases, naming, known errors and declarations). No dedicated `Antipatterns to Avoid` subsection applies.
- **Exit:** Run focused Server type/code checks and the available subscriber-consuming checks; inspect listener registration and shutdown paths, verify existing outbox behavior remains intact, and defer database proof to F6’s real controller integration rather than adding repository or adapter tests.

### F4 — Generated transactional notification trigger

#### F4-T1 — Generate, fill and review the trigger-only migration and journal entry

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F3 confirming the listener channel and payload contract; runs in parallel with F5 after F2 is ready. No Builder edits these generated/shared artifacts.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0024_notification_realtime.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`.
- **Contract:** Spec `FR-01`, `FR-02`, `FR-08`; `AC-01`, `AC-02`, `AC-03`, `AC-12`; Database Technical Contract migration/transaction delivery and verified next journal index.
- **Outcome:** Drizzle’s custom generator creates the verified next migration and journal metadata, and the SQL adds only the transactional after-insert `pg_notify('scoops_notifications', ...)` function/trigger with notification, recipient and establishment UUIDs.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (shared migration infrastructure, generated-schema discipline and migration review). No dedicated `Antipatterns to Avoid` subsection applies.
- **Exit:** Run `pnpm --filter server exec drizzle-kit generate --custom --name notification_realtime`; inspect the generated index/journal and confirm no schema snapshot or table alteration was introduced; fill only the approved SQL, verify rollback emits nothing and retain no credentials or message content; record generation and review in `evaluation.md` after implementation kickoff.

### F5 — Browser realtime shell and toast experience

#### F5-T1 — Add the credentialed EventSource client used by the direct notification channel

- **Status/owner:** `completed` — Builder Web (`01a08835-1e4a-7351-b93a-73edf5991d93`)
- **Depends/parallel:** Depends on F2’s schema; runs in parallel with F4 and has no path overlap with Server.
- **Paths:** `apps/web/src/provision/communication/event-source/notification-realtime-client.ts`; `apps/web/src/realtime/communication/channels/notification-channel.ts`.
- **Contract:** Spec `FR-01`, `FR-02`, `FR-07`, `FR-08`; `AC-01`, `AC-02`, `AC-03`, `AC-10`, `AC-11`.
- **Outcome:** The direct Web notification channel owns a browser-safe, credentialed native EventSource, validates the shared envelope, maps ISO dates to domain values, discards invalid/unsupported events, fans out listeners and owns capped retry/cleanup behavior.
- **Rules:** [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md) (Core contract, client-plus-factory boundary, infrastructure-only adapter, consumer-boundary verification and no provider API); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (factory, naming and declarations); [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (application alias and browser-safe boundaries). No dedicated `Antipatterns to Avoid` subsection applies.
- **Exit:** Run Web code/type checks and the NotificationShell consumer tests; verify the URL uses `BROWSER_ENV.scoopsServerRestUrl`, `withCredentials: true`, no token/header exposure, named-event parsing, invalid payload suppression, safe lifecycle callbacks and explicit close/retry behavior. Because this is a browser-behavior boundary, retain the exact Spec channel/widget-tree comparison and inspect console/failed requests in F5-T4’s fresh Playwright evidence.

#### F5-T2 — Implement the authenticated notification shell, election and lifecycle owner

- **Status/owner:** `completed` — Builder Web Context (`01a090de-5810-7a71-9623-a62adb380c1b`); integrated by Orchestrator
- **Depends/parallel:** Depends on F5-T1; sequential within Builder Web. No path overlap with F5-T3 or F5-T4.
- **Paths:** `apps/web/src/ui/communication/contexts/notification-shell-context/index.tsx`; `apps/web/src/ui/communication/contexts/notification-shell-context/types/notification-shell-context-value.ts`; `apps/web/src/ui/communication/contexts/notification-shell-context/use-notification-shell-provider.ts`; `apps/web/src/ui/communication/contexts/notification-shell-context/tests/use-notification-shell-provider.test.ts`; `apps/web/src/ui/communication/hooks/use-notification-shell-context.ts`; `apps/web/src/ui/communication/hooks/use-notification-realtime.ts`; `apps/web/src/ui/shared/widgets/layouts/app-layout/index.tsx`.
- **Contract:** Spec `FR-01`, `FR-02`, `FR-04`, `FR-05`, `FR-07`, `FR-08`; `AC-01`, `AC-03`, `AC-04`, `AC-05`, `AC-10`, `AC-11`.
- **Outcome:** The shell provides typed open/select/dismiss state, Web Locks/BroadcastChannel election with localStorage fallback, one visible-online leader connection, session deduplication, newest-first three-item presentation with FIFO overflow, follower-only invalidation, selected-notification pinning state and full cleanup on identity/lifecycle changes.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (feature boundary, stateful layout hooks, context composition, no focus theft, shared query/toast boundaries and reduced motion); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (owning widget hook tests, complete state/action matrix, typed mocks, accessible assertions and test placement); [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md) (realtime behavior verified through the consumer boundary); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (function declarations and value-before-handler ordering). The UI `Antipatterns to Avoid` subsection prohibits exposing raw technical values in user-visible controls; no new technical values may be rendered.
- **Exit:** Run focused Vitest hook/component coverage and the Web checks; exercise election/fallback, dedup/queue/order, invalid/foreign events, visibility/online/auth transitions, capped `1/2/5/10/30s` retry, cache invalidation before presentation, follower signaling and cleanup. Compare the exact Spec widget tree, exercise keyboard and narrow-viewport behavior where rendered, inspect console and failed requests, and retain fresh Playwright captures for every affected design state in F5-T4/F7 evidence.

#### F5-T3 — Build the typed toast renderer, timer behavior and shared notification presentation

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F5-T1’s channel contract; sequential within Builder Web and may proceed independently of F5-T2’s shell implementation. No path overlap with F5-T2 or F5-T4.
- **Paths:** `apps/web/src/ui/communication/widgets/components/notification-toast/index.tsx`; `apps/web/src/ui/communication/widgets/components/notification-toast/use-notification-toast.ts`; `apps/web/src/ui/communication/widgets/components/notification-toast/tests/notification-toast.test.tsx`; `apps/web/src/ui/communication/widgets/components/notification-toast/tests/use-notification-toast.test.ts`; `apps/web/src/ui/communication/constants/notification-presentation.ts`; `apps/web/src/ui/communication/constants/notification-semantic-styles.ts`; `apps/web/src/ui/communication/constants/index.ts`; `apps/web/src/ui/communication/widgets/components/notification-row/index.tsx`; `apps/web/src/ui/communication/widgets/components/notification-row/tests/notification-row.test.tsx`.
- **Contract:** Spec `FR-03`, `FR-04`, `FR-05`, `FR-06`; `AC-04`, `AC-06`, `AC-07`, `AC-08`, `AC-09`.
- **Outcome:** The toast uses the existing Sonner boundary and design tokens with a typed exhaustive kind-to-icon/tint map shared by rows, clamped pt-BR content, polite full announcement, sibling open/close controls, focus-safe Escape behavior, and exactly 5,000ms active dismissal time paused by hover/focus-within; dismissal never marks read.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (stateful widget hook, shared Sonner/Icon wrappers, pt-BR labels, focus/reduced motion and design tokens); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (owning hook/component boundary, accessible behavior assertions, typed hook mocks, test placement and complete timer/action matrix); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (widget props, function declarations and constants). The UI `Antipatterns to Avoid` subsection prohibits raw technical values in user-visible output; do not add a second Toaster or direct feature Sonner calls.
- **Exit:** Run focused toast/row tests plus Web checks; verify all supported kinds, exact copy/clamps, decorative icons, pt-BR accessible names, active-time pause/resume/timeout/Escape/cleanup and sibling action separation. Compare against [`nfjNn.png`](./design/nfjNn.png), exercise keyboard and narrow viewport, inspect console/failed requests, and capture fresh single, focused, stacked and long-copy screenshots at the manifest viewports.

#### F5-T4 — Integrate dropdown selection, authenticated layout composition and browser route coverage

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F5-T2 and F5-T3; sequential within Builder Web. F6 may not claim integrated server-backed success from this mocked route suite.
- **Paths:** `apps/web/src/ui/communication/widgets/components/notification-dropdown/index.tsx`; `apps/web/src/ui/communication/widgets/components/notification-dropdown/use-notification-dropdown.ts`; `apps/web/src/ui/communication/widgets/components/notification-dropdown/tests/notification-dropdown.test.tsx`; `apps/web/src/ui/communication/widgets/components/notification-dropdown/tests/use-notification-dropdown.test.ts`; `apps/web/src/ui/shared/notifications/index.ts`; `apps/web/src/ui/shared/widgets/layouts/app-layout/index.tsx`; `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx`; `apps/web/src/ui/shared/widgets/layouts/root-layout/index.tsx`; `apps/web/tests/communication/notification-toast.test.tsx`.
- **Contract:** Spec `FR-03`, `FR-05`, `FR-06`, `FR-07`; `AC-05`, `AC-06`, `AC-07`, `AC-08`, `AC-09`, `AC-10`, `AC-11`.
- **Outcome:** Authenticated routes mount exactly one NotificationShell/realtime-hook scope, keep NotificationDropdown in the Header as a context consumer, pin and expose an exact selected notification without duplication, preserve existing loading/error/history/read behavior, configure the existing single Toaster for three visible notifications, and prove mocked arrival, dismissal, selection, reconnect, keyboard and responsive flows.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (layout/widget boundaries, context composition, shared Sonner wrapper, navigation, focus, pt-BR labels, responsive tokens and one Toaster); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (real internal composition, owning hook mocks, dropdown/read state matrix, route integration and accessible assertions); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (transport remains outside widgets); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases, declarations and handler ordering). The UI `Antipatterns to Avoid` subsection prohibits raw technical values; no raw SSE/version values may be exposed to users.
- **Exit:** Run focused widget tests, `pnpm --filter web test:integration -- tests/communication/notification-toast.test.tsx`, Web checks and build; assert final URL, mocked stream/list requests, no read-on-toast, dropdown pin/read lifecycle, protected shell behavior and no duplicate Toaster. Compare the exact Spec widget tree with [`nfjNn.png`](./design/nfjNn.png) and [`n5xnGg.png`](./design/n5xnGg.png), exercise keyboard and `1560 × 1020`/`390 × 844` states, inspect console and failed requests, and capture independent fresh screenshots for single, three-stack, focused, long-copy, semantic and dropdown-selection states.

#### F5-T5 — Move the complete notification realtime transport into the UI hook

- **Status/owner:** `completed` — Builder Web (`01a090dc-0ca4-7bd1-a39e-2623092dd748`); integrated by Orchestrator
- **Depends/parallel:** Depends on F5-T1’s EventSource client and F5-T2’s leader/lifecycle owner; no Server, Core or Validation path overlap.
- **Paths:** `apps/web/src/realtime/communication/channels/notification-channel.ts` (remove); `apps/web/src/ui/communication/hooks/use-notification-realtime.ts`; `apps/web/src/ui/communication/constants/notification-presentation.ts`; `apps/web/src/ui/communication/constants/notification-semantic-styles.ts`; `apps/web/src/ui/communication/constants/index.ts`.
- **Contract:** Architecture-preserving refinement of `FR-01`, `FR-02`, `FR-07`, `FR-08`; `AC-03`, `AC-10`, `AC-11`; Equiny-style shared transport and typed event-channel pattern.
- **Outcome:** `useNotificationRealtime` is the only notification realtime boundary and owns the complete transport lifecycle: one credentialed EventSource in the leader tab, named-event parsing, shared validation, domain mapping, fan-out, retry and cleanup. It accepts only enabled state and a notification callback, exposes no transport controls, and no separate channel file remains. Semantic presentation constants have one primary declaration per file under the Communication constants directory.
- **Rules:** [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md) (EventSource client/factory boundary, infrastructure-only adapter and consumer-based verification); [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (leader/lifecycle ownership remains in the shell and context organization); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (consumer behavior and cleanup assertions); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (declarations, naming and handler ordering). No dedicated realtime-hook test file is permitted.
- **Exit:** Focused shell/provider and presentation tests, full Web Vitest, Web code/types/architecture, Biome, build, Playwright CLI health, and Spec conformance pass. Realtime hook behavior is verified through its NotificationShell consumer and browser route suite; no dedicated realtime-hook test is maintained. No browser provider/channel contract, provider-specific composition or low-level transport prop remains in UI; the remaining repository complexity findings must be classified against baseline. The real SSE controller suite remains unchanged and must remain green.

#### F5-T6 — Remove the redundant notification layout wrapper

- **Status/owner:** `completed` — Builder Web (`01a090f2-a632-76d0-9825-c9f7d2735507`); integrated by Orchestrator
- **Depends/parallel:** Depends on F5-T2 and F5-T5; source-only correction within the Web ownership boundary.
- **Paths:** `apps/web/src/ui/shared/widgets/layouts/app-layout/index.tsx`; `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx`; `apps/web/src/ui/communication/widgets/layouts/notification-shell/index.tsx` (remove).
- **Contract:** Revision 7 UI composition refinement; `AC-03`, `AC-05`, `AC-10`, `AC-11`.
- **Outcome:** `AppLayout` directly composes `NotificationShellContextProvider`, `useNotificationShellProvider` and `useNotificationRealtime` around the existing authenticated shell. The redundant `widgets/layouts/notification-shell` directory and wrapper are removed, preserving one stable notification scope and existing consumer behavior.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (context ownership, stable layout boundary and no redundant layout wrapper); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (layout composition and consumer behavior); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (imports, declarations and handler ordering).
- **Exit:** Run focused AppLayout/context/presentation tests, Web code/types/architecture, test integrity, diff checks, Playwright notification route and Spec conformance. Confirm no stale wrapper imports or path references remain.

### F6 — Authenticated SSE route and composition

#### F6-T1 — Wire the stream controller, SSE adapter, DTO, module registration, integration test and REST examples

- **Status/owner:** `completed` — Builder Server REST (`01a0883d-6024-7ba1-83f6-988f9b5a09ef`)
- **Depends/parallel:** Depends on F2, F3 and the Orchestrator’s reviewed F4 migration; runs in parallel with F5 and owns the complete Communication REST group.
- **Paths:** `apps/server/src/communication/rest/controllers/stream-notifications.controller.ts`; `apps/server/src/communication/rest/streams/notification-stream.ts`; `apps/server/src/communication/rest/controllers/tests/stream-notifications.controller.test.ts`; `apps/server/src/communication/rest/controllers/index.ts`; `apps/server/src/communication/rest/dtos/notification-response.dto.ts`; `apps/server/src/communication/rest/dtos/notification-cursor-response.dto.ts`; `apps/server/src/communication/rest/dtos/notification-page-response.dto.ts`; `apps/server/src/communication/rest/dtos/notification-read-response.dto.ts`; `apps/server/src/communication/rest/dtos/notification-realtime-event-response.dto.ts`; `apps/server/src/communication/rest/dtos/index.ts`; `apps/server/src/communication/communication.module.ts`; `apps/server/rest-client/communication/notifications.rest`.
- **Contract:** Spec `FR-01`, `FR-02`, `FR-08`; `AC-01`, `AC-02`, `AC-03`, `AC-11`, `AC-12`; REST Technical Contract, SSE framing/error mapping, DTO and Composition tables.
- **Outcome:** `GET /notifications/stream` uses existing cookie auth and current-account/session verification, delegates policy/capacity/queue to `StreamNotificationsUseCase`, frames named version-1 canonical DTO events with 20-second comments, closes on disconnect/backpressure, registers Communication wiring, and retains all existing list/read routes.
- **Rules:** [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (group decorator, one action controller, use-case construction, Swagger responses, global errors, route ownership and REST-client parity); [`controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) (real Nest/module/database/auth infrastructure, isolated fixture lifecycle and HTTP/persistence assertions); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (tokenized persistence and indirect repository coverage); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (server aliases, naming and known errors). No dedicated `Antipatterns to Avoid` subsection applies.
- **Exit:** Run focused controller integration coverage plus `pnpm --filter server check:code`, `pnpm --filter server check:types`, `pnpm --filter server test:coverage`, and `pnpm --filter server build`; with healthy PostgreSQL and seeded accounts verify real commit-only delivery, rollback silence, auth/profile/tenant/recipient isolation, revalidation close, heartbeat, disconnect cleanup, sixth-stream `429`, queue overflow at 100 and future-only reconnect. Verify `apps/server/rest-client/communication/notifications.rest` contains one clearly labeled request for every list/read/stream route with current methods, paths, headers, representative bodies, reusable local variables, no credentials and parity with controllers/schemas; record this separate REST parity evidence in `evaluation.md`.

### F7 — Integrated validation and handoff

#### F7-T1 — Run complete conformance, runtime, visual and independent review gates

- **Status/owner:** `completed` — Orchestrator; implementation corrections, single required review and aggregate coverage gate are complete
- **Depends/parallel:** Depends on all Builder tasks and F4 generated-artifact review; no parallel implementation work remains. Corrections resume the responsible Builder and invalidate affected evidence.
- **Paths:** `documentation/features/communication/notification-toast/evaluation.md` (created by `implement-spec` at kickoff); ignored `apps/web/test-results/communication/` Playwright artifacts; integrated candidate paths from F1–F6 are reviewed but remain owned by their assigned Builders.
- **Contract:** All Spec `FR-01`–`FR-08`, `AC-01`–`AC-12`, `MV-01`–`MV-03`, Design Contract and Validation Contract.
- **Outcome:** The integrated candidate has current structural conformance, package/architecture/type/code/coverage/build evidence, real authenticated commit/rollback/isolation/capacity proof, mocked route proof, exact REST parity, independent final visual comparisons and one completed Implementation Reviewer with every verified finding resolved.
- **Rules:** [`documentation/sdd.md`](../../../sdd.md) (package gate, evidence freshness, correction routing and one Reviewer); [`documentation/tooling.md`](../../../tooling.md) (workspace, Docker, migration, coverage and Playwright commands); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (route evidence and complete widget coverage); [`controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) (real server-backed evidence); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (final route parity); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (generated artifact review). No dedicated `Antipatterns to Avoid` subsection applies beyond the UI rule already scheduled in F5.
- **Exit:** After integration run `pnpm check:spec-implementation -- documentation/features/communication/notification-toast/spec.md` before integrated sensors and record the result. Then run every applicable Spec command, inspect Docker health and required seeded accounts, execute real Playwright CLI `MV-01`–`MV-03` with fresh evidence, inspect URL/DOM/network/console/focus/persistence, compare every required visual state against the manifest at its exact viewport, and verify the latest path sensor is rerun after every contracted-path correction. Schedule exactly one read-only [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) across Core, Validation, Server persistence/REST/composition, Web provision/UI/layout, migration, REST parity and all final visual comparisons; verify and resolve findings, then route directly to `conclude-spec`.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Spec path conformance | Complete affected-path map and Git classification | Spec Technical Contract | `./evaluation.md` with `pnpm check:spec-implementation -- documentation/features/communication/notification-toast/spec.md` | `completed` |
| Automated | Core contracts and stream use case | `FR-01`, `FR-02`, `FR-07`, `FR-08`; `AC-01`, `AC-02`, `AC-03`, `AC-11`, `AC-12` | F1-T1 / Core Contract | `./evaluation.md` with Core code, types, focused tests and coverage | `completed` |
| Automated | Realtime payload schema | `FR-03`, `FR-08`; `AC-01`, `AC-02`, `AC-06`, `AC-08` | F2-T1 / Validation Contract | `./evaluation.md` with Validation code/types and consumer evidence | `completed` |
| Automated | Server persistence, REST and build | `AC-01`, `AC-02`, `AC-03`, `AC-11`, `AC-12` | F3-T1, F4-T1, F6-T1 | `./evaluation.md` with Server code/types/coverage/build and real controller integration results | `completed` |
| Automated | Web widgets, realtime consumer boundary and build | `AC-03`–`AC-11` | F5-T1–F5-T5 / UI Contract | `./evaluation.md` with Web code/types/coverage/build and focused Vitest results | `completed` |
| Automated | Architecture, test integrity and complexity | All affected paths | Spec commands and applicable Rules | `./evaluation.md` with `pnpm check:architecture`, `pnpm check:test-integrity`, and `pnpm check:complexity` | `completed` |
| Automated | Mocked authenticated browser route | `AC-01`, `AC-03`–`AC-11` | `apps/web/tests/communication/notification-toast.test.tsx` | `./evaluation.md` with final URL, visible states, stream/list requests, keyboard path and test result | `completed` |
| REST client | Communication notification route group | `AC-01`, `AC-02`, `AC-12` | [`notifications.rest`](../../../apps/server/rest-client/communication/notifications.rest) and REST Contract | Exact artifact path plus parity record for every list/read/stream route, methods, paths, headers, bodies, reusable variables and no credentials | `completed` |
| Runtime | Real authenticated commit, rollback, isolation and capacity | `AC-01`, `AC-02`, `AC-12` | MV-03 / Server Integration Contract | `./evaluation.md` with response framing, heartbeat, database/history state, authorization and cleanup evidence | `completed` |
| Manual | MV-01 — realtime toast, exact dropdown and visual/accessibility behavior | `AC-01`, `AC-04`–`AC-10` | [`MV-01` in `spec.md`](./spec.md#mv-01--realtime-toast-exact-dropdown-and-visualaccessibility-behavior) | `./evaluation.md` with real flow results, fresh Playwright artifacts, URL/network/console/focus inspection | `completed` |
| Manual | MV-02 — leadership, hidden/offline and reconnect non-replay | `AC-03`, `AC-10`, `AC-11` | [`MV-02` in `spec.md`](./spec.md#mv-02--leadership-hiddenoffline-and-reconnect-non-replay) | `./evaluation.md` with two-tab stream ownership, invalidation, history/no-replay and cleanup evidence | `completed` |
| Manual | MV-03 — real authenticated isolation, commit and capacity | `AC-01`, `AC-02`, `AC-12` | [`MV-03` in `spec.md`](./spec.md#mv-03--real-authenticated-isolation-commit-and-capacity) | `./evaluation.md` with Manager/Operator/foreign fixtures, rollback, rejection, `429`, overflow and persistence proof | `completed` |
| Visual | Stock-below-ideal toast at `1560 × 1020` | `AC-06`–`AC-09` | [`nfjNn.png`](./design/nfjNn.png) | Fresh `EV-TOAST-DESKTOP` screenshot in ignored Playwright output plus independent comparison in `./evaluation.md` | `completed` |
| Visual | Header dropdown selection at `1560 × 1020` | `AC-05`, `AC-10` | [`n5xnGg.png`](./design/n5xnGg.png) | Fresh `EV-DROPDOWN-SELECTION` screenshot plus independent comparison in `./evaluation.md` | `completed` |
| Visual | Toast adaptation at `390 × 844` | `AC-06`–`AC-09` | Design manifest narrow viewport | Fresh `EV-TOAST-NARROW` screenshot and exact viewport comparison in `./evaluation.md` | `completed` |
| Visual | Dropdown adaptation at `390 × 844` | `AC-05`, `AC-09`, `AC-10` | Design manifest narrow viewport | Fresh narrow dropdown-selection screenshot and exact viewport comparison in `./evaluation.md` | `completed` |
| Visual | Single keyboard-focused toast at `1560 × 1020` | `AC-07`, `AC-08` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh focused desktop screenshot and keyboard/focus comparison in `./evaluation.md` | `completed` |
| Visual | Single keyboard-focused toast at `390 × 844` | `AC-07`, `AC-08`, `AC-09` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh focused narrow screenshot and keyboard/focus comparison in `./evaluation.md` | `completed` |
| Visual | Three-toast stack at `1560 × 1020` | `AC-04`, `AC-09` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh stack desktop screenshot and ordering/containment comparison in `./evaluation.md` | `completed` |
| Visual | Three-toast stack at `390 × 844` | `AC-04`, `AC-09` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh stack narrow screenshot and overflow comparison in `./evaluation.md` | `completed` |
| Visual | Long-copy toast at `1560 × 1020` | `AC-08`, `AC-09` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh long-copy desktop screenshot and clamp/announcement comparison in `./evaluation.md` | `completed` |
| Visual | Long-copy toast at `390 × 844` | `AC-08`, `AC-09` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh long-copy narrow screenshot and clamp/announcement comparison in `./evaluation.md` | `completed` |
| Visual | Stock-zero semantic variant at `1560 × 1020` | `AC-06` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh semantic desktop screenshot and typed-map comparison in `./evaluation.md` | `completed` |
| Visual | Stock-zero semantic variant at `390 × 844` | `AC-06`, `AC-09` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh semantic narrow screenshot and typed-map comparison in `./evaluation.md` | `completed` |
| Visual | Identity semantic variant at `1560 × 1020` | `AC-06` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh semantic desktop screenshot and typed-map comparison in `./evaluation.md` | `completed` |
| Visual | Identity semantic variant at `390 × 844` | `AC-06`, `AC-09` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Fresh semantic narrow screenshot and typed-map comparison in `./evaluation.md` | `completed` |
| Visual | Hidden/offline suppression at `1560 × 1020` | `AC-03`, `AC-11` | Accepted supplemental state in [`manifest.md`](./design/manifest.md) | Lifecycle tests and explicit accepted harness limitation recorded in `./evaluation.md` | `completed` |

Final handoff requires every task and phase to be `completed`, the revision-1 commands current on the integrated candidate, generated migration and journal reviewed, services/accounts/fixtures ready, every `MV-*` executable, all transient evidence identifiers recorded, every supplied and accepted supplemental visual state independently compared at its manifest viewport, the latest `check:spec-implementation` run passed after the last contracted-path correction, `notifications.rest` route-complete and parity-verified, the single Implementation Reviewer completed with verified findings resolved, no blocking finding active, and every affected workspace coverage command passing without lowering its configured floor. Then route directly to `conclude-spec`.
