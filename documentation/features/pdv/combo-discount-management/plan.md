---
title: Combo discount management — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 10
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/22
updated_at: 2026-08-26
---

# Combo discount management — implementation plan

## Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `10`, status `in_progress`.
- **Plan rationale:** Plan-backed execution is required because this delivery crosses Core, Validation, transactional PDV persistence and migration generation, MRP-owned event publication, provider and messaging boundaries, eight REST operations, protected multi-route Web UI, optimistic concurrency, tenant authorization and real full-stack validation.
- **Current phase:** F7 integrated validation and handoff for Spec revision 10 — Discounts list mobile filter evidence is complete.
- **Next action:** Route to `conclude-spec` when delivery publication is requested.
- **Active blockers:** None identified in planning; all five saved design references, the manifest and the explicit revision-10 mobile reference are recorded and dimension-verified.
- **Active Builders:** None; Builder Web completed the revision-10 Discounts list correction. The Orchestrator owns final handoff.
- **Shared/generated ownership:** The Orchestrator owns package/lockfile changes, shared-file conflicts, Drizzle migration generation and metadata review (`0014_combo_discount_management.sql`, snapshot and journal), `apps/web/src/routeTree.gen.ts` regeneration, and final integration. Builder Server owns feature schema-barrel edits with Orchestrator coordination; Builder Web owns route sources, never generated route output.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core contracts and MRP-facing structures | — | — | `completed` | Core domain structures, events, interfaces, fakers and public barrels remain conformant to Spec revision 7 and pass Core code/type checks. |
| 2 | `Builder Core` | F2 | Combo use cases and authoritative MRP event facts | F1 | F3, F4 | `completed` | Nine PDV actions, the MRP snapshot action and all affected MRP publishers pass Core code/type/unit sensors with deterministic event and concurrency coverage. |
| 2 | `Builder Validation` | F3 | Shared PDV and MRP transport schemas | F1 | F2, F4 | `completed` | All declared save/update/list/catalog/lifecycle/form/event schemas are exported and pass Validation code/type checks without business or tenant rules. |
| 2 | `Builder Server` | F4 | Transactional persistence and catalog provision | F1 | F2, F3 | `completed` | Tenant-scoped Combo persistence, shared production seed wiring, serializable transaction composition, catalog adapter/module and reviewed migration are ready for server composition. |
| 3 | `Builder Server` | F5 | Messaging and REST operations | F2, F3, F4 | F6 | `completed` | MRP publishers are wired to the broker, the revalidation job is registered, all eight controllers are composed, and real controller tests prove HTTP, persistence, authorization, tenant and provider effects. |
| 3 | `Builder Web` | F6 | Protected Combo management experience | F1, F3 | F5 | `completed` | Routes, service, cache/query/action consumers, widgets and mocked-transport route suites satisfy the exact Spec widget tree, accessible/responsive states and UI-to-REST contract, including the selected primary filter, product-removal confirmation state and mobile full-width Discounts filters. |
| 4 | `Orchestrator` | F7 | Integrated validation and handoff | F5, F6 | — | `in_progress` | Integrated sensors, shared seed verification, migration/build checks, real server-backed MV-01–MV-05 and current visual evidence leave no blocking finding before `conclude-spec`. |

### F1 — Core contracts and MRP-facing structures

