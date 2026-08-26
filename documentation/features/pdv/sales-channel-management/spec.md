---
title: Sales channel management
status: in_progress
revision: 1
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/21
scope:
  - packages/core/src/pdv
  - packages/validation/src
  - apps/server/src/pdv
  - apps/server/src/shared/database/drizzle/migrations
  - apps/web/src
  - apps/web/tests
last_updated_at: 2026-08-25
---

# 1. Context and scope

## Objective and source

Deliver PDV REQ-01 in `complete` mode so a Manager can manage optional, tenant-owned
sales channels and future sales can read only active channels, while historical order
snapshot contracts remain unchanged. The delivery source is GitHub Issue #21.

## Current behavior and product gap

Core already declares `SalesChannel`, `SalesChannelStatus`, `SalesChannelSnapshot`,
`SalesChannelsRepository`, and `PdvDatabase`, but has no PDV use cases or tests. Server
registers an empty `PdvModule`; Web exposes an Operator-visible `/sales-channels`
placeholder. No channel table, migration, REST operation, Validation schema, Web service,
stateful screen, or automated flow exists.

## Scope and product alignment

| Area | In scope | Out of scope |
| --- | --- | --- |
| Management | Manager list, create, edit name/percentage, inactivate, reactivate and confirmed delete | Operator management, bulk actions, pagination, channel search |
| Future-sale contract | Manager/Operator active-only read API; no default; alphabetical results | Order assembly, channel pricing, carts, payment, external delivery integrations |
| History | Preserve existing `SalesChannelSnapshot` shape and allow deletion without a historical FK | Order persistence, order history UI, `Ver pedidos` action |
| Design | Six saved Pencil references plus accepted narrow/state assumptions | Row descriptions shown only in sample data; functional header search |

| Source requirement | Delivery | Notes |
| --- | --- | --- |
| `REQ-01` | full | All Outcome, Actors, Consumes, Provides, Capabilities and Experience are contracted. |
| `REQ-05`, `REQ-06`, `REQ-07` | partial | Only active-channel consumption contract is provided; sale UI/pricing is deferred. |
| `REQ-09`, `REQ-10` | partial | Snapshot compatibility is preserved; order registration/history remains deferred. |
| `REQ-11`, `REQ-12` | partial | Channel access, isolation, responsiveness and accessibility are delivered for this surface. |

## Product decisions and assumptions

- Names are trimmed, required, limited to 120 characters and unique per establishment by
  `lower(btrim(name))`.
- Percentages accept comma or dot input, reject more than two decimal places, and persist
  exactly from `-99.99` through `100.00` inclusive.
- Management and active lists sort by normalized name, then ID; no channel is selected by
  default by this feature.
- Edit changes name and percentage. Inactivation/reactivation are distinct actions;
  inactivation always confirms, reactivation does not. Creation explicitly requests status.
- The approved design assumptions and deviations are recorded in
  [design/manifest.md](./design/manifest.md).

# 2. Implementation Contract

## Requirements

| ID | REQ/source coverage | Required behavior |
| --- | --- | --- |
| `RF-01` | `REQ-01` Outcome, Fields, name, percentage | A Manager creates a channel with trimmed unique name, exact bounded percentage and explicit active/inactive status. |
| `RF-02` | `REQ-01` Edition, Representation | A Manager edits name/percentage; positive, negative and zero adjustments retain exact two-decimal meaning and consistent type/preview presentation. |
| `RF-03` | `REQ-01` Active status, Inactivation | Confirmed inactivation removes a channel from future-sale results; reactivation restores it without changing historical snapshots. |
| `RF-04` | `REQ-01` Deletion, Snapshot | Confirmed deletion removes any channel, including a previously used channel, without coupling to or invalidating snapshot data. |
| `RF-05` | `REQ-01` List, Multi-tenancy | The Manager list shows only the current establishment’s alphabetically sorted channels with name, percentage, adjustment type, status and actions. |
| `RF-06` | `REQ-01` Provides; `REQ-05/06/07` | Authenticated Managers and Operators can read only active channels for future sale selection; the result selects nothing and exposes no management mutation. |
| `RF-07` | `REQ-01`, `REQ-11` Authorization/isolation | Operators cannot see or reach management UI and every server read/mutation derives actor and establishment from the authenticated account. |
| `RF-08` | `REQ-01` Feedback/empty/accessibility; `REQ-12` | Loading, empty, error/retry, validation, pending, success and confirmation states preserve recoverable input, prevent duplicate submission and remain keyboard/screen-reader accessible. |
| `RF-09` | Issue responsive criterion; `REQ-12` | Desktop and 768×1024 layouts keep names, percentages, status and actions readable; the narrow list uses stacked cards and 44×44 touch targets. |

