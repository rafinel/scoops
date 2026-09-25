---
title: Sentry operational monitoring
status: in_progress
revision: 9
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/42
scope:
  - apps/web
  - apps/server
  - packages/core
  - packages/validation
  - .github/workflows
  - .code-multivitals-baseline.json
last_updated_at: 2026-09-25
---

# 1. Context and scope

**Objective and source.** Implement the repository-owned portion of [issue #42](https://github.com/rafinel/scoops/issues/42) as shared monitoring infrastructure. The applications are configured to export privacy-safe browser, web SSR, API and job signals to their environment-specific Sentry projects. No module PRD owns this operational capability.

**Baseline and gap.** Neither app initializes Sentry. Web Vite already externalizes Sentry from Nitro without an installed SDK. The server has one global HTTP error translator and an Inngest endpoint but exports no telemetry. Staging Docker workflows exist; no production deployment workflow is checked in.

| Area | In scope | Out of scope |
| --- | --- | --- |
| Signals | Errors, sanitized warning/error logs, traces, six initial metrics, browser replay | Business metrics, broad dashboards, monitoring UI |
| Environments | Web/server use environment-specific DSNs, SHA releases and private maps | Local/test export, account-level Sentry resources/rules, or invented production pipeline |
| Account operations | Existing four projects are selected through deployment DSNs | Verifying project existence, remote ingestion, production alert rules/email, or deployed release/map alignment |
| Product | Observe existing REST/auth/jobs | New routes, domain decisions, persistence or PRD outcomes |

| Source requirement | Delivery | Notes |
| --- | --- | --- |
| Issue #42 outcome and acceptance | partial | Repository code selects one DSN per app/environment and enforces release-map build gates. Sentry account resources, remote ingestion and alert setup/delivery are account operations outside this Spec's acceptance boundary. |

**Accepted decisions.** Each app/environment receives its own DSN from the existing four projects. Operators own project creation, Sentry alert-rule configuration and email delivery. Those account operations, live ingestion and deployed release/map comparisons are not acceptance gates. Allowlist safe telemetry fields; replay masks text/inputs/media. Staging trace/routine replay rates are 100%/10%; production 10%/1%; error-triggered replay is 100% where available. Missing deployed DSN/release or failed private source-map upload blocks release. The deployed Git SHA identifies both app releases.

# 2. Implementation Contract

| ID | Source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | Issue #42 failures | Browser, SSR, API and job SDKs select the app/environment DSN and attach environment/release metadata; expected failures do not create issues. |
| FR-02 | Issue #42 logs | Every runtime emits useful sanitized warning/error logs to its matching project. |
| FR-03 | Issue #42 traces | Browser navigation, SSR, API and jobs produce traces; web-to-API context crosses only the configured API origin. |
| FR-04 | Issue #42 metrics | Six initial web/API/job metrics appear with correct units and bounded safe dimensions. |
| FR-05 | Issue #42 replay | Sampled browser sessions and errors can be replayed with text, inputs and media masked; no server replay. |
| FR-06 | Issue #42 environment/privacy | Only staging/production export; credentials, tokens, full financial identifiers and unnecessary personal data are absent from every signal. |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01, FR-06 | Runtime project selection | Environment-specific app DSN and release config | SDK initializes or an event is prepared | Correct app/environment DSN, environment and SHA are selected | Config/schema checks; source inspection; HTTP/job tests |
| AC-02 | FR-01, FR-02 | Quiet expected failures | Known AppError, handled HTTP 4xx or retryable job attempt | Boundary handles it | Normal response/retry; no error issue or duplicate error log | HTTP/job tests |
| AC-03 | FR-02, FR-06 | Safe logs | Warning or unexpected error | Logging boundary emits | Level/runtime/stable operation/error class without sensitive context | HTTP/job tests |
| AC-04 | FR-03, FR-06 | Joined traces | Sampled web action calls API | Request completes | Web/API propagation is limited to API origin; job middleware is configured | Browser smoke; controlled local receiver probe; job integration |
| AC-05 | FR-04 | Initial metrics | Navigation/request, API request and job settle | Collection point fires | Six metrics have correct units/dimensions; one terminal job outcome | HTTP/job tests |
| AC-06 | FR-05, FR-06 | Masked replay configuration | Browser SDK initializes | Replay options are constructed | Text/input masking and media blocking are enabled; server replay is absent | SDK option/configuration inspection |
| AC-07 | FR-06 | Export gates | Local/test mode or missing deployed config | Telemetry/build runs | Local/test send nothing; deployed config rejects missing DSN/mode/SHA/token | Config/build; MV-03 |
| AC-08 | FR-01, FR-06 | Map build integrity | Deployed build has SHA and upload configuration | Maps are generated and uploader runs | Maps are private, upload uses the build SHA, upload/config failure stops release, runtime image excludes maps/token | Controlled builds, upload-failure harness and image/artifact inspection |

| Metric | Type/unit | Collection point | Allowed dimensions |
| --- | --- | --- | --- |
| scoops.web.navigation.duration | distribution, millisecond | Browser router navigation settlement | route template, environment |
| scoops.web.request.duration | distribution, millisecond | Shared Axios REST request completion, browser or SSR | route template, method, status class, runtime |
| scoops.api.request.outcome | count | Server HTTP response finish, including auth/Inngest HTTP | route template/group, method, status class |
| scoops.api.request.duration | distribution, millisecond | Same HTTP finish | route template/group, method, status class |
| scoops.job.run.outcome | count | Successful final return or terminal failure callback | registered function ID, outcome |
| scoops.job.run.duration | distribution, millisecond | Same terminal boundary; trigger-to-terminal time including queue/retries | registered function ID, outcome |

Route template means a fixed pattern/group, never ID-bearing URL or query. No user, establishment, event or run ID is a metric dimension. Job run identity suppresses durable-step replay emissions. Metrics are terminal callback observations, not a transactional exactly-once ledger; Sentry delivery failure never changes the job result.

| Concern | Contract |
| --- | --- |
| Privacy | Allowlist fields before export. Drop raw bodies, headers, cookies, queries, SQL values, provider payloads, arbitrary error metadata and user identity. Replay masks all text/inputs and blocks media. |
| Classification | Known AppError and handled HttpException/4xx remain application signals. Capture unknown exceptions once; status 5xx alone does not create a second issue. Inngest transient attempts are filtered from automatic HTTP error capture; only terminal failure creates a job issue. |
| Sampling | stg: trace 1.0, routine replay 0.10; prod: trace 0.10, routine replay 0.01; both: error replay 1.0 where available. Error capture and standalone metrics do not depend on trace sampling. |
| Degradation | Telemetry failure changes no response, transaction, step or job result. dev/test are inert even if DSN accidentally exists. |

# 3. Technical Contract

## Current technical state

| Evidence | Current responsibility | Gap |
| --- | --- | --- |
| apps/web/src/router.tsx, apps/web/src/rest/axios/utils/request.ts, apps/web/src/server/auth/resolve-auth-session.ts | Router, credentialed REST and SSR auth fetch | No browser/SSR init, safe telemetry or propagation policy |
| apps/server/src/main.ts, apps/server/src/app.ts, apps/server/src/shared/rest/filters/global-error-handler.ts | Nest bootstrap, Express setup, HTTP translation | No early SDK init, HTTP metrics/logs or unknown capture |
| apps/server/src/shared/messaging/inngest/inngest-client.ts and registered jobs | One endpoint, durable steps/retries | No terminal run observation |
| Environment schemas, Dockerfiles, staging workflows | Server mode, web API URL, container builds | No project DSN/SHA validation or private map upload |

## Solution and runtime flow

Each deployed process selects its app/environment project by validated mode and DSN. Browser SDK initializes after router creation; Nitro and Nest initialize before application modules. Git SHA is shared by SDK and private map upload. Only configured API origin receives trace headers. Safe processors and explicit log/metric adapters reject unapproved data. Global HTTP filter captures unknown exceptions and preserves current translation. Each job observes terminal success/failure and trigger-to-terminal duration; steps/retries stay intact. Sentry is never part of a business transaction.

The validated application modes map to Sentry environment labels: stg → staging and prod → production. Web build inputs are VITE_SCOOPS_WEB_APP_MODE, VITE_SENTRY_DSN and VITE_SCOOPS_RELEASE_SHA; its Nitro runtime reads SCOOPS_WEB_APP_MODE, SENTRY_DSN and SCOOPS_RELEASE_SHA. Server runtime uses its existing SCOOPS_SERVER_APP_MODE with SENTRY_DSN and SCOOPS_RELEASE_SHA. Each deployment supplies its own SENTRY_ORG, SENTRY_PROJECT and build-only SENTRY_AUTH_TOKEN. The public browser DSN and the web runtime DSN must target the same environment-specific web project; runtime SHA must equal the upload SHA. The upload token stays in a BuildKit secret, never a build argument, image layer or VITE_ variable.

An unexpected Error reaches Sentry as an exception so stack frames remain available. Before export, processors replace unsafe messages and remove arbitrary extras, breadcrumbs, request/response data and span attributes. The server Core port accepts the original unknown exception plus a narrow safe context for captureUnexpected; it never exposes Sentry types or a generic metadata map. The Inngest helper attaches success observation only after final handler completion and failure observation only at the terminal failure callback. Neither step discovery nor a retry emits a terminal metric.

| Boundary | Producer | Consumer | Canonical contract | Mapping/guarantees | Failure ownership |
| --- | --- | --- | --- | --- | --- |
| Web/API trace | Browser/SSR SDK | Server SDK | W3C/Sentry trace headers | Configured API origin only | SDK processors remove unsafe attributes |
| Telemetry signals | HTTP/REST/job observers | Sentry adapters | Telemetry and web safe helpers | Fixed route/job/outcome dimensions | Adapter absorbs export failure |
| Release | Git SHA/environment config | SDK/map uploader | Same SHA and matching project | Upload before release; maps private | Build/deploy gate |

## packages/core — Interfaces

| Contract | Kind/owner | Capability | Implementers | Consumers | Guarantees/failures |
| --- | --- | --- | --- | --- | --- |
| Telemetry | Shared infrastructure port | Safe HTTP/job outcomes, logs and unexpected errors | SentryTelemetry | Server app/filter/jobs | Best effort; no SDK, HTTP or tenant types |

| Path | Change | Contract/signature | Capability semantics | Guarantees/failures | Implementers/consumers | Exports |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/core/src/shared/interfaces/server-app-telemetry-provider.ts` | Create | Telemetry: recordHttpRequest, recordJobRun, logWarning, logError, captureUnexpected(error: unknown, safeContext) with narrow safe inputs | Only route, method, statusClass, functionId, outcome, durationMs, errorClass as applicable | No arbitrary metadata/payload/URL; never rejects work | Sentry adapter/app/filter/jobs | Shared interface barrel |
| `packages/core/src/shared/interfaces/index.ts` | Modify | Export Telemetry | Public port | No SDK dependency | Server | @scoops/core/shared/interfaces |

## packages/validation — Validation

| Schema | Concern/owner | Shape responsibility | Composes/derives from | Boundary consumers | Error/type contract |
| --- | --- | --- | --- | --- | --- |
| serverEnvSchema | Server config | Require DSN/full SHA for stg/prod; inert dev/test | Existing mode | EnvProvider/early init | Startup issue |
| browserEnvSchema | Web config | Explicit mode/public DSN/SHA and API origin | Existing browser fields | parseBrowserEnv/router | Build/config issue |

| Path | Change | Schema/declaration | Fields/refinements | Composition/ownership | Consumers | Export/tests |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/validation/src/environment/server-env-schema.ts` | Modify | serverEnvSchema | SENTRY_DSN URL, SCOOPS_RELEASE_SHA full SHA required in stg/prod; optional/ignored in dev/test | Shared config | Server init/provider | Existing root export, HTTP proof |
| `packages/validation/src/environment/browser-env-schema.ts` | Modify | browserEnvSchema | scoopsWebAppMode, sentryDsn, scoopsReleaseSha; deployed presence/format | Browser safe | parseBrowserEnv | Existing root export, config/build gate and MV-03 |

## apps/web — Provision

| Capability | Core contract | Adapter | Runtime/provider | Registration | Consumers |
| --- | --- | --- | --- | --- | --- |
| Web telemetry | Application-local safe boundary | sentry.config and sentry-telemetry-provider | @sentry/tanstackstart-react | Router/Nitro preload | Router/REST/SSR auth |

| Path | Change | Adapter/signature | Contract mapping/config | Failure/retry/secret boundary | Lifecycle/registration | Consumers/tests |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/provision/telemetry/sentry.config.ts` | Create | `SentryBrowser(dependencies?)` factory returns `initializeBrowserSentry(router)` | Optional injectable Sentry client, browser environment and web telemetry operations default to app singletons; DSN/mode/SHA, Router tracing, replay masking/sampling, API-origin propagation | Scrub before send/log/span; no console-wide capture/user identity | Construct the module once; initialize once per browser router | Router/REST via consumers |
| `apps/web/src/provision/telemetry/sentry-telemetry-provider.ts` | Create | `SentryTelemetryProvider(dependencies?)` factory returns `getWebTelemetryConfiguration`, `getSafeErrorClass`, `logWebWarning`, `logWebError`, `recordWebRequestDuration`, `recordWebNavigationDuration` | Optional injectable Sentry client and browser environment default to app singletons; stable operation/error class, browser or SSR | No raw Error/input; swallow export failure | Construct the module once; SDK per runtime | REST/SSR consumers |
| `apps/web/instrument.server.mjs` | Create | Node preload Sentry.init | Web runtime DSN/mode/SHA, SSR trace/log/processors | dev/test inert; no browser secret | Before Nitro | SSR manual proof |

## apps/web — UI

| Path | Change | Declaration/surface | Widget/role | State/actions contract | Async/failure contract | Design/responsive/accessibility | Dependencies/tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/router.tsx` | Modify | getRouter | Non-widget router composition | Init browser tracing/replay once, measure navigation settle by template | Navigation unchanged | No rendered change | telemetry/sentry.config, browser smoke |
| `apps/web/src/constants/browser-env.ts` | Modify | parseBrowserEnv, BROWSER_ENV | Non-widget config | Parse mode/DSN/SHA, retain API origin/prefix | Reject incomplete deployed mode | No UI | browserEnvSchema, config/build gate |
| `apps/web/src/server/auth/resolve-auth-session.ts` | Modify | resolveAuthSession | Non-widget SSR function | Safe unexpected provider warning/error | Preserve neutral failure/cookie behavior | No UI | telemetry/sentry-telemetry-provider |
| `apps/web/tests/health/playwright-cli-health.test.ts` | Modify | Login route smoke | Non-widget browser test | Assert dev/test has no Sentry request | Preserve URL, visible login and keyboard path | No rendered change | Existing Playwright CLI health boundary |

## apps/web — REST

| Operation | Server entry | Core action/contract | Web consumer | Security/tenant source | Compatibility/error owner |
| --- | --- | --- | --- | --- | --- |
| Existing methods | Existing controllers | Existing RestClient/services | AxiosRestClient.request | Existing cookie/API origin | Existing mapping; no endpoint change |

| Path | Change | Declaration/operation | Boundary/security | Request/response/errors | Effects/consumers | Registration/examples |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/rest/axios/utils/request.ts` | Modify | request | API-origin calls, no auth change | Preserve RestResponse/handled 4xx; safe warnings | Web request metric/REST consumers | No .rest change |

## apps/web — Composition

| Composition boundary | Kind/scope | Imports/dependencies | Provides/exports | Consumers | Lifecycle/order |
| --- | --- | --- | --- | --- | --- |
| Vite/Nitro | Build/runtime | TanStack Start, Nitro, Sentry SDK/uploader | Browser/SSR bundles | Staging/external production | Private upload before release |

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web/package.json` | Modify | Sentry SDK/Vite upload dependency and start preload | Compatible versions | Preload before Nitro | Browser/SSR SDK | pnpm-lock.yaml |
| `apps/web/vite.config.ts` | Modify | Vite maps/Sentry upload | SHA/org/project, retain Nitro externalization; browser and Nitro SSR maps share one release | Private upload, build fails on error | Web release | Docker |
| `apps/web/Dockerfile` | Modify | Build/runtime | BuildKit token secret, public DSN/mode/SHA build inputs, SSR runtime config | No token/maps in runtime image | Vite/Nitro | Staging workflow |
| `apps/web/.env.example` | Modify | Placeholders | Empty local DSN, dev mode, example release | No credentials | Validation | Developer setup |

## apps/server — Provision

| Capability | Core contract | Adapter | Runtime/provider | Registration | Consumers |
| --- | --- | --- | --- | --- | --- |
| Server telemetry | Telemetry | SentryTelemetry | @sentry/nestjs | ProvisionModule token | App/filter/Inngest/logger |

| Path | Change | Adapter/signature | Contract mapping/config | Failure/retry/secret boundary | Lifecycle/registration | Consumers/tests |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/shared/provision/telemetry/sentry-init.ts` | Create | initializeServerSentry | Mode/DSN/SHA, trace sampling, logs/processors | dev/test inert; scrub auto-spans | Before Nest/app import | HTTP/job proof |
| `apps/server/src/shared/provision/telemetry/server-app-telemetry-provider.ts` | Create | SentryTelemetry implements Telemetry | Safe names/classes, count/distribution/log/capture | Best effort; no raw error/provider types in Core | Singleton | HTTP/filter/jobs |
| `apps/server/src/shared/provision/logger/sentry-logger.ts` | Create | SentryLogger Nest LoggerService adapter | Preserve console, sanitized warn/error | No recursive/arbitrary argument capture | Nest bootstrap | Existing Nest consumers |
| `apps/server/src/shared/provision/provision.module.ts` | Modify | ProvisionModule | Bind/export telemetry token/implementation | Singleton | Core port/adapter | App/filter/jobs |

## apps/server — REST

| Operation | Server entry | Core action/contract | Web consumer | Security/tenant source | Compatibility/error owner |
| --- | --- | --- | --- | --- | --- |
| Existing HTTP | Existing controllers/auth/Inngest mounts | Existing actions | Existing web services | Existing sessions/tenants | Global filter; no route/DTO/.rest change |

| Path | Change | Declaration/operation | Boundary/security | Request/response/errors | Effects/consumers | Registration/examples |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/shared/rest/filters/global-error-handler.ts` | Modify | GlobalErrorHandler.catch | Capture unknown with safe class/route | Preserve status/body; no internals | One capture; AppError/HttpException quiet | App, controller proof |
| `apps/server/src/shared/rest/tests/rest-fixture.ts` | Modify | RestFixture.register | Resolve Telemetry from real Nest wiring for GlobalErrorHandler | Keep DatabaseFixture migration/cleanup and existing origin setup | All controller integration suites | Shared fixture only, no direct test |
| `apps/server/src/shared/rest/controllers/tests/check-health.controller.test.ts` | Modify | Health integration through RestFixture | Existing public route and real Drizzle/database module | Expected 503/unknown 500 safety; no loose Drizzle mock | HTTP outcome/capture with real filter | Route unchanged |

## apps/server — Messaging

| Event | Publisher | Trigger/consumer | Payload authority | Durable steps/side effects | Registration/reliability |
| --- | --- | --- | --- | --- | --- |
| Existing triggers | Existing modules/cron | Eight registered jobs | Existing events/schemas | Steps unchanged; terminal observation | One endpoint/registry |

All eight job classes use a static readonly ID in createFunction, module fixture registration and metric dimensions, as required by the Job Testing Rule. Add missing constants without changing values: CreateInProductNotificationsJob.ID = communication/create-in-product-notifications, ExpireIceCreamShopOnboardingsJob.ID = identity/expire-ice-cream-shop-onboardings, CleanupPublishedEventsJob.ID = shared/outbox-cleanup-published-events and ReprocessEventsJob.ID = shared/reprocess-events. Existing stable IDs remain unchanged.

| Path | Change | Declaration | Event/trigger/payload | Reliability/steps | Lifecycle/registration | Producers/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/shared/messaging/inngest/inngest-client.ts` | Modify | InngestClient | Existing config | Safe trace, no payload | Singleton | Jobs |
| `apps/server/src/shared/messaging/inngest/inngest-job.ts` | Modify | InngestJob helper | Function ID/run context | Terminal success/failure; no generic handle/step change | Job constructors | All jobs |
| `apps/server/src/communication/messaging/inngest/jobs/send-invitation-email-job.ts` | Modify | SendInvitationEmailJob.function | Existing event | Terminal observer | Existing registry | Existing test |
| `apps/server/src/communication/messaging/inngest/jobs/send-onboarding-confirmation-email-job.ts` | Modify | SendOnboardingConfirmationEmailJob.function | Existing event | Same | Existing registry | Existing test |
| `apps/server/src/communication/messaging/inngest/jobs/send-password-recovery-email-job.ts` | Modify | SendPasswordRecoveryEmailJob.function | Existing event | Same | Existing registry | Existing test |
| `apps/server/src/communication/messaging/inngest/jobs/create-in-product-notifications-job.ts` | Modify | CreateInProductNotificationsJob.function | Existing event | Same | Existing registry | Existing test |
| `apps/server/src/identity/messaging/inngest/jobs/expire-ice-cream-shop-onboardings-job.ts` | Modify | ExpireIceCreamShopOnboardingsJob.function | Existing cron | Same | Existing registry | New test |
| `apps/server/src/pdv/messaging/inngest/jobs/revalidate-combos-for-product-job.ts` | Modify | RevalidateCombosForProductJob.function | Existing event | Same | Existing registry | Existing test |
| `apps/server/src/shared/messaging/inngest/jobs/cleanup-published-events-job.ts` | Modify | CleanupPublishedEventsJob.function | Existing cron | Same | Existing registry | Existing test |
| `apps/server/src/shared/messaging/inngest/jobs/reprocess-events-job.ts` | Modify | ReprocessEventsJob.function | Local/test cron only | Observer inert locally/tests | Existing gate | Existing test |
| `apps/server/src/communication/messaging/inngest/jobs/tests/send-invitation-email-job.test.ts` | Modify | Terminal cases | Existing fixture | One terminal metric, no payload | Fixture | Job |
| `apps/server/src/communication/messaging/inngest/jobs/tests/send-onboarding-confirmation-email-job.test.ts` | Modify | Terminal cases | Existing fixture | Same | Fixture | Job |
| `apps/server/src/communication/messaging/inngest/jobs/tests/send-password-recovery-email-job.test.ts` | Modify | Terminal cases | Existing fixture | Same | Fixture | Job |
| `apps/server/src/communication/messaging/inngest/jobs/tests/create-in-product-notifications-job.test.ts` | Modify | Terminal cases | Existing fixture | Same | Fixture | Job |
| `apps/server/src/identity/messaging/inngest/jobs/tests/expire-ice-cream-shop-onboardings-job.test.ts` | Create | Terminal cases | Use IdentityModuleFixture's registered cron setup | Success/failure, no payload | Existing module fixture lifecycle | Job |
| `apps/server/src/pdv/messaging/inngest/jobs/tests/revalidate-combos-for-product-job.test.ts` | Modify | Terminal cases | Existing fixture | Same | Fixture | Job |
| `apps/server/src/shared/messaging/inngest/jobs/tests/cleanup-published-events-job.test.ts` | Modify | Terminal cases | Existing fixture | Same | Fixture | Job |
| `apps/server/src/shared/messaging/inngest/jobs/tests/reprocess-events-job.test.ts` | Modify | No-export | Local/test | No export | Gate | Job |
| `apps/server/src/communication/fixtures/communication-module-fixture.ts` | Modify | CommunicationModuleFixture.register | Existing events and job registry | Resolve notifications job through real Nest module and Inngest fixture | Test lifecycle | Communication job tests |
| `apps/server/src/identity/fixtures/identity-module-fixture.ts` | Modify | IdentityModuleFixture.register | Existing cron job registration | Compose real Nest/Inngest fixture and controlled provider dependencies | Test lifecycle | Identity job test |
| `apps/server/src/pdv/fixtures/pdv-module-fixture.ts` | Modify | PdvModuleFixture.register | Existing product event | Resolve job through real Nest module and Inngest fixture, no repository mock | Test lifecycle | PDV job test |
| `apps/server/src/shared/messaging/fixtures/shared-messaging-module-fixture.ts` | Create | SharedMessagingModuleFixture.register | Existing cleanup/reprocess cron functions | Compose RestFixture and InngestFixture; resolve cleanup from SharedMessagingModule and dev/test-only reprocess from existing AppModule conditional registration, never manual constructors | Test lifecycle and teardown | Shared job tests |

## apps/server — Composition

| Composition boundary | Kind/scope | Imports/dependencies | Provides/exports | Consumers | Lifecycle/order |
| --- | --- | --- | --- | --- | --- |
| Nest/build | Root/build | Early Sentry, ProvisionModule, job registry | One SDK/project per mode | REST/auth/Inngest | Init before modules, upload before release |

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/shared/messaging/shared-messaging.module.ts` | Modify | SharedMessagingModule | Re-export the imported `ProvisionModule` | Makes ProvisionModule's `TELEMETRY` export available to nested job modules importing SharedMessagingModule, following Nest's module export contract | Inngest job terminal observations | PDV and other messaging modules |
| `apps/server/src/main.ts` | Modify | createApp/bootstrap | SDK init before dynamic AppModule import; compose Nest logger dependency | One SDK/process; preserve createApp; HTTP observer registration remains in App.configureHttpApp | Nest/provision | Runtime |
| `apps/server/src/app.ts` | Modify | App.configureHttpApp | HTTP finish observer/filter injection | Preserve CORS/auth/parser order | Metrics/errors | Routes |
| `apps/server/package.json` | Modify | Sentry Nest/webpack upload dependencies | Compatible versions | Build/runtime | Init/upload | pnpm-lock.yaml |
| `apps/server/webpack.config.cjs` | Modify | Map/upload plugin | SHA/org/project, private maps | Build fails on upload | Server release | Docker |
| `apps/server/Dockerfile` | Modify | Build/runtime | BuildKit token secret, SHA/project inputs, runtime DSN/mode/SHA | No token/maps in image | Webpack/Nest | Staging |
| `apps/server/.env.example` | Modify | Placeholders | Empty local DSN/release | No credentials | serverEnvSchema | Developer setup |

## Repository delivery composition

| Composition boundary | Kind/scope | Imports/dependencies | Provides/exports | Consumers | Lifecycle/order |
| --- | --- | --- | --- | --- | --- |
| Staging CD | GitHub Actions | Env file, SHA, BuildKit secret | Web/server staging builds | Heroku | Upload before release |

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- |
| `.github/workflows/web-app-staging-cd.yml` | Modify | Web staging | stg, web project/DSN/SHA, upload token via secret | Reject missing/upload failure | Docker | Heroku |
| `.github/workflows/server-app-staging-cd.yml` | Modify | Server staging | stg, server project/DSN/SHA, upload token via secret | Reject missing/upload failure | Docker | Heroku |
| `pnpm-lock.yaml` | Modify | Dependency resolution | SDK/upload versions | Frozen install | Packages | pnpm output |
| `.code-multivitals-baseline.json` | Generate | Repository complexity baseline | Record accepted post-refactor signatures and the three existing Web layout signatures that currently fail the base CI complexity gate; do not change metric thresholds or config | Reviewed generated diff; only current feature signatures and these exact existing `AppLayout`, `UserMenu` and `SidebarNavigation` signatures change; no clone changes | `pnpm check:complexity` | CodeMultiVitals |

**Allowed paths** are the affected-path rows above. Module fixtures own test-only Nest/Inngest composition, including the Identity job test. The generated complexity baseline is updated only after the candidate is behaviorally complete and its exact diff is reviewed; no threshold or configuration changes are in scope. Revision 9 permits exactly three unchanged Web signatures—`AppLayout` in `apps/web/src/ui/shared/widgets/layouts/app-layout/index.tsx`, `UserMenu` in `apps/web/src/ui/shared/widgets/layouts/app-layout/user-menu/index.tsx`, and `SidebarNavigation` in `apps/web/src/ui/shared/widgets/layouts/app-layout/sidebar/sidebar-navigation/index.tsx`—because the current base CI fails on those records and excluding them leaves the required complexity gate red. Do not change those source files. Reject all other unrelated function records and every clone change. Prohibited: Core business modules, PRDs, UI widgets, route files, REST controllers/examples, database models/migrations, event payloads, generated route tree, and changes to the existing web unit tests for browser environment, Axios transport, and SSR session resolution. Production deployment is external; apply matching mapping/gates there without inventing a checked-in workflow.

## Technical decisions

| Decision | Chosen approach | Alternative considered | Reason | Accepted trade-off |
| --- | --- | --- | --- | --- |
| Projects | Four app/environment projects | Two app-only projects | User-selected separation | Four DSNs |
| Metrics | Independent count/distribution and sampled traces | Span-only | Counts survive 10% trace sampling | Metric volume |
| Job outcome | One terminal observation | Per-attempt count | Retries should not inflate outcome | Terminal callbacks in jobs; best-effort export |
| Release | SHA/private maps, upload failure stops deploy | Unmapped stacks | Readable production stacks | Build token/dependency |

# 4. Validation Contract

Expected evidence is [evaluation.md](./evaluation.md) at implementation kickoff. Validation is repository-local: automated tests, controlled SDK/build probes, source/configuration inspection and artifact checks. It must not send telemetry to the user's Sentry account. Project existence, remote ingestion, production alert/email delivery and deployed release/map alignment are operational follow-up and do not block this Spec. No staging or production account verification is required.

## Test file structure

| Test file | Test type | Target | Coverage goal |
| --- | --- | --- | --- |
| apps/server/src/shared/rest/controllers/tests/check-health.controller.test.ts | integration | HTTP/filter | Metrics, expected 503, unknown 500 |
| Eight job test paths in Messaging map | Inngest integration | Registered jobs via module fixtures | Terminal vs retry/step, existing effects |
| apps/web/tests/health/playwright-cli-health.test.ts | browser smoke | Local login route | No Sentry export/regression |

## Test cases by file

| Test file | Test case | Description | Assertions |
| --- | --- | --- | --- |
| apps/server/src/shared/rest/controllers/tests/check-health.controller.test.ts | HTTP result | Real RestFixture/DatabaseFixture: healthy, expected unavailable, unknown | Status/body, one outcome/duration, only unknown capture |
| Communication job tests in Messaging map | terminal delivery | Success/retry/terminal failure | One terminal outcome/duration, no recipient/event payload, same delivery |
| Identity/PDV/shared job tests in Messaging map | terminal work | Cron/event success/failure | One terminal metric, no attempt/step inflation, same effects |
| apps/web/tests/health/playwright-cli-health.test.ts | local smoke | Browser login navigation | Visible result/URL, no Sentry request, classified diagnostics |

## Acceptance coverage

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| AC-01 | Config/schema inspection; HTTP/job tests | None | EV-* app/environment DSN and release selection; no account-ingestion claim |
| AC-02 | HTTP/job tests | None | EV-* expected-error handling and terminal retry behavior |
| AC-03 | HTTP/job tests | None | EV-* sanitized logs |
| AC-04 | Playwright smoke; controlled local receiver; job integration | None | EV-* browser/API propagation boundary and configured job tracing |
| AC-05 | HTTP/job tests | None | EV-* six metrics/units/dimensions |
| AC-06 | Browser SDK configuration inspection | None | EV-* replay masking options; no captured replay required |
| AC-07 | Config/smoke/build | MV-03 | EV-* no-export and deployed build gates |
| AC-08 | Controlled builds, uploader failure harness, image/artifact inspection | None | EV-* private map generation/configuration and fail-closed behavior |

### MV-03 — Local/test no-export and gates

Prerequisites: local services healthy as needed. Start at the login route at **390 × 844**.

1. Run Playwright CLI health smoke and keyboard navigation. Assert final URL, visible health state, no Sentry-targeted request and classified console/network.
2. Run controlled config/build checks with missing deployed DSN/SHA and simulated failed upload. stg/prod reject before release; dev/test remain inert. Automated tests send no live events.

| Command | Purpose/coverage |
| --- | --- |
| pnpm install --frozen-lockfile | Lockfile consistency |
| pnpm --filter @scoops/core check:code; pnpm --filter @scoops/core check:architecture; pnpm --filter @scoops/core check:types; pnpm --filter @scoops/core test:coverage | Core port/coverage |
| pnpm --filter @scoops/validation check:code; pnpm --filter @scoops/validation check:architecture; pnpm --filter @scoops/validation check:types | Environment schemas |
| pnpm --filter server check:code; pnpm --filter server check:architecture; pnpm --filter server check:types; pnpm --filter server test:coverage; pnpm --filter server build | Server HTTP/jobs/build |
| pnpm --filter server exec vitest list --config vitest.inngest.config.mts; pnpm --filter server test:inngest | Docker-backed job discovery and actual integration execution; default server coverage excludes these tests |
| pnpm --filter web check:code; pnpm --filter web check:architecture; pnpm --filter web check:types; pnpm --filter web test:coverage; pnpm --filter web test:integration; pnpm --filter web build | Web browser/SSR/build |
| pnpm check:test-integrity; pnpm update:complexity-baseline; pnpm check:complexity; pnpm check:architecture | Test ownership, reviewed intentional complexity baseline update without threshold changes, and dependencies |
| pnpm check:spec-implementation -- documentation/features/shared/sentry-monitoring/spec.md | Implementation path/diff gate |

# 5. Documentation alignment and revision history

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| documentation/architecture.md | Observability/isolation/privacy/deployment | aligned during conclusion | Sections 15–16 and 19 now document the shared Sentry boundary, privacy/origin rules, private source-map lifecycle, staging workflows and the absence of a production workflow |
| documentation/modules.md | Module ownership | confirmed | Shared telemetry observes, no business behavior moves |
| documentation/sdd.md | Lifecycle/evidence/review | confirmed | Complete Spec and reviewer |
| documentation/tooling.md | Commands/Docker/Playwright/coverage | confirmed | Production CD not checked in |
| documentation/design.md | UI design | confirmed | No rendered UI/design screenshots |
| Issue #42 | Outcome/acceptance | partial | Repository monitoring, privacy and release-build contracts are implemented; account-level alert setup/delivery and remote Sentry evidence are outside this Spec's acceptance |

| Rule | Applies to | Evaluated revision |
| --- | --- | --- |
| documentation/rules/code-conventions-rules.md | TypeScript | b6d5fe18 |
| documentation/rules/core-package-rules.md | Shared port | b6d5fe18 |
| documentation/rules/validation-package-rules.md | Env schemas | b6d5fe18 |
| documentation/rules/provision-layer-rules.md | Sentry adapters | b6d5fe18 |
| documentation/rules/server-app-layer-rules.md | Nest bootstrap and shared application composition | b6d5fe18 |
| documentation/rules/messaging-layer-rules.md | Inngest | b6d5fe18 |
| documentation/rules/rest-layer-rules.md | Error/transport | b6d5fe18 |
| documentation/rules/ui-layer-rules.md | Web app | b6d5fe18 |
| documentation/rules/web-app-routing-rules.md | Router/smoke | b6d5fe18 |
| documentation/rules/widget-testing-rules.md | Browser route integration/health smoke | b6d5fe18 |
| documentation/rules/controllers-testing-rules.md | HTTP integration | b6d5fe18 |
| documentation/rules/database-layer-rules.md | Database-backed health controller fixture | b6d5fe18 |
| documentation/rules/jobs-testing-rules.md | Eight Inngest job suites/fixtures and CI | b6d5fe18 |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| 1 | 2026-09-24 | Initial monitoring Contract | Issue #42 and confirmed Q1–Q13 |
| 2 | 2026-09-24 | Removed three web unit test paths from implementation scope; moved their Sentry checks to browser and manual validation | User correction |
| 3 | 2026-09-24 | Removed deliberate staging browser/SSR/API failure triggers, added passive production release/map evidence and Rule Pack entries | Confirmed validation amendment |
| 4 | 2026-09-24 | Added the shared messaging module export path for the existing operational telemetry provider | Real Nest job registration exposed a missing token re-export required by the contracted PDV and reprocess observers; no event or job behavior changes |
| 5 | 2026-09-24 | Removed staging/production Sentry account verification, remote ingestion, deployed release/map comparison and alert/email delivery from the acceptance gate; retained repository-local DSN selection, privacy, trace, metric, replay configuration and fail-closed map-build contracts | User directed that external Sentry verifications must not block this Spec |
| 6 | 2026-09-24 | Restore the Web telemetry log adapter to the user-selected `sentry-log.ts` path and define both Web Sentry modules as factory-backed adapters under repository conventions | User specified the canonical Web module paths and factory construction while revision 5 named an alternate provider filename |
| 7 | 2026-09-24 | Restore the Web Sentry factories to the user-confirmed `apps/web/src/provision/sentry/sentry-browser.ts` and `sentry-log.ts` paths while retaining the approved factory APIs | A concurrent Web provision path rewrite conflicted with the user's explicit canonical paths; no telemetry behavior or Server path contract changed |
| 8 | 2026-09-25 | Add the generated complexity baseline as a reviewed path and retain module-owned Identity/Inngest fixture composition | The candidate exposes new warning-level functions and requires an intentional baseline record after code review; repository Rules require the IdentityModuleFixture to compose real Nest/Inngest job fixtures |
| 9 | 2026-09-25 | Permit exactly three current unchanged Web layout signatures in the generated baseline to clear the existing base CI complexity failure | The narrowed feature-only baseline still leaves AppLayout, UserMenu and SidebarNavigation as the three Web complexity failures; no source, threshold, configuration or clone change is authorized |
