---
title: Sentry operational monitoring — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 9
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/42
updated_at: 2026-09-25
---

# 1. Execution status

- **Contract:** [Spec revision 9](./spec.md), compatibility approved; `IdentityModuleFixture` owns real RestFixture/InngestFixture job composition, and the reviewed complexity baseline is limited to feature signatures plus three current base-CI Web layout warnings.
- **Strategy:** Plan-backed execution because shared contracts preceded parallel Web and Server work, followed by local release integration and review.
- **Current phase:** Local F4 corrections, evidence and implementation review are complete; delivery PR and exact-head CI remain before conclusion.
- **Active blockers:** No local implementation blockers remain. Project existence, remote ingestion, deployed release/map alignment and alert/email delivery remain operator-owned account operations and do not block this Spec.
- **Builders:** Builder Contracts completed F1. Builder Web owns only `isAllowedSessionCookie` refactoring in `apps/web/src/server/auth/resolve-auth-session.ts`. Builder Server owns only the three over-threshold helpers in the mapped Identity/PDV fixtures and one mapped health-integration assertion needed to restore the existing Server coverage floor. Both preserve established behavior and test policy.
- **Shared ownership:** The Orchestrator owns `pnpm-lock.yaml`, dependency installation, cross-app configuration, complete path conformance, integrated validation and handoff. Builder Web owns its app and web staging workflow; Builder Server owns its app and server staging workflow. The existing three Web test deletions and `test-integrity.config.mjs` change are separate test-policy cleanup; preserve them. The Spec implementation path checker reports unrelated changed paths but does not require them in this feature's affected-path table.

# 2. Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Builder Contracts | F1 | Shared telemetry and environment contracts | — | — | completed | Core port and both environment schemas typecheck and preserve dev/test no-export behavior |
| 2 | Builder Web | F2 | Browser, SSR, transport and web release | F1 | F3 | completed | Dependency install, browser/SSR signals, private-map build configuration and controlled failure gates pass |
| 2 | Builder Server | F3 | Nest, HTTP, jobs and server release | F1 | F2 | completed | Dependency install, controller/job suites, terminal metrics, private-map build configuration and controlled failure gates pass |
| 3 | Orchestrator | F4 | Integrated release, evidence and review | F2, F3 | — | in_progress | Local validations, revision 9 Spec review and complete-candidate implementation review pass; create the delivery PR and obtain green Core/Server/Web/Complexity checks on its exact head before closing the SDD artifacts |

### F1 — Shared contracts

#### F1-T1 — Operational telemetry port

- **Status/owner:** `completed` — Builder Contracts.
- **Depends/parallel:** No dependency; precedes F2 and F3.
- **Paths:** `packages/core/src/shared/interfaces/server-app-telemetry-provider.ts`; `packages/core/src/shared/interfaces/index.ts`.
- **Contract:** FR-01–04, FR-06; AC-01–05.
- **Outcome:** A narrow, SDK-free server telemetry port exposes only approved fields and best-effort operations.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/provision-layer-rules.md` (providers tested through consumers).
- **Exit:** Core code, architecture, types and coverage commands in the Spec pass; inspect the exported signature for raw metadata, request objects or SDK types.

#### F1-T2 — Deployed environment schemas

- **Status/owner:** `completed` — Builder Contracts.
- **Depends/parallel:** May proceed alongside F1-T1 within Builder Contracts; precedes F2 and F3.
- **Paths:** `packages/validation/src/environment/server-env-schema.ts`; `packages/validation/src/environment/browser-env-schema.ts`.
- **Contract:** FR-01, FR-06; AC-01, AC-07–08.
- **Outcome:** Staging/production require valid project DSN and full SHA while dev/test remain inert.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/validation-package-rules.md`.
- **Exit:** Validation code, architecture and types commands pass; controlled configuration checks demonstrate deployed rejection and local/test no-export without adding dedicated schema test files.

### F2 — Web monitoring and release

#### F2-T1 — Browser, SSR and web transport signals