## Acceptance criteria

| ID | RF coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `CA-01` | `RF-01`, `RF-08` | Valid creation | An authenticated Manager and valid form | Create is confirmed once | One tenant-owned channel is returned/listed and success is announced | Core/create, controller/POST, route flow, `MV-01` |
| `CA-02` | `RF-01`, `RF-08` | Boundary rejection | Blank/overlong/duplicate name or non-finite, >2-scale, `<-99.99`, `>100` percentage | Submit occurs | Field feedback is shown, no record changes, input remains recoverable | Core/schema/controller/route cases |
| `CA-03` | `RF-02`, `RF-05` | Edit and representation | Existing tenant channel | Manager saves valid name/percentage | Persisted row/list/preview show `+`, `−`, or `0%` consistently | Core/update, PATCH controller, widget, `MV-01` |
| `CA-04` | `RF-03`, `RF-08` | Lifecycle | Active or inactive tenant channel | Manager confirms inactivation or chooses reactivation | Status changes once, list refreshes, active read excludes/includes it, feedback is announced | Core lifecycle, controllers, `MV-01` |
| `CA-05` | `RF-05`, `RF-08`, `RF-09` | List states | Manager route | List loads, is empty, or fails | Correct scoped/sorted populated, empty, or retryable surface appears without layout clipping | Controller/list, route tests, `MV-01/02` |
| `CA-06` | `RF-04`, `RF-08` | Deletion | Any tenant channel | Manager confirms delete | Channel is absent from both lists and snapshot types/data remain independent | Core/delete, DELETE controller, route, `MV-01` |
| `CA-07` | `RF-06`, `RF-07` | Active read/access | Manager, Operator, foreign tenant and anonymous requests | Active list or mutation is invoked | Authorized actors receive only own active rows; Operator mutation is 403; foreign IDs are concealed; anonymous is 401 | Core and controller integration |
| `CA-08` | `RF-08` | Async recovery | A list or mutation request is pending/fails | User waits/retries/cancels | Controls expose pending state, duplicate submit is blocked, focus/state survives and console has no unhandled error | Widget/route tests, `MV-01/02` |
| `CA-09` | `RF-01`–`RF-07` | Concurrent uniqueness | Two same-tenant normalized names race | Both writes commit | One succeeds; one becomes a safe conflict; different tenants may use the same name | Controller/database integration |
| `CA-10` | `RF-07`, `RF-09` | Protected responsive route | Operator or Manager at declared viewports | Route/navigation is exercised by keyboard | Operator is denied and sees no nav item; Manager reaches canonical URL with logical focus and non-color statuses | Route tests, `MV-01/02` |

## Cross-cutting restrictions

| Concern | Contract |
| --- | --- |
| Tenancy/security | Never accept actor or establishment IDs from request bodies; qualify every repository operation with establishment ID. |
| History | No FK from order snapshots to the channel table and no update/delete cascade into snapshots. |
| Consistency | Database unique/check constraints are authoritative under races; adapters translate `23505/23514` to safe application failures. |
| Events | Existing created/updated event declarations remain compatible but are not published here because no authoritative consumer exists. |
| Secrets/SSR | Bearer injection stays in Axios transport; browser code receives no server secrets; route is client-rendered under the authenticated shell without hydration divergence. |