#### F1-T1 — Publish Combo domain, catalog projections, events and ports

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** No dependency; F1-T2 consumes these declarations. No active path overlap with Validation or Server.
- **Paths:** `packages/core/src/pdv/domain/entities/combo.ts`; `packages/core/src/pdv/domain/structures/{combo-create,combo-update,combo-actor,combo-list-params,discount-component,portion-discount-component,resale-discount-component,combo-component-details,combo-details,sales-catalog-product,sales-catalog-brand}.ts`; `packages/core/src/mrp/domain/structures/product-sales-configuration.ts`; `packages/core/src/pdv/domain/events/discount-deleted-event.ts`; `packages/core/src/mrp/domain/events/product-sales-configuration-changed-event.ts`; the affected PDV/MRP `domain/{entities,structures,events}/index.ts` barrels; `packages/core/src/pdv/interfaces/{discounts-repository,sales-catalog-provider,pdv-database,pdv-service}.ts` and `interfaces/index.ts`.
- **Contract:** `RF-01`, `RF-04`–`RF-06`, `RF-10`–`RF-12`; `CA-01`, `CA-05`, `CA-06`, `CA-12`, `CA-13`; Technical Contract Core domain, events, interfaces and boundary contracts.
- **Outcome:** Core exposes identity-correct, discriminated Portion/Resale components; tenant/actor/list/version contracts; current catalog and authoritative MRP configuration facts; stable domain events; and repository/database/service capabilities with no framework, persistence or validation-package dependency.
- **Rules:** [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming, function declarations, declaration order, file naming and barrels); [`core-package-rules.md`](../../../rules/core-package-rules.md) (one exported type per file, entity identity, interfaces and event/domain ownership); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (core REST service contract); [`messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) (Core owns domain events and broker contract).
- **Exit:** Run `pnpm --filter @scoops/core check:code` and `pnpm --filter @scoops/core check:types`; inspect each public export against the Spec’s discriminators, tenant/version fields, money precision, event `_NAME` and no-provider-in-transaction contract.

#### F1-T2 — Add deterministic Combo entity fixtures and public faker exports

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1-T1; sequential within Builder Core so every use-case and integration fixture consumes one valid aggregate shape.
- **Paths:** `packages/core/src/pdv/domain/entities/fakers/combo-faker.ts`; `packages/core/src/pdv/domain/entities/fakers/index.ts`; `packages/core/src/pdv/domain/entities/index.ts`.
- **Contract:** `RF-04`–`RF-06`; `CA-05`, `CA-06`, `CA-09`, `CA-12`, `CA-15`; Technical Contract ComboFaker and export ownership.
- **Outcome:** Tests can create valid, independently generated Combos with explicit relationship overrides and stable timestamps without leaking faker behavior into production entities or the production entity barrel.
- **Rules:** [`core-package-rules.md`](../../../rules/core-package-rules.md) (domain faker conventions, one exported type per file and entity identity); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (colocated fakers, valid defaults and deterministic test data); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming and barrels).
- **Exit:** Run Core code/type checks and inspect `fake`/`fakeMany` for valid defaults, explicit override precedence, independent records and canonical faker-barrel export.

### F2 — Combo use cases and authoritative MRP event facts

#### F2-T1 — Implement Combo application actions and infrastructure-free unit coverage

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1; may run in parallel with F3 and F4. All nine PDV use cases and their tests remain one Core ownership boundary.
- **Paths:** `packages/core/src/pdv/use-cases/{list-combos,get-combo,list-combo-products,register-combo,revise-combo,inactivate-combo,reactivate-combo,remove-combo,revalidate-combos-for-product}-use-case.ts`; `packages/core/src/pdv/use-cases/index.ts`; matching files under `packages/core/src/pdv/use-cases/tests/`.
- **Contract:** `RF-01`–`RF-11`; `CA-01`–`CA-11`, `CA-13`, `CA-15`; Technical Contract PDV use-case signatures, serializable writes, current catalog pricing, status transitions, safe errors, expected versions and post-commit events.
- **Outcome:** Manager authorization and establishment scope, duplicate/name/component validation, current MRP price decisions, list/detail enrichment, create/edit/lifecycle/delete behavior, conflict recovery and idempotent event-driven revalidation are enforced in verb-led Core actions.
- **Rules:** [`core-package-rules.md`](../../../rules/core-package-rules.md) (business rules belong in use cases and contracts in interfaces); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (standard use-case shape, one test file per use case, typed mocks, deterministic time, fakers and infrastructure-free tests); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (AppError translation, class-owned helpers and declaration order); [`messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) (Broker contract and completed-fact publication).
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types` and `pnpm --filter @scoops/core test`; verify returned domain values and calls cover role/tenant, normalized uniqueness, pricing/rounding, provider failure, stale version, lifecycle idempotency, deletion and repeat-safe revalidation.

#### F2-T2 — Build complete MRP sales-configuration snapshots and publish after mutation

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1-T1 and may proceed in parallel with F3/F4; sequential after F2-T1 only for shared Core test and export coordination.
- **Paths:** `packages/core/src/mrp/use-cases/get-affected-product-sales-configurations-use-case.ts`; `packages/core/src/mrp/use-cases/index.ts`; the fifteen affected MRP mutation use cases named in the Spec (`update-product-settings`, `change-product-categories`, `change-product-unit`, size, resale, brand, accompaniment and product-removal actions); matching MRP use-case tests under `packages/core/src/mrp/use-cases/tests/`; `packages/core/src/mrp/use-cases/tests/get-affected-product-sales-configurations-use-case.test.ts`.
- **Contract:** `RF-10`; `CA-12`, `CA-13`; Technical Contract MRP snapshot-builder signature, inverse Portion owners, deleted tombstone, post-commit direct publication and unchanged existing mutation responses.
- **Outcome:** Every relevant MRP mutation produces a complete tenant-qualified commercial snapshot or deletion tombstone only after a successful transaction, including inverse accompaniment owners; stock-only changes remain outside invalidation.
- **Rules:** [`core-package-rules.md`](../../../rules/core-package-rules.md) (MRP business rules remain in use cases and no cross-module repository leakage); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (one test per use case, typed repository/Broker mocks, deterministic inputs and no infrastructure); [`messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) (originating module builds authoritative event data and direct publication boundary); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (verb-led declarations and application errors).
- **Exit:** Run the Core code/type/unit sensors; assert complete changed/inverse-owner snapshots, tenant qualification, tombstones, no event before failed/rolled-back mutations, one event per owner and unchanged stock-adjustment behavior.