- **Status/owner:** `completed` — Web signals and auth-session complexity correction are integrated. Web code, types, coverage and health smoke pass; the one parallel notification pagination failure passes in isolation. Sentry warning behavior and session-cookie acceptance remain unchanged.
- **Depends/parallel:** F1 and F2-T2 SDK dependency installation; parallel with F3. Reuse Builder Web for F2-T3.
- **Paths:** `apps/web/src/provision/telemetry/sentry.config.ts`; `apps/web/src/provision/telemetry/sentry-telemetry-provider.ts`; `apps/web/instrument.server.mjs`; `apps/web/src/router.tsx`; `apps/web/src/constants/browser-env.ts`; `apps/web/src/server/auth/resolve-auth-session.ts`; `apps/web/src/rest/axios/utils/request.ts`; `apps/web/tests/health/playwright-cli-health.test.ts`.
- **Contract:** FR-01–06; AC-01–07.
- **Outcome:** Browser, SSR and API calls emit privacy-safe signals through the correct project while preserving existing navigation, auth and REST behavior.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/rest-layer-rules.md` (web transport through consumers); `documentation/rules/provision-layer-rules.md` (no dedicated adapter test); `documentation/rules/widget-testing-rules.md` (browser route integration).
- **Exit:** Web code, architecture, types, coverage and health smoke pass. The full parallel Playwright run has one notification-pagination failure that passes in isolation; PR CI must pass the full suite. Compare the Spec's non-widget tree and unchanged rendered login route; inspect URL, API-only trace headers, console and failed requests, keyboard and 390 × 844 behavior. Capture a fresh screenshot only if rendered appearance changes. Preserve the existing test-policy deletions; add no dedicated browser-env, Axios or SSR-auth unit tests.

#### F2-T2 — Web SDK dependency bootstrap

- **Status/owner:** `completed` — Builder Web.
- **Depends/parallel:** F1; parallel with F3-T3. Orchestrator installs dependencies and updates `pnpm-lock.yaml` before F2-T1 code checks.
- **Paths:** `apps/web/package.json` only.
- **Contract:** FR-01–06; AC-01–07.
- **Outcome:** Declare compatible browser/SSR SDK and its integrated Vite source-map upload dependency for the source and build tasks; the selected TanStack Start package supplies the Vite integration without a duplicate standalone plugin.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/validation-package-rules.md`.
- **Exit:** Package name/version verified against current SDK documentation; Orchestrator's frozen-lockfile install and imports of SDK/Vite integration succeed.

#### F2-T3 — Private web maps and staging deployment

- **Status/owner:** `completed` — Builder Web local build, configuration, image and failure-gate checks passed; remote account upload is outside acceptance.
- **Depends/parallel:** F2-T1, F2-T2 and Orchestrator-coordinated dependency installation; parallel with F3-T4 after shared SHA/project values are agreed.
- **Paths:** `apps/web/vite.config.ts`; `apps/web/Dockerfile`; `apps/web/.env.example`; `.github/workflows/web-app-staging-cd.yml`.
- **Contract:** FR-01, FR-06; AC-01, AC-07–08.
- **Outcome:** Web browser and SSR releases use the deployed SHA, private maps and a fail-closed staging upload gate.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/validation-package-rules.md`.
- **Exit:** Web build succeeds in local mode and fails for missing deployed inputs or controlled upload failure; inspect image/build output for absence of token and private maps. A successful upload to the user's Sentry account is not required.

### F3 — Server monitoring and release

#### F3-T1 — Nest telemetry and HTTP boundary

- **Status/owner:** `completed` — real-fixture health route telemetry, handled-error behavior and final types/code checks pass; no F3-T1 behavior correction was needed.
- **Depends/parallel:** F1 and F3-T3 SDK dependency installation; parallel with F2. Reuse Builder Server for F3-T2 and F3-T4.
- **Paths:** `apps/server/src/shared/provision/telemetry/sentry-init.ts`; `apps/server/src/shared/provision/telemetry/server-app-telemetry-provider.ts`; `apps/server/src/shared/provision/logger/sentry-logger.ts`; `apps/server/src/shared/provision/provision.module.ts`; `apps/server/src/main.ts`; `apps/server/src/app.ts`; `apps/server/src/shared/rest/filters/global-error-handler.ts`; `apps/server/src/shared/rest/tests/rest-fixture.ts`; `apps/server/src/shared/rest/controllers/tests/check-health.controller.test.ts`.
- **Contract:** FR-01–04, FR-06; AC-01–05, AC-07.
- **Outcome:** Nest starts telemetry before application modules, records one safe HTTP result, and captures unknown exceptions without changing expected responses.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/database-layer-rules.md` (real DatabaseFixture, no repository mock); `documentation/rules/server-app-layer-rules.md`.
- **Exit:** Focused health-controller integration through real RestFixture/DatabaseFixture passes for healthy, handled 503 and unknown 500; server code, architecture and types pass. No route/request shape changes or `.rest` artifact are planned; verify the existing health route remains unchanged.