## Design Contract

The required reference inventory is [design/manifest.md](./design/manifest.md). Builders
must compare `VIS-01`–`VIS-06` at saved reference dimensions and generate fresh `VIS-07`–
`VIS-09` captures for accepted assumptions. The create dialog adds the authority-required
status field; the action menu omits `Ver pedidos`; row subtitles and functional search are
excluded. Current UI Rules govern dialog hierarchy where Design prose conflicts.

# 3. Technical Contract

## Current technical state

| Evidence | Current responsibility | Gap |
| --- | --- | --- |
| `packages/core/src/pdv/domain/entities/sales-channel.ts` | Entity plus embedded create/update types | Split structures; add executable actions/faker/tests. |
| `packages/core/src/pdv/interfaces/sales-channels-repository.ts` | Tenant CRUD port | Add normalized lookup guarantee, active list and reset capability. |
| `packages/core/package.json` | Exports nonexistent `pdv/use-cases` barrel | Create the exported barrel. |
| `apps/server/src/pdv` | Empty database/feature modules and tokens | Add persistence, REST, fixture, seeder and registration. |
| `apps/web/src/routes/_authenticated/sales-channels/index.tsx` | Authenticated placeholder | Add Manager middleware and real page; sidebar currently exposes it to Operator. |

## Solution and runtime flow

Manager requests enter `/sales-channels`, receive `CurrentAccount`, pass both transport and
Core Manager checks, and execute one PDV use case. The use case normalizes/validates input
and invokes the tenant-qualified repository. PostgreSQL stores `numeric(5,2)`, enforces
name/range/status constraints and resolves concurrent duplicates. Controllers serialize the
result; Web service/query/action hooks refresh the canonical list. Active reads follow the
same identity/tenant path but accept Manager or Operator and filter `active`. Mutations are
single-row transactions; no external side effect occurs.

| Boundary | Producer | Consumer | Canonical contract | Mapping/guarantees | Failure ownership |
| --- | --- | --- | --- | --- | --- |
| REST | PDV controllers | `PdvService` | shared schemas + Core entity/structures | JSON dates ISO; numeric percentage number; actor omitted | Zod pipe, global error handler |
| Repository | PDV use cases | Drizzle adapter | `SalesChannelsRepository` | tenant-qualified; normalized alphabetical order; exact decimal | Adapter translates integrity errors |
| UI service | `PdvService(restClient)` | PDV hooks/widgets | `PdvService` interface | current Bearer token; `RestResponse` preserved | action/page hooks expose recoverable errors |

## packages/core — Domain