### F3 — Shared PDV and MRP transport schemas

#### F3-T1 — Add and export boundary schemas for REST, forms, routes and events

- **Status/owner:** `completed` — Builder Validation
- **Depends/parallel:** Depends on F1’s Core enums/structures; may run in parallel with F2 and F4. Consumer wiring waits for the root exports.
- **Paths:** `packages/validation/src/pdv/{save-combo-schema,update-combo-schema,combo-list-query-schema,combo-catalog-query-schema,combo-lifecycle-schema}.ts`; `packages/validation/src/web/combo-discount-form-schema.ts`; `packages/validation/src/mrp/product-sales-configuration-changed-event-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** `RF-02`–`RF-06`, `RF-08`–`RF-10`, `RF-12`; `CA-02`–`CA-06`, `CA-09`, `CA-12`, `CA-14`; Technical Contract Validation schema table and serialized ISO-date event parity.
- **Outcome:** Shared Zod schemas provide syntactic limits, discriminators, currency/form feedback, URL defaults, lifecycle versions and available/deleted event payload validation while leaving authorization, tenant ownership, MRP state and pricing decisions to Server/Core.
- **Rules:** [`validation-package-rules.md`](../../../rules/validation-package-rules.md) (ownership/dependency direction, one schema per file, Core-derived enums, consumer boundaries and root exports); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming and explicit source-backed exports); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (route search transport shape).
- **Exit:** Run `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; inspect root exports and schemas for exact component unions, page defaults, ISO date conversion, no duplicate definitions and no business/tenant refinement.

### F4 — Transactional persistence and catalog provision