#### F3-T2 — Terminal Inngest observations

- **Status/owner:** `completed` — Identity/PDV fixture helper complexity is within thresholds, the module-owned Identity job test and all eight registered-job files/22 tests pass, and Server coverage is 75.24% against the unchanged 75.2% line floor.
- **Depends/parallel:** F3-T1 telemetry binding; parallel with F2. All job/fixture changes stay with the same Builder.
- **Paths:** `apps/server/src/shared/messaging/shared-messaging.module.ts`; `apps/server/src/shared/messaging/inngest/inngest-client.ts`; `apps/server/src/shared/messaging/inngest/inngest-job.ts`; all eight `apps/server/src/**/messaging/inngest/jobs/*-job.ts` paths and eight corresponding `jobs/tests/*-job.test.ts` paths listed in the Spec's Messaging map; `apps/server/src/communication/fixtures/communication-module-fixture.ts`; `apps/server/src/identity/fixtures/identity-module-fixture.ts`; `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`; `apps/server/src/shared/messaging/fixtures/shared-messaging-module-fixture.ts`.
- **Contract:** FR-01–04, FR-06; AC-01–03, AC-05.
- **Outcome:** Each registered job emits one terminal outcome/duration without counting retry attempts or durable steps and without exporting payloads; the client extends the Sentry provider so job spans are included in traces.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/messaging-layer-rules.md`; `documentation/rules/jobs-testing-rules.md` (real Nest/Inngest registration and module fixtures); `documentation/rules/provision-layer-rules.md`.
- **Exit:** `pnpm --filter server exec vitest list --config vitest.inngest.config.mts` discovers all eight files; `pnpm --filter server test:inngest` passes on a Docker-capable host. Record successful, retry and terminal-failure observations without treating discovery as execution; preserve baseline test-case/assertion thresholds; confirm the mapped Inngest client uses `extendedTracesMiddleware()` with the Sentry-initialized provider; rerun test integrity, affected tests and the final Spec path sensor. Identity job tests use IdentityModuleFixture to compose real Nest/Inngest modules. The original suite, tracing client checks and sensor pass in EV-94–95 and EV-108–110; test-integrity correction is tracked by EV-113/FND-16.

#### F3-T3 — Server SDK dependency bootstrap

- **Status/owner:** `completed` — Builder Server.
- **Depends/parallel:** F1; parallel with F2-T2. Orchestrator installs dependencies and updates `pnpm-lock.yaml` before F3-T1 code checks.
- **Paths:** `apps/server/package.json` only.
- **Contract:** FR-01–04, FR-06; AC-01–05, AC-07.
- **Outcome:** Declare compatible Nest/Node SDK and Webpack source-map upload plugin dependencies for the source and build tasks.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`.
- **Exit:** Package names/versions verified against current SDK documentation; Orchestrator's frozen-lockfile install and imports of SDK/plugin succeed.

#### F3-T4 — Private server maps and staging deployment