| Path | Change | Declaration | Domain role/schema | Invariants/transitions | Errors/events | Exports/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/core/src/pdv/domain/entities/sales-channel.ts` | Modify | `SalesChannel` Entity | Canonical channel state | Exact bounded percentage; status active/inactive | No behavior in entity | Entity barrel, use cases, DTOs |
| `packages/core/src/pdv/domain/entities/fakers/sales-channel-faker.ts`; `packages/core/src/pdv/domain/entities/fakers/index.ts` | Create | `SalesChannelFaker` | Valid test builder | `fake`/`fakeMany`; overrides last | — | Core/server tests |
| `packages/core/src/pdv/domain/structures/sales-channel-create.ts` | Create | `SalesChannelCreate` Structure | Creation persistence value | Identity-free | — | Repository/use case |
| `packages/core/src/pdv/domain/structures/sales-channel-update.ts` | Create | `SalesChannelUpdate` Structure | Name/percentage changes only | Cannot mutate status | — | Repository/use case |
| `packages/core/src/pdv/domain/structures/sales-channel-actor.ts`; `packages/core/src/pdv/domain/structures/index.ts` | Create/Modify | `SalesChannelActor` Structure | Trusted actor projection | Identity/profile facts only | — | Use cases/controllers |

```ts
export type SalesChannel = Entity & {
  establishmentId: string
  name: string
  percentage: number
  status: SalesChannelStatus
  createdAt: Date
  updatedAt: Date
}
export type SalesChannelCreate = Omit<SalesChannel, 'id' | 'createdAt' | 'updatedAt'>
export type SalesChannelUpdate = Pick<SalesChannel, 'name' | 'percentage'>
export type SalesChannelActor = { id: string; establishmentId: string; profile: UserProfile }
```

**Schema — `SalesChannel`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | UUID | Channel identity |
| `establishmentId` | `string` | Yes | UUID | Tenant owner |
| `name` | `string` | Yes | Trimmed 1–120; normalized unique per tenant | Display name |
| `percentage` | `number` | Yes | finite, scale ≤2, `-99.99..100` | Global adjustment |
| `status` | `SalesChannelStatus` | Yes | active/inactive | Future-selection state |
| `createdAt`, `updatedAt` | `Date` | Yes | valid instant | Lifecycle timestamps |

**Schema — `SalesChannelCreate` / `SalesChannelUpdate` / `SalesChannelActor`**

| Structure | Complete resulting fields |
| --- | --- |
| `SalesChannelCreate` | `establishmentId: string`, `name: string`, `percentage: number`, `status: SalesChannelStatus` |
| `SalesChannelUpdate` | `name: string`, `percentage: number` |
| `SalesChannelActor` | `id: string`, `establishmentId: string`, `profile: UserProfile` |

## packages/core — Use cases and Interfaces

| Path | Change | Declaration/signature | Contract |
| --- | --- | --- | --- |
| `packages/core/src/pdv/use-cases/create-sales-channel-use-case.ts` | Create | `CreateSalesChannelUseCase.execute({actor,name,percentage,status})` | Manager validation, normalized duplicate check, atomic add |
| `packages/core/src/pdv/use-cases/list-sales-channels-use-case.ts`; `packages/core/src/pdv/use-cases/list-active-sales-channels-use-case.ts` | Create | two list actions | Manager management list; Manager/Operator active-only list |
| `packages/core/src/pdv/use-cases/update-sales-channel-use-case.ts` | Create | name/percentage update | Manager, tenant concealment, duplicate exclusion |
| `packages/core/src/pdv/use-cases/inactivate-sales-channel-use-case.ts`; `packages/core/src/pdv/use-cases/reactivate-sales-channel-use-case.ts` | Create | lifecycle actions | Idempotent target status; tenant-qualified replace |
| `packages/core/src/pdv/use-cases/delete-sales-channel-use-case.ts`; `packages/core/src/pdv/use-cases/index.ts` | Create | delete and public barrel | Manager confirmed transport intent; deletion independent from snapshots |
| `packages/core/src/pdv/use-cases/tests/create-sales-channel-use-case.test.ts`; `list-sales-channels-use-case.test.ts`; `list-active-sales-channels-use-case.test.ts`; `update-sales-channel-use-case.test.ts`; `inactivate-sales-channel-use-case.test.ts`; `reactivate-sales-channel-use-case.test.ts`; `delete-sales-channel-use-case.test.ts` (all in the same tests directory) | Create | seven matching suites | Success, bounds, authorization, tenancy, duplicate/race-facing conflict, lifecycle |
| `packages/core/src/pdv/interfaces/sales-channels-repository.ts` | Modify | `add`, `findById`, `findByNormalizedName`, `findMany`, `findActive`, `replace`, `remove`, `removeAll` | Exact tenant/list/normalization semantics |
| `packages/core/src/pdv/interfaces/pdv-service.ts`; `packages/core/src/pdv/interfaces/index.ts` | Create/Modify | `PdvService` with list/listActive/create/update/inactivate/reactivate/remove | Browser REST contract using `RestResponse` |

## packages/validation — Validation

| Path | Change | Schema/declaration | Fields/refinements | Consumers/export |
| --- | --- | --- | --- | --- |
| `packages/validation/src/pdv/sales-channel-status-schema.ts` | Create | `salesChannelStatusSchema` | derives Core runtime status | REST/form; root export |
| `packages/validation/src/pdv/save-sales-channel-schema.ts` | Create | `saveSalesChannelSchema` | trimmed name 1–120; finite number scale≤2/range; status for create and omitted by update pick | server controllers |
| `packages/validation/src/web/sales-channel-form-schema.ts` | Create | `salesChannelFormSchema` | localized decimal string to exact number; same name/status feedback | RHF form |
| `packages/validation/src/index.ts` | Modify | root exports | explicit `.ts` internal exports | Web/Server |

## apps/server — Database, REST and Composition

| Layer | Paths | Change | Declarations and guarantees |
| --- | --- | --- | --- |
| Database | `apps/server/src/pdv/database/drizzle/models/sales-channel-status-model.ts`; `apps/server/src/pdv/database/drizzle/models/sales-channel-model.ts`; `apps/server/src/pdv/database/drizzle/types/entities/sales-channel.ts`; `apps/server/src/pdv/database/drizzle/mappers/drizzle-sales-channel-mapper.ts`; `apps/server/src/pdv/database/drizzle/repositories/drizzle-sales-channels-repository.ts`; `index.ts` barrels in those four declaration directories | Create/Modify | `pdv_sales_channel_status`, `pdv_sales_channels`, mapper and full repository; numeric maps without precision loss; all queries tenant-qualified |
| Database | `apps/server/src/pdv/database/drizzle/repositories/drizzle-pdv-database.ts`; `apps/server/src/pdv/database/pdv-database.module.ts`; `apps/server/src/pdv/database/pdv-seeder.ts` | Create/Modify | Transaction scope/token bindings; seeder clears channels and inserts no default channel |
| Migration | `apps/server/src/shared/database/drizzle/schema.ts`; `apps/server/src/shared/database/drizzle/migrations/0013_sales_channel_management.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/0013_snapshot.json`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json` | Modify/Generate | Schema barrel source and `drizzle-kit generate --name sales_channel_management` outputs |
| REST | `apps/server/src/pdv/decorators/sales-channels-controller.ts`; `apps/server/src/pdv/rest/dtos/sales-channel-response.dto.ts`; controller files `create-sales-channel.controller.ts`, `list-sales-channels.controller.ts`, `list-active-sales-channels.controller.ts`, `update-sales-channel.controller.ts`, `inactivate-sales-channel.controller.ts`, `reactivate-sales-channel.controller.ts`, `delete-sales-channel.controller.ts` under `apps/server/src/pdv/rest/controllers/`; `apps/server/src/pdv/rest/controllers/index.ts` | Create | One controller/action; semantic `:salesChannelId`; Manager mutations/list, Manager+Operator active list; shared Zod pipes and Swagger 200/201/204/401/403/404/409/422 |
| REST | `apps/server/rest-client/pdv/sales-channels.rest` | Create | Examples for all seven operations with Bearer token |
| Tests | `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`; seven files mirroring the controller filenames under `apps/server/src/pdv/rest/controllers/tests/` with `.test.ts` suffix | Create | Real Nest/Drizzle/Testcontainer path; response/persistence, role, tenant, concurrency and constraint coverage |
| Composition | `apps/server/src/pdv/pdv.module.ts`; `apps/server/src/shared/database/seed.ts` | Modify | Register controllers/database and call PDV clear/run in module dependency order |