#### F4-T1 — Implement the PDV Combo aggregate persistence boundary

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1; may run in parallel with F2 and F3. Migration output is generated and reviewed by the Orchestrator after the model/schema changes.
- **Paths:** `apps/server/src/pdv/constants/pdv-repositories.ts`; `apps/server/src/pdv/database/drizzle/models/{discount-status-model,discount-type-model,discount-component-kind-model,discount-model,discount-component-model,discount-component-accompaniment-model}.ts`; model/type/mapper/repository barrels and files under `apps/server/src/pdv/database/drizzle/{index.ts,types,mappers,repositories}`; `apps/server/src/pdv/database/drizzle/repositories/drizzle-pdv-database.ts`; `apps/server/src/pdv/database/pdv-database.module.ts`; `apps/server/src/pdv/database/pdv-seeder.ts`; `apps/server/src/shared/database/seed.ts`; `apps/server/src/shared/database/drizzle/schema.ts`.
- **Contract:** `RF-01`, `RF-02`, `RF-04`, `RF-06`–`RF-11`; `CA-01`, `CA-02`, `CA-06`–`CA-12`, `CA-15`; Technical Contract normalized tables, constraints, mapper, repository methods, transaction scope, serializable retry, seeder and no cross-module foreign keys.
- **Outcome:** Drizzle persistence atomically round-trips Combo aggregates, enforces tenant/name/component integrity, supports stable page/dependency/version queries, clears/seeds through domain contracts, and the shared production seed resolves generated MRP IDs before inserting valid Combo aggregates without a provider inside the retryable transaction.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (module ownership, model declarations, persistence types, mappers, repository vocabulary/tokens, no repository tests and seeder lifecycle); [`server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) (feature database composition); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases, naming and barrels); [`core-package-rules.md`](../../../rules/core-package-rules.md) (repository contracts remain Core-owned).
- **Exit:** Generate `0014_combo_discount_management` with `pnpm --filter server db:migration:generate -- --name combo_discount_management`, review the generated SQL/snapshot/journal for all enums/tables/indexes/checks and no MRP FKs, apply with `pnpm --filter server db:migration:apply`, run the focused Server code/type checks after composition, and inspect the shared seed for name-based MRP reference resolution and valid Combo payloads. `EV-39` passes these checks; `pnpm --filter server db:seed` remains an explicit disposable/local-database operation because it resets Auth/application data.

#### F4-T2 — Map the MRP catalog into the PDV provider contract

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1 catalog structures and the exported MRP database contract; sequential with F4-T1 inside Builder Server, no path overlap.
- **Paths:** `apps/server/src/pdv/provision/mrp/mrp-sales-catalog-provider.ts`; `apps/server/src/pdv/provision/mrp/tests/mrp-sales-catalog-provider.test.ts`; `apps/server/src/pdv/provision/pdv-provision.module.ts`; `apps/server/src/pdv/constants/pdv-providers.ts` and its barrel.
- **Contract:** `RF-04`–`RF-06`, `RF-08`–`RF-10`; `CA-05`, `CA-06`, `CA-07`–`CA-13`; Technical Contract `SalesCatalogProvider`, batch/current facts, Portion/Resale mapping and commercial-active versus stock-available semantics.
- **Outcome:** A singleton PDV adapter batch-maps tenant-scoped MRP products, sizes, exact accompaniment links, single/by-brand resale prices and active flags, translating missing/provider failures safely without importing MRP internals into Core or applying business policy in the adapter.
- **Rules:** [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md) (Core contract, module registration, infrastructure-only provider and mock-based provider tests); [`server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) (provision module owns adapter registration); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (cross-module persistence ownership); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (server aliases and naming).
- **Exit:** Run the provider-focused test with typed mocks and inspect exact IDs/prices/active/available mapping, batch order, search, tenant scope and safe failure translation; confirm `PdvProvisionModule` exports only the Core token.

### F5 — Messaging and REST operations