- **Status/owner:** `completed` — Builder Server local build, configuration, image and controlled upload-failure checks passed; remote account upload is outside acceptance.
- **Depends/parallel:** F3-T1, F3-T2, F3-T3 and Orchestrator-coordinated dependency installation; parallel with F2-T3 after shared SHA/project values are agreed.
- **Paths:** `apps/server/webpack.config.cjs`; `apps/server/Dockerfile`; `apps/server/.env.example`; `.github/workflows/server-app-staging-cd.yml`.
- **Contract:** FR-01, FR-06; AC-01, AC-07–08.
- **Outcome:** Server release uses its environment project, matching SHA/private maps and a fail-closed staging upload gate.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/validation-package-rules.md`.
- **Exit:** Server build and controlled missing-config/upload-failure checks pass; inspect image/build output for absence of token and private maps. A successful upload to the user's Sentry account is not required.

### F4 — Integrated evidence and handoff

#### F4-T1 — Integrate, validate and review

- **Status/owner:** `in_progress` — Orchestrator; local path conformance, corrected coverage/complexity gates and candidate review pass. PR creation and exact-head CI remain.
- **Depends/parallel:** F2 and F3 complete; no parallel Builder edits during final candidate review.
- **Paths:** `pnpm-lock.yaml`; `.code-multivitals-baseline.json` generated and reviewed under revision 9 with only the current feature signatures and the exact AppLayout/UserMenu/SidebarNavigation records permitted; [evaluation.md](./evaluation.md) at implementation kickoff; Spec/Plan status updates only through their owning workflows. External Sentry project, release and alert configuration is operational evidence, not a repository path.
- **Contract:** FR-01–07; AC-01–09.
- **Outcome:** One integrated candidate satisfies the path map, local sensors and controlled privacy/routing/build checks. Account-level verification is explicitly outside acceptance.
- **Rules:** The Spec's complete Rule Pack; `documentation/tooling.md`; `documentation/sdd.md`.
- **Exit:** The final path sensor, local Spec commands, MV-03, revision 9 Spec compatibility review and complete-candidate Implementation Reviewer pass. The generated baseline contains only current feature signatures plus revision 9's exact three unchanged Web signatures; thresholds/configuration and clone records remain unchanged. Create the ready delivery PR and wait for Core/Server/Web/Complexity CI on its exact head; then close the SDD artifacts through `conclude-spec`.

# 3. Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core, validation, Web, Server and root commands, including reviewed revision 9 baseline | AC-01–08 | Spec command table | `./evaluation.md` | passed locally; exact-head PR CI pending |
| Automated | Complete affected-path map after integration and after any correction | AC-01–08 | `pnpm check:spec-implementation -- documentation/features/shared/sentry-monitoring/spec.md` | `./evaluation.md` | passed |
| Browser | Existing health/login route at 390 × 844, keyboard, URL, network and console | AC-04, AC-07 | Spec MV-03; widget-testing rule | `./evaluation.md`; fresh screenshot only if appearance changes | health smoke passed; one parallel suite case passes in isolation; full PR CI pending |
| Runtime | MV-03 local/test export and deployment gates | AC-07–08 | Spec MV-03 | `./evaluation.md` | passed locally |
| Review | One complete-candidate Implementation Reviewer | AC-01–08 | Spec revision 9 integrated implementation candidate | `./evaluation.md` | passed; EV-179 |
| Review | Spec compatibility review for revision 8 complexity-baseline path | Repository-local validation boundary, Architecture, Modules, paths, Rule Pack and test integrity | `./evaluation.md` | passed; EV-167 |
| Review | Spec compatibility review for revision 9's three base-CI Web layout baseline signatures | Exact baseline-only exception, source paths, thresholds/config and clone guard | `./evaluation.md` | passed; EV-174 |

The Sentry change adds no HTTP route or request shape and needs no new `.rest` artifact. It changes no rendered widget or design state, so there is no design-reference comparison row. The Orchestrator verified all phase/task exits, AC evidence, current integrated commands and coverage floors, the latest path sensor, review disposition and local MV-03 result; the remaining F4 work is ready PR publication and exact-head CI. Sentry account setup and deployed account inspection are operator follow-up and are not delivery blockers.