### `pdv_sales_channels` data model

| Column | Type | Nullable | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | — | Primary key |
| `establishment_id` | `uuid` | No | — | Tenant owner; no cross-module table import/FK |
| `name` | `text` | No | — | Trimmed display name |
| `percentage` | `numeric(5,2)` | No | — | Exact global adjustment |
| `status` | `pdv_sales_channel_status` | No | — | `active` or `inactive` |
| `created_at`, `updated_at` | `timestamptz` | No | — | Lifecycle instants |

| Index name | Columns | Type | Purpose |
| --- | --- | --- | --- |
| `pdv_sales_channels_establishment_name_unique` | `establishment_id`, `lower(btrim(name))` | unique | Race-safe normalized uniqueness |
| `pdv_sales_channels_establishment_status_name_idx` | `establishment_id`, `status`, `lower(btrim(name))`, `id` | btree | Scoped sorted management/active reads |

| Constraint | Type | Definition | Purpose |
| --- | --- | --- | --- |
| Primary key | PK | `id` | Identity |
| `pdv_sales_channels_name_valid` | check | `length(btrim(name)) between 1 and 120` | Name boundary |
| `pdv_sales_channels_percentage_valid` | check | `percentage between -99.99 and 100.00` | Range/scale via numeric type |

The generated migration is additive, requires no backfill, runs transactionally before code,
and is portable across supported PostgreSQL environments. It must not add order FKs or seed a
default channel.