#### F5-T1 — Register authoritative revalidation messaging and MRP broker wiring

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F2 event/use-case contracts, F3 event schema and F4 PDV database; may run in parallel with F6 after those contracts are stable.
- **Paths:** `apps/server/src/pdv/messaging/inngest/jobs/revalidate-combos-for-product-job.ts`; its test and `index.ts`; `apps/server/src/pdv/messaging/pdv-messaging.module.ts`; `apps/server/src/pdv/pdv.module.ts`; `apps/server/src/app.module.ts`; the thirteen MRP controllers listed in the Spec that inject `Broker` into the revised mutation use cases.
- **Contract:** `RF-10`; `CA-12`, `CA-13`; Technical Contract job function/step IDs, event trigger schema, establishment/product concurrency key, retry/idempotency behavior, feature messaging module and single root Inngest registry.
- **Outcome:** MRP commits publish complete facts through the shared broker, the PDV job validates and durably revalidates only through the Core action, and Nest composition exposes one feature messaging/provision/database graph without a second Inngest endpoint or job-local business rules.
- **Rules:** [`messaging-layer-rules.md`](../../../rules/messaging-layer-rules.md) (Core events, authoritative origin, shared infrastructure, `this.function`, runtime schemas, durable steps and direct publication); [`server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) (feature messaging module owns jobs and dependencies); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (class-owned handlers and AppError boundaries); [`core-package-rules.md`](../../../rules/core-package-rules.md) (business decisions stay in Core).
- **Exit:** Run the job test for available/deleted/malformed/retry payloads and the full Server checks; inspect stable function/step IDs, `_NAME` usage, validated serialized dates, retry behavior, concurrency key and repeat-safe resulting Combo statuses.

#### F5-T2 — Expose the eight Manager-only Combo REST actions with real integration tests

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F2, F3, F4 and F5-T1; sequential within Builder Server. F6 may use the same frozen HTTP contract through mocked transport.
- **Paths:** `apps/server/src/pdv/decorators/{discounts-controller,index}.ts`; eight Combo controller files and their eight test files under `apps/server/src/pdv/rest/controllers/{,tests/}`; DTOs/barrels under `apps/server/src/pdv/rest/dtos`; `apps/server/src/pdv/rest/controllers/index.ts`; `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`; `apps/server/rest-client/pdv/discounts.rest`; `apps/server/rest-client/mrp/products.rest` for the affected MRP configuration examples.
- **Contract:** `RF-01`–`RF-11`; `CA-01`–`CA-15`; Technical Contract REST operation table, DTO/date mapping, static catalog-route ordering, Manager/current-account source, safe statuses/errors and fixture requirements.
- **Outcome:** Thin, documented controllers invoke one use case each, preserve the current tenant source, serialize Combo/detail/catalog responses and provide manual HTTP examples; real Nest/PostgreSQL/auth tests prove every response, persisted effect, version conflict, provider failure and tenant-safe denial.
- **Rules:** [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (group decorator, semantic route parameters, one action/controller, constructor wiring, derived request types, documented responses, route ownership and REST client); [`controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) (real HTTP/application wiring, module fixture, isolation and HTTP/persistence assertions); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (token-based repository injection and indirect persistence verification); [`server-app-layer-rules.md`](../../../rules/server-app-layer-rules.md) (feature module composition); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases and AppError boundaries).
- **Exit:** Run the eight focused controller suites plus `pnpm --filter server check:code`, `pnpm --filter server check:types` and `pnpm --filter server test`; assert real Manager/Operator status/body behavior, aggregate round trips, stable paging/search, catalog mapping, 409 recovery, lifecycle/delete semantics and no MRP cascade. Verify both REST-client files cover every affected route with current methods, paths, headers, variables and representative bodies.

### F6 — Protected Combo management experience

#### F6-T1 — Build the Discounts list, chooser, route boundary and REST consumers

- **Status/owner:** `completed` — Builder Web (revision-10 responsive correction)
- **Depends/parallel:** Depends on F1 and F3; may run in parallel with F5 using the Spec’s frozen HTTP contract and mocked transport.
- **Paths:** `apps/web/src/constants/routes.ts`; `apps/web/src/routes/_authenticated/discounts/index.tsx`; `apps/web/src/constants/sidebar-items.ts`; `apps/web/src/rest/services/pdv-service.ts`; `apps/web/src/ui/pdv/hooks/discount-query-keys.ts`; module-level list query under `apps/web/src/ui/pdv/hooks/` and widgets/tests under `apps/web/src/ui/pdv/widgets/pages/discounts-page/`; `apps/web/tests/routes/pdv/discounts.index.test.tsx`.
- **Contract:** `RF-01`–`RF-03`, `RF-12`; `CA-01`–`CA-04`, `CA-13`, `CA-14`; Design Contract [`design/manifest.md`](./design/manifest.md) for `XkdtM.png` and `OjX10.png`; Technical Contract route constants, list query, service mapping, widget tree and accepted recovery states.
- **Outcome:** Manager-only `/discounts` uses canonical URL search/filter/page state, renders the populated/list loading/empty/error states, keeps future discount types disabled, navigates to Combo creation/details, hides Operator navigation and preserves focus/retry behavior through the declared owning page/list/dialog widgets. On narrow mobile viewports, the search, Type and Status controls stack at full available width; desktop keeps the existing inline/compact arrangement.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (feature boundaries, stateful widget/hooks, action/query ownership, shared wrappers/status constants, navigation, sidebar, design tokens, composite focus and dialog header); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (canonical paths, thin protected route, search validation, generated tree, route matrix, mocked transport and failure boundaries); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (owning-boundary tests, state/action matrix, hook mocks, accessible assertions and route separation); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (factory service and consumer-owned transport coverage); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (names and declaration order).
- **Exit:** Render explicit pt-BR labels in both closed Select triggers and popup items while preserving `all`/`active`/`inactive`/`combo` as internal and URL values; assert default and active states in the owning widget/route suites; assert the search, Type and Status controls occupy the available mobile list width while desktop remains inline; run focused Vitest, Web code/types and the Discounts list Playwright scenario; inspect a fresh narrow-viewport screenshot with no raw English value visible.

#### F6-T2 — Normalize module query/action hooks and complete Combo widget ownership

- **Status/owner:** `completed` — Builder Web (`/root/builder_fix_brand_checkbox`, brand-checkbox correction)
- **Depends/parallel:** Depends on F6-T1 and F3; no active path overlap. The three route suites and widget tree remain consumer-owned; query/action hooks receive no dedicated tests.
- **Paths:** `apps/web/src/ui/shadcn/checkbox.tsx`; `apps/web/src/ui/pdv/hooks/{use-discounts-query,use-combo-query,use-create-combo-action,use-update-combo-action,use-inactivate-combo-action,use-reactivate-combo-action,use-delete-combo-action,use-combo-products-query}.ts`; `apps/web/src/routes/_authenticated/discounts/new.tsx`; `apps/web/src/routes/_authenticated/discounts/$discountId.tsx`; `apps/web/src/ui/pdv/widgets/pages/discounts-page/` and `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/` including page/widget entries, all stateful colocated owning hooks and declared tests; `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/combo-discount-form/remove-combo-product-dialog/`; `apps/web/tests/routes/pdv/discounts.new.test.tsx`; `apps/web/tests/routes/pdv/discounts.$discountId.test.tsx`.
- **Contract:** `RF-04`–`RF-12`; `CA-05`–`CA-15`; Design Contract [`design/manifest.md`](./design/manifest.md) for `B2aXS.png`, `zBoAn.png` and `t86j5.png`; Technical Contract exact UI tree, module-level query/action hook boundary, colocated widget behavior hooks, RHF/Zod form, totals, pending/recovery and route mappings.
- **Outcome:** Create and detail/edit routes compose the declared page/form/product/status/delete widgets with live cent-accurate totals, valid Portion/Resale configuration, duplicate exclusion, optimistic-conflict recovery, explicit lifecycle/delete confirmation, safe provider feedback and responsive accessible layouts.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (stateful/nested widgets, owning hooks, RHF/form validation, action/query hooks, status constants, feedback/toasts, shared Anchor/Icon/components, design tokens, composite focus and vertical dialog headers); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (canonical dynamic params, protected thin routes, route failure boundaries and mocked request/response/state assertions); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (public behavior, status/action matrix, hook seams, no dedicated query/action tests and accessible interaction tests); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (service factory and consumer-owned mapping); [`validation-package-rules.md`](../../../rules/validation-package-rules.md) (shared form schema consumer boundary); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (function form and declaration order).
- **Exit:** Preserved the completed filter/Checkbox work; added the `RemoveComboProductDialog` and owning hook; proved cancel leaves the component and confirm removes only the selected component with focus returning to the add-product control when the originating row is removed; reconciled stale manual fixed-price errors when derived totals change and enforced the active-only savings guard; changed Resale brand options to shared single-choice Checkbox controls with canonical IDs; reran Web code/types, focused consumer tests and the four-scenario create-route suite; captured fresh confirmation and brand-selector evidence. No dedicated query/action-hook tests were added.