## apps/web — REST, UI and Composition

| Layer | Paths | Change | Declarations and guarantees |
| --- | --- | --- | --- |
| REST | `apps/web/src/rest/services/pdv-service.ts` | Create | `PdvService(restClient)` implements all seven exact HTTP mappings and preserves `RestResponse` |
| UI hooks | `apps/web/src/ui/pdv/hooks/sales-channel-query-keys.ts`; `use-sales-channels-query.ts`; `use-active-sales-channels-query.ts`; create/update/inactivate/reactivate/delete action hook files | Create | Semantic results; correct service calls; successful mutations invalidate management and active keys; no dedicated tests |
| UI page | `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/index.tsx`; `use-sales-channels-page.ts`; `tests/sales-channels-page.test.tsx`; `tests/use-sales-channels-page.test.ts` | Create | `SalesChannelsPage` owns workflow/selection; named hook destructuring; composes children |
| UI children | page-local `sales-channels-loading/index.tsx`, `sales-channels-error/index.tsx`, `sales-channels-empty-state/index.tsx`, `sales-channels-list/index.tsx`, `sales-channel-dialog/{index.tsx,use-sales-channel-dialog.ts}`, `change-sales-channel-status-dialog/{index.tsx,use-change-sales-channel-status-dialog.ts}`, `delete-sales-channel-dialog/{index.tsx,use-delete-sales-channel-dialog.ts}` and each behavior-owning widget’s `tests/` files | Create | Exact loading/empty/error/list/form/status/delete boundaries; explicit props/callbacks; references/assumptions from manifest |
| Composition | `apps/web/src/routes/_authenticated/sales-channels/index.tsx`; `apps/web/src/constants/sidebar-items.ts`; AppLayout test; RestContext value/provider/test | Modify | Manager middleware/page, Manager-only nav, `pdvService` composition |
| Browser | `apps/web/tests/fixtures/pdv-module-fixture.ts`; `apps/web/tests/playwright.ts`; `apps/web/tests/routes/pdv/sales-channels.index.test.ts` | Create/Modify | Stateful mocked transport for access/list/all mutations/narrow/keyboard; never presented as server proof |

### UI widget hierarchy and allowed tree

| Widget | Kind | Parent/entry | Direct children | Public contract | Behavior owner |
| --- | --- | --- | --- | --- | --- |
| `SalesChannelsPage` | Page | `/sales-channels` route | loading/error/empty/list and three dialogs | none | `useSalesChannelsPage` |
| `SalesChannelsList` | Component | `SalesChannelsPage` | action menu through shared primitive | channels and edit/status/delete callbacks | pure renderer |
| `SalesChannelDialog` | Component | page | shared form primitives | mode, channel, open, close | colocated hook/RHF |
| `ChangeSalesChannelStatusDialog` | Component | page | shared AlertDialog | channel, target status, open, close | colocated hook |
| `DeleteSalesChannelDialog` | Component | page | shared AlertDialog | channel, open, close | colocated hook |
| Loading/error/empty widgets | Component | page | shared primitives | state-specific callback where needed | pure renderer |