### F7 — Integrated validation and handoff

#### F7-T1 — Verify integrated sensors, runtime evidence, visual conformance and review

- **Status/owner:** `completed` — Orchestrator (brand-checkbox correction integration)
- **Depends/parallel:** Depends on integrated F5/F6 diffs; no implementation Builder runs during final integration except a responsible Builder resumed through `implement-spec` for a verified finding.
- **Paths:** `documentation/features/pdv/combo-discount-management/evaluation.md` (created by `implement-spec`); `apps/server/src/mrp/database/mrp-seeder.ts`; `apps/server/src/shared/database/seed.ts`; `apps/server/src/pdv/provision/mrp/tests/mrp-sales-catalog-provider.test.ts`; `apps/web/tests/routes/pdv/discounts.new.test.tsx`; transient Playwright `test-results/` artifacts; no production path outside the Spec’s allowed/generated outputs without amendment.
- **Contract:** All `RF-*`/`CA-*`; `MV-01`–`MV-05`; Design Contract and final handoff condition.
- **Outcome:** Current integrated code, generated artifacts, migrations, service fixtures, five supplied visual comparisons, console/network records and real persistence/authorization/event traces are reconciled in Evaluation without claiming mocked route tests as backend evidence.
- **Rules:** [`sdd.md`](../../../sdd.md) (living evidence, integrated validation, reviewer correction loop and conclusion preflight); [`tooling.md`](../../../tooling.md) (workspace, migration, Vitest and Playwright commands); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (route matrix, browser prerequisites and console/network checks); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (completion criteria); [`design.md`](../../../design.md) (tokens, responsive/accessibility and visual comparison).
- **Exit:** Integrated Server/seed/REST-client/runtime evidence remains current; revision 10 Web list layout checks, route mobile-width scenario, fresh desktop/mobile screenshots and visual detector passed, Evaluation is ready, and no blocking finding remains. Route directly to `conclude-spec` when delivery publication is requested.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core PDV actions and MRP publishers | `CA-01`, `CA-04`–`CA-13`, `CA-15` | Spec Validation Contract | `./evaluation.md` Core command evidence | `passed` |
| Automated | Shared Validation schemas and consumers | `CA-06`, `CA-12`–`CA-14` | Spec Validation Contract | `./evaluation.md` Validation command evidence | `passed` |
| Runtime | Server REST, PostgreSQL, provider and messaging integration | `CA-01`–`CA-15` | Spec REST/Integration Contract | `./evaluation.md` controller, migration and event traces | `passed` |
| Automated | Web widget/page composition, module query/action boundary and owned behavior | `CA-02`–`CA-11`, `CA-13`–`CA-15` | Spec UI Test Contract | `./evaluation.md` Web Vitest and hook-tree evidence | `passed` |
| Browser | Mocked-transport route contracts | `CA-01`–`CA-04`, `CA-07`–`CA-11`, `CA-13`, `CA-14` | Spec route test files | `./evaluation.md` three Playwright route-suite results | `passed` |
| REST client | PDV Combo and affected MRP route-group examples | `CA-01`–`CA-13`, `CA-15` | Spec REST Contract | `./evaluation.md` EV-31 route/example parity | `passed` |
| Seed | Shared production database seed with MRP reference resolution, resale configurations and Combo records | `CA-02`, `CA-05`, `CA-07` | Spec database/seed Contract | `./evaluation.md` `EV-56` seed wiring, resale configuration and payload inspection | `passed` |
| Manual/runtime | `MV-01` — list, URL state and recovery | `CA-02`, `CA-03`, `CA-14` | [`Spec MV-01`](./spec.md) | `./evaluation.md` real GET timing, URL/query, recovery, DOM/console and fresh screenshot | `passed` |
| Manual/runtime | `MV-02` — type chooser and create | `CA-04`, `CA-07`, `CA-08`, `CA-13`, `CA-14` | [`Spec MV-02`](./spec.md) | `./evaluation.md` real POST/DB result, duplicate guard, retry and fresh screenshots | `passed` |
| Manual/runtime | `MV-03` — Portion configuration | `CA-05`, `CA-06`, `CA-14` | [`Spec MV-03`](./spec.md) | `./evaluation.md` catalog/configuration request, calculation and fresh screenshot | `passed` |
| Manual/runtime | `MV-04` — Resale configuration | `CA-05`, `CA-06`, `CA-14` | [`Spec MV-04`](./spec.md) | `./evaluation.md` brand/single-stock behavior, safe rejection and fresh screenshot | `passed` |
| Manual/runtime | `MV-05` — edit, lifecycle, invalidation and delete | `CA-09`–`CA-13`, `CA-15` | [`Spec MV-05`](./spec.md) | `./evaluation.md` PATCH/DELETE, conflict reload, DB/event/job/status and fresh screenshots | `passed` |
| Visual | Populated Discounts list — `1481 × 1050` | `CA-02`, `CA-03`, `CA-14` | [`design/XkdtM.png`](./design/XkdtM.png) | Fresh Playwright screenshot and comparison recorded in `./evaluation.md` | `passed` |
| Visual | Discount type chooser — surface `520 × 382`, saved PNG `670 × 532` | `CA-04`, `CA-14` | [`design/OjX10.png`](./design/OjX10.png) | Fresh Playwright screenshot and comparison recorded in `./evaluation.md` | `passed` |
| Visual | Combo create page — `1543 × 1050` | `CA-05`–`CA-08`, `CA-14` | [`design/B2aXS.png`](./design/B2aXS.png) | Fresh Playwright screenshot and comparison recorded in `./evaluation.md` | `passed` |
| Visual | Portion product dialog — surface `900 × 539`, saved PNG `1056 × 705` | `CA-05`, `CA-06`, `CA-14` | [`design/zBoAn.png`](./design/zBoAn.png) | Fresh Playwright screenshot and comparison recorded in `./evaluation.md` | `passed` |
| Visual | Resale product dialog — surface `900 × 536`, saved PNG `1056 × 702` | `CA-05`, `CA-06`, `CA-14` | [`design/t86j5.png`](./design/t86j5.png) | Fresh Playwright screenshot and comparison recorded in `./evaluation.md` | `passed` |

The final handoff requires all phases and tasks completed; current Spec validation commands on the integrated commit; generated migration and route artifacts reviewed; the shared production seed source verified with valid MRP references and Combo records; services, accounts and fixtures ready; every in-scope `MV-01`–`MV-05` executable; transient screenshot identifiers recorded; the five baseline visual comparisons plus the explicit revision-10 mobile reference passed; every verified finding resolved; and no blocking finding active. Then route directly to [`conclude-spec`](../../../prompts/conclude-spec-prompt.md).