Allowed production paths are only those listed in the layer tables plus their required
colocated tests and index barrels. Prohibited paths include `apps/web/src/ui/shared` feature
widgets, generic `components/` under the feature, Core framework/Drizzle imports, local Web or
Server duplicate schemas, manually edited `routeTree.gen.ts`, repository unit tests, event jobs,
order/cart/pricing paths, and any migration that links snapshots to channels.

## Technical decisions

| Decision | Chosen approach | Alternative considered | Reason | Accepted trade-off |
| --- | --- | --- | --- | --- |
| Lifecycle | Separate update/inactivate/reactivate actions | Generic update including status | Product distinguishes confirmed lifecycle and Rules favor one action per use case | More declarations/endpoints |
| Active consumption | Add active-only read now | Defer all sale-facing contracts | Satisfies issue/REQ-01 Provides without implementing order assembly | Endpoint initially consumed only by future sale work/tests |
| Exact percentage | `numeric(5,2)` and scale rejection | float or rounding extra scale | Prevent displayed/persisted divergence | Inputs with extra precision are rejected |
| Design gaps | Saved references plus accepted assumptions | Block on new Pencil frames | User explicitly approved assumptions | Visual proof is created during implementation, not a durable reference frame |

# 4. Validation Contract

## Testing strategy

| Test file | Test type | Target | Coverage goal |
| --- | --- | --- | --- |
| Seven exact Core test files declared in the Use-case layer table | unit | Seven use cases | Rules, role, tenant, bounds, normalization and lifecycle |
| Seven exact Server controller test files declared in the Server layer table | integration | Seven REST operations | HTTP, real persistence, constraints, tenant/role and concurrency |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/**/tests/*` | component/hook | Page and behavior-owning dialogs | State/action matrix, recovery, focus and accessible contracts |
| `apps/web/tests/routes/pdv/sales-channels.index.test.ts` | browser integration, mocked transport | Protected route and UI-to-REST | Exact requests plus visible populated/empty/error/mutation/narrow results |

| Test file | Test case | Description | Assertions |
| --- | --- | --- | --- |
| Core suites | create/update boundaries | Valid values and blank/120/121/duplicate/scale/range branches | Result and repository effects/no effects |
| Core lifecycle/list suites | access/isolation/status | Manager vs Operator, foreign tenant, idempotent transitions, alphabetical/active results | Safe errors and exact lists |
| Server suites | transport/persistence/race | All statuses/bodies plus same-tenant concurrent normalized names | HTTP body/status and persisted tenant-scoped state |
| Widget/page suites | complete state matrix | loading, populated, empty, error/retry, dialog cancel/validation/pending/failure/success, role actions | Accessible names, focus, disabled/live feedback and retained values |
| Route suite | complete mocked flow | Manager/Operator/anonymous, exact CRUD paths/bodies, stateful refresh, narrow keyboard flow | URL, request/response and visible outcome; no console/network failures |

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| `CA-01`–`CA-04`, `CA-06`, `CA-08` | Core + controller + widget/route suites | `MV-01` | `evaluation.md` automated/manual, `VIS-02`–`VIS-06/09` |
| `CA-05`, `CA-10` | list controller + page/route suites | `MV-01`, `MV-02` | `VIS-01`, `VIS-07/08` |
| `CA-07`, `CA-09` | Core and real controller integration | `MV-01` access checks | authorization/persistence evidence |

## Manual scenarios

### `MV-01` — Manager lifecycle, desktop

Requires healthy Supabase `http://127.0.0.1:54321`, Server `/health` on 3336 and Web on
4000; seed Manager and Operator accounts, then generate auth storage. Start at
`/sales-channels`, 1481×1050, Manager state.

1. Verify list/reference inventory, open Create by keyboard, submit invalid boundaries, then
   create active `Delivery próprio` with `12,00` and verify POST, success and refreshed row.
2. Edit to a negative percentage, verify PATCH and representation; inactivate through the
   confirmation, verify active GET exclusion; reactivate and verify inclusion.
3. Delete through confirmation and verify DELETE plus absence while no order/snapshot record
   is mutated.
4. Open the same URL with Operator state: nav item is absent and direct route reaches access
   denied; active endpoint remains readable.
5. Check focus return, labels/errors/live statuses, final URL, persisted state, console and
   failed requests; save fresh `VIS-01`–`VIS-06/09` evidence and clean created channel.

### `MV-02` — Narrow states and recovery

At 768×1024, exercise populated cards/action menu, empty list, delayed loading, failed list
then retry, and failed create/edit preserving form values. Verify 44×44 targets, no horizontal
content loss, logical Tab/Escape paths, focus visibility, announced state, final URL, network
recovery and clean console. Save `VIS-07` and `VIS-08`.

## Commands

| Command | Purpose/coverage |
| --- | --- |
| `pnpm --filter @scoops/core check:code && pnpm --filter @scoops/core check:types && pnpm --filter @scoops/core test` | Core contract/use cases |
| `pnpm --filter @scoops/validation check:code && pnpm --filter @scoops/validation check:types` | Shared schemas |
| `pnpm --filter server exec drizzle-kit generate --config drizzle.config.ts --name sales_channel_management` | Generate exact migration/journal from schema |
| `pnpm --filter server check:code && pnpm --filter server check:types && pnpm --filter server test && pnpm --filter server build` | Server/database/REST |
| `pnpm --filter web generate-routes && pnpm --filter web check:code && pnpm --filter web check:types && pnpm --filter web test` | Web static/unit and generated-route integrity |
| `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts` | Focused mocked browser route contract |

Actual results, captures, findings and comparison verdicts belong in [evaluation.md](./evaluation.md).

# 5. Documentation alignment and revision history

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| `documentation/prds/pdv.md` | REQ-01 product contract and cross-REQ facts | confirmed | REQ-01 remains unchecked; no product amendment required for approved exclusions/limits. |
| `documentation/architecture.md` | tenancy, dependency, persistence and history invariants | confirmed | Backend/tenant authority, exact persistence and snapshot independence retained. |
| `documentation/modules.md` | PDV ownership | confirmed | All channel behavior/data/UI remain PDV-owned. |
| `documentation/design.md` | tokens/components/accessibility | confirmed | Saved manifest records current-Rule conflict resolution and visual assumptions. |
| `documentation/tooling.md` | commands/generation/services | confirmed | Uses existing pnpm, Drizzle, Vitest and Playwright CLI workflow. |

| Rule | Applies to | Evaluated revision |
| --- | --- | --- |
| `documentation/rules/sdd-rules.md` | SDD artifact lifecycle | working tree 2026-08-25 |
| `documentation/rules/code-conventions-rules.md` | all TypeScript declarations | working tree 2026-08-25 |
| `documentation/rules/core-package-rules.md` | PDV domain/interfaces | working tree 2026-08-25 |
| `documentation/rules/use-case-testing-rules.md` | PDV use cases/tests | working tree 2026-08-25 |
| `documentation/rules/validation-package-rules.md` | shared schemas | working tree 2026-08-25 |
| `documentation/rules/rest-layer-rules.md` | server/web REST | working tree 2026-08-25 |
| `documentation/rules/controllers-testing-rules.md` | REST integration | working tree 2026-08-25 |
| `documentation/rules/database-layer-rules.md` | Drizzle/model/migration/seeder | working tree 2026-08-25 |
| `documentation/rules/ui-layer-rules.md` | Web widgets/hooks/composition | working tree 2026-08-25 |
| `documentation/rules/web-app-routing-rules.md` | route/access/generated tree | working tree 2026-08-25 |
| `documentation/rules/widget-testing-rules.md` | widget and route behavior | working tree 2026-08-25 |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| `1` | 2026-08-25 | Initial implementation-ready contract and six-reference design bundle | GitHub Issue #21 and approved clarification decisions |
