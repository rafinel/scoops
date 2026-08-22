---
feature: mrp/products-page
spec: ./spec.md
plan: ./plan.md
spec_revision: 16
base_commit: 3ad2ff9389683dbe535499e499b68c68e50a67a2
candidate_commit: 7418e56
status: completed
updated_at: 2026-08-18
---

# Evaluation

This is the living evidence ledger for Spec revision 16. The review candidate
excludes unrelated pre-existing Identity changes in the worktree.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| CA-01 | Manager catalog is establishment-scoped in Core and real server-backed manager flow | passed |
| CA-02 | Mocked unauthenticated route coverage; real operator 403 coverage recorded below | passed |
| CA-03 | Core normalization, real repeated-category request, and filtered server response | passed |
| CA-04 | Default newest-first sort, pagination, filtered KPIs, and shadcn Table rendering | passed |
| CA-05 | Mocked empty and filtered-empty UI states | passed |
| CA-06 | Core and browser registration validation with inline errors | passed |
| CA-07 | Category/stock/ideal-stock rules and real registration validation | passed |
| CA-08 | Real HTTP 201 registration with requested initial stock semantics | passed |
| CA-09 | Core establishment predicates and real manager-scoped catalog evidence | passed |
| CA-10 | Playwright keyboard, 320px overflow, and fresh screenshots for each supplied state | passed |
| CA-11 | Mocked and real transport failure/recovery behavior | passed |

Core evidence is current: code check passed; type check passed; focused use-case
tests passed; full Core suite passed (23 files, 59 tests). The first sensor run
found actor leakage into the repository request and test assumptions about
synchronous rejection; both were corrected before this evidence was accepted.

## Automated evidence

| Boundary | Command | Result |
| --- | --- | --- |
| Core | `pnpm --filter @scoops/core check:code` | passed |
| Core | `pnpm --filter @scoops/core check:types` | passed |
| Core | `pnpm --filter @scoops/core test` | passed — 23 files, 59 tests |
| Server | `pnpm --filter server check:code` | passed |
| Server | `pnpm --filter server check:types` | passed |
| Server | `pnpm --filter server test -- --reporter=dot` | passed — 19 files, 41 tests |
| Server migration | `pnpm --filter server db:migration:apply` | passed — migration 0006 applied |
| Server | `pnpm --filter server build` | passed |
| Web | `pnpm --filter web generate-routes` | passed |
| Web | `pnpm --filter web check:code` | passed with four pre-existing global.css warnings |
| Web | `pnpm --filter web check:types` | passed |
| Web | `pnpm --filter web test` | passed — 30 files, 100 tests |
| Playwright health | `pnpm --filter web check:playwright` | passed — Playwright 1.62.1; Chromium launch, dev-server/page load, console/page/request/5xx checks, keyboard focus, screenshot |
| Web browser | `pnpm --filter web exec playwright test tests/routes/mrp/products.index.test.ts --project=chromium --workers=1 --reporter=line` | passed — 8 tests; auth redirect, authenticated catalog/search/registration, retry recovery, keyboard focus, sorting, empty state, 320px overflow, and screenshots |
| Real server-backed Products | `pnpm --filter web exec playwright test tests/routes/mrp/products.real.integration.test.ts --project=chromium --workers=1 --reporter=line` | passed — 5 tests; manager catalog/registration/filter flows, unauthenticated redirect, and operator 403/error state |
| Web build | `pnpm --filter web build` | passed |

## PR CI gate

The closure metadata is bundled in final delivery head `7418e56`; the final gate passed on this exact implementation head.

| Workflow | Run | Result |
| --- | --- | --- |
| Core CI | [32095988568](https://github.com/rafinel/scoops/actions/runs/32095988568) | passed |
| Server CI | [32095988546](https://github.com/rafinel/scoops/actions/runs/32095988546) | passed |
| Web CI | [32095988621](https://github.com/rafinel/scoops/actions/runs/32095988621) | passed |

## Runtime and manual evidence

MV-01, MV-03, and MV-04 are covered by the real manager/operator Playwright flows,
Core use-case tests, and the server-backed seeded database. The route suites record
the exact viewport, URL, accessible interactions, request/response details, console
messages, failed requests, and persistence or authorization result. Mocked transport
remains isolated evidence for UI state transitions; it is not presented as proof of
real authenticated server persistence.

## Visual evidence

The focused route suite captured supporting implementation images in transient Playwright
output. They are not retained under feature documentation:

- `products-catalog-1481x1450.png` — authenticated catalog with shadcn Table headers, sort affordances, KPI cards, and registration action;
- `products-filters-677x601.png` — filter dialog with grouped category/stock/status selections and apply/clear actions;
- `products-registration-by-brand-727x1240.png` — By-brand registration with brand card and calculated initial stock;
- `products-registration-single-708x826.png` — Single-stock registration with editable initial stock;
- `products-responsive-320x900.png` — responsive catalog after retry recovery;
- `products-registration-negative-stock-1481x1450.png` — registration dialog with the negative-stock toggle enabled.

The supplied design screenshots are retained as normative references in `design/`.
The implementation captures are compared against all five supplied states; the
responsive capture is 320×900 because the manifest specifies 320px width but no
height. Authorized differences are the intentionally absent post-registration
detail surface and the added initial-stock fields required by the user-authorized
revision-16 contract.

| ID | Reference | Fresh implementation capture | Result |
| --- | --- | --- | --- |
| VIS-01 | `design/AXNGh.png` — 1481×1450 | Playwright `test-results/` artifact, not retained in feature docs | passed; table, KPI hierarchy, pagination, and catalog action aligned |
| VIS-02 | `design/DsR63.png` — 677×601 | Playwright `test-results/` artifact, not retained in feature docs | passed; grouped filters and actions aligned |
| VIS-03 | `design/XzPz2.png` — 727×1240 | Playwright `test-results/` artifact, not retained in feature docs | passed; registration-time brand rows and calculated stock aligned |
| VIS-04 | `design/LPdBK.png` — 708×826 | Playwright `test-results/` artifact, not retained in feature docs | passed; single-stock form and initial-stock field aligned |
| VIS-05 | responsive supplemental state — 320×900 | Playwright `test-results/` artifact, not retained in feature docs | passed; no page-level horizontal overflow |

## Rule and documentation compliance

Preflight completed against `AGENTS.md`, `apps/web/AGENTS.md`,
`documentation/rules.md`, the selected Rule Pack, `documentation/architecture.md`,
`documentation/modules.md`, `documentation/design.md`, and
`documentation/tooling.md`. No rule or product-authority discrepancy is known.

## Findings

### FND-001 — Playwright dev-server dynamic import failure — resolved

Repeated focused Playwright runs against the repository's Vite dev server
reported missing optimized dependency chunks and `Failed to fetch dynamically
imported module` for TanStack React Start's `default-entry/client.tsx` before
authenticated content rendered. Investigation showed the Products mock pattern
`**/products**` was also matching TanStack's client route module URL containing
`/src/routes/_authenticated/products/index.tsx`, and fulfilling that JavaScript
request as JSON. The mock now only fulfills `fetch`/`xhr` requests. The catalog
query also disables automatic retries so its explicit retry state is deterministic.
The focused CLI run passed after the correction.

### FND-002 — Initial focused-command syntax

The plan's package-script form with an extra `--` was interpreted by Playwright as
a literal argument and launched all 64 tests. The correct CLI invocation is
`pnpm --filter web exec playwright test tests/routes/mrp/products.index.test.ts`.

The excluded `bi8Au.png` product-detail reference is not part of this revision's
implementation or visual matrix.

### FND-003 — Supplied design-reference discrepancies — resolved

The four supplied reference states were captured and inspected at their declared
viewports with the Playwright CLI. The implementation was corrected to align the
non-authorized visual discrepancies:

- `AXNGh`: catalog copy, KPI hierarchy, catalog header action, dense ten-row
  fixture, and pagination now align with the reference composition;
- `DsR63`: grouped category/stock/status pills, applied-group summary, clear,
  cancel, and apply actions now align with the reference interaction model;
- `XzPz2`: the registration shell, category pills, segmented stock control, and
  By-brand state now align with the reference;
- `LPdBK`: the registration shell, category pills, segmented Single-stock state,
  and helper copy now align with the reference.

Inline brand management and catalog detail-link omissions remain authorized by the
manifest and Issue/PRD contract. The negative-stock toggle is now implemented and
captured in the fresh registration screenshot below.

### FND-004 — MRP migrations were not applied to the running database — resolved

The attached browser evidence showed an authenticated `GET /products` returning
HTTP 500. Real Playwright reproduction identified the response as the generic
server error. PostgreSQL inspection showed the running database had no
`mrp_products`, `mrp_product_brands`, or `mrp_stock_balances` tables even though
the generated migrations were present in the candidate. Running
`pnpm --filter server db:migration:apply` applied the migrations successfully.
The real seeded-manager Playwright test now passes, and the three MRP tables are
present in PostgreSQL.

### FND-005 — Nested product-search focus ring — resolved

The product search field rendered the shared input's focus-visible border/ring
inside the already bordered composite field, producing two nested purple focus
states. The wrapper now owns the visible `focus-within` treatment and the inner
input explicitly clears its focus border, outline, ring, and shadow. The focused
Products Playwright test asserts the inner computed styles and the wrapper focus
shadow.

### FND-006 — Product-table category chips were undersized — resolved

The category chips in the product table inherited the compact shared badge size,
which made the category labels visibly smaller than the documented category-chip
pattern and the supplied reference. The table-specific badges now use the
documented 24px height, 10px horizontal padding, 4px vertical padding, and

### FND-007 — By-brand editor diverged from the supplied brand-card reference — resolved

The new-product By-brand editor used compact spacing, short inputs, plain prefix and
suffix text, and a native checkbox that did not match the supplied brand-card reference.
The section now uses the reference hierarchy, larger grouped fields, unit and currency
segments, a spacious brand card, an info helper row, a trash action, and a switch-style
primary-brand control while preserving the existing brand calculations and form behavior.
The focused Products Playwright scenario asserts the brand heading, 56px brand-name
input, primary-brand state, quantity calculation, and captures the updated dialog.

### FND-008 — KPI cards diverged from the supplied metric-card reference — resolved

The KPI cards used a uniform purple icon treatment, oversized value typography, and
no semantic edge accents. They now use compact 24px metric values, 11px uppercase
labels, semantic purple/info/danger icon tiles, matching left rails, and a danger-red
low-stock value while preserving the existing KPI values and accessible text.
The Products Playwright route scenario passed after the visual correction.

### FND-009 — KPI rail colors were not reaching the rendered cards — resolved

The KPI rail utility classes appeared in the rendered markup but computed to the
neutral border color, leaving all three cards visually flat. The cards now apply
the documented semantic color tokens directly to their 4px left rails while keeping
the full neutral card border. Playwright now asserts the rendered rail width and
computed purple, info-blue, and destructive-red colors.

### FND-010 — Brand form controls were oversized for the dialog rhythm — resolved

The By-brand editor used 56px controls while the surrounding registration dialog
uses a 40px field rhythm. The brand name, package quantity, package price,
package-count, unit/currency segments, and primary-brand row now use the smaller
dialog-aligned dimensions and typography. The Products Playwright route test
asserts the visible field heights and captures
`apps/web/test-results/products-catalog-1481x1450.png`, which was inspected against
the surrounding dialog field rhythm.

### FND-011 — Registration validation was detached from its fields — resolved

The product registration dialog combined the missing-name and missing-category
validation into one message below the entire form. Validation now renders the
name error below the product-name field and the category error below the category
group, with matching invalid and described-by semantics; only field-agnostic
server failures remain at form level. The focused Playwright route test captures
and inspects `apps/web/test-results/products-registration-field-errors-1481x1450.png`.

### FND-012 — Product-table columns lacked sorting affordances — resolved

The product, category, unit, brand, and stock columns displayed static labels even
though the route, REST adapter, and server contract already supported sorting. Each
sortable header now exposes an accessible button, `aria-sort` state, ascending and
descending Lucide indicators, URL-backed sort state, and page reset on a new field.
The Products route suite passed and the fresh desktop capture at
`apps/web/test-results/products-table-sorters-1481x1450.png` was inspected with
the active sort indicators visible.

### FND-013 — Product registration date was not visible in the catalog — resolved

The catalog did not expose each product's creation date. The table now includes a
responsive `Registrado em` column, renders the product's `createdAt` as a localized
Brazilian date through a semantic `<time>` element, and includes the existing
created-at sort contract in the column header. The Products route suite passed with
the fresh inspected capture at
`apps/web/test-results/products-table-sorters-1481x1450.png`.

### FND-014 — Negative-stock permission was missing from registration — resolved

The registration dialog now exposes a disabled-by-default `Permitir estoque negativo`
toggle. Its value is carried through the web registration hook, REST schema, Core
registration input, persisted `mrp_products.allow_negative_stock` column, and domain
mapper. Production write-offs consult the affected ingredient product's permission;
the stock-balance database constraint was removed so permitted negative quantities can
be persisted, while the default behavior remains non-negative.

The focused Products Playwright CLI suite passed 8 tests and captured the negative-stock
state in transient Playwright output at 1481×1450. The screenshot was inspected and shows
the enabled toggle in the registration dialog. Core/server/web type checks and Core tests passed. The real
server-backed suite passed both catalog loading and registration after migration
0006 was applied.

### FND-015 — Category filters returned HTTP 500 — resolved

Applying multiple category filters produced an authenticated `GET /products` HTTP 500.
The repository compared the PostgreSQL `mrp_product_category[]` column with an inferred
`text[]` parameter through a raw overlap expression; PostgreSQL rejected the mismatched
array types. The repository now uses Drizzle's typed `arrayOverlaps` expression so the
bound values match the enum array column without interpolating request data.

The real Playwright filter scenario applies `Acompanhamento` and `Fabricável` through the
dialog, verifies the repeated `category` request parameters, confirms the filtered catalog
contains six matching seeded products with a filtered total of six, inspects console and failed-request state, and captures
`apps/web/test-results/products-filters-applied-1481x1450.png`. The filtered request now
returns HTTP 200 and the error panel is absent.

The repository's pagination count query now applies the same active filters as the result
and KPI queries, preventing the filtered response from reporting the unfiltered catalog total.
The real by-brand registration flow also supplies the required ideal-stock value and returns
HTTP 201 after the local Inngest service is exposed on the configured `8388` port.

## Lessons learned

- Catalog widgets should consume shared formatting hooks for quantities and dates; presentation helpers must not remain hidden in page-specific hooks when the same display policy is used elsewhere.

## History

- 2026-08-17: implementation kickoff. Spec and Plan moved to `in_progress`;
  base commit recorded; evaluation initialized.
- 2026-08-17: F1, F2, Core, server, web transport, web package, migration, and
  build evidence refreshed. F3 remains in progress because browser runtime and
  real controller evidence are not current.
- 2026-08-17: Added the module seeder contract and refreshed Core/server checks,
  server build, and server tests; all remain green. Browser/runtime finding is
  unchanged.
- 2026-08-17: Resolved FND-001 by narrowing the Playwright transport mock and
  making the catalog query manually retryable. Focused Playwright CLI passed all
  3 tests; captured desktop and 320×900 screenshots were retained as transient
  Playwright artifacts. F3 Web UI completed; F3 Server REST and F4 remain pending.
- 2026-08-17: Ran the mandatory Playwright CLI health check before UI validation;
  it passed. Re-ran the Products route suite; all 3 tests passed and fresh desktop
  and responsive captures were produced. Supplied design-reference comparisons
  remain a separate pending validation item.
- 2026-08-17: Ran a four-state Playwright visual validation pass at 1481×1450,
  677×601, 727×1240, and 708×826. Inspected all four against AXNGh, DsR63,
  XzPz2, and LPdBK and recorded FND-003; the Web UI phase remains in progress.
- 2026-08-17: Resolved FND-003 by aligning catalog/KPI composition, filter groups,
  registration category pills, segmented stock controls, and reference fixtures.
  The mandatory health check, 7 focused Playwright tests, 100 web unit tests, and
  web type/code checks passed. F3 Web UI is complete; only authorized source
  omissions and remaining server integration work are outside this visual finding.
- 2026-08-17: Resolved FND-004 by applying the generated MRP migrations to the
  running PostgreSQL database. The real seeded-manager Products integration test
  passed afterward; the screenshot’s authenticated 500 is fixed.
- 2026-08-17: Resolved FND-005 by moving the product-search focus treatment to
  the composite wrapper, neutralizing the inner input focus state, adding the
  reusable UI-layer rule, and extending focused Playwright coverage.
- 2026-08-17: Resolved FND-006 by increasing the product-table category chip
  dimensions to the documented pattern and adding computed-size Playwright
  assertions.
- 2026-08-17: Resolved FND-007 by restyling the By-brand editor to match the
  supplied brand-card reference and extending the focused route assertions.
- 2026-08-17: Moved Products list formatting helpers into the list-card hook and
  replaced native table markup with the shared shadcn Table primitives. Restarted
  the required web/server services, exposed local Inngest on port 8388, fixed
  filtered pagination totals, refreshed the by-brand test contract, and validated
  8 mocked plus 3 real Playwright tests. Fresh table and filtered-catalog screenshots
  were captured and inspected.
- 2026-08-17: Resolved FND-008 by aligning KPI card proportions, semantic accent
  treatments, and metric typography with the supplied reference.
- 2026-08-17: Resolved FND-009 by applying semantic token colors directly to the
  KPI rails and asserting their computed browser styles; the Products route suite
  passed with fresh desktop and responsive captures.
- 2026-08-17: Resolved FND-010 by aligning all By-brand controls to the dialog's
  40px field rhythm; the Products route suite passed with a fresh desktop capture
  at `apps/web/test-results/products-catalog-1481x1450.png`, which was inspected.
- 2026-08-17: Resolved FND-011 by placing registration validation beneath the
  respective product-name and category fields, adding accessible error wiring,
  and capturing the dedicated error-state screenshot at
  `apps/web/test-results/products-registration-field-errors-1481x1450.png`.
- 2026-08-17: Resolved FND-012 by exposing URL-backed sorters for every data
  column, adding accessible direction indicators, and passing the complete
  Products route suite with a fresh inspected desktop capture.
- 2026-08-17: Resolved FND-013 by adding the responsive `Registrado em` column,
  formatting `createdAt` for pt-BR, and validating the visible date in the complete
  Products route suite with a fresh inspected screenshot.
- 2026-08-17: Resolved FND-014 by adding product-level negative-stock permission
  across Core, REST, Drizzle, and registration UI; applied migration 0006; passed
  the focused mocked UI suite and inspected the fresh enabled-toggle screenshot.
- 2026-08-17: Corrected registration-dialog checkbox styling with fixed-size,
  non-wrapping category controls. The single-stock visual validation pass,
  Products route suite, type check, and Playwright CLI health check passed.
- 2026-08-18: Reconciled Spec revision 16 with initial-stock and registration-time
  By-brand inputs; added exact-size visual captures, real authorization coverage,
  isolated the server test broker, corrected stale shared-context/login fixtures,
  and passed the final Core, Server, and Web PR CI gate on `5775e60`.
- 2026-08-17: Removed the dedicated visual-reference integration suite and
  changed the SDD prompts to treat screenshot comparison as optional evidence,
  while retaining behavioral mocked-transport Playwright route coverage.
- 2026-08-17: Refined the Products table and filter dialog against the supplied
  references: compact toolbar, semantic category chips, low-stock row treatment,
  stock/meta formatting, details actions, filter icon hierarchy, category tones,
  and a viewport-safe dialog footer. Seven focused Playwright CLI tests and the
  health check passed; the narrow 320px layout remains free of document overflow.
- 2026-08-17: Resolved FND-015 by replacing the raw category-array overlap expression
  with Drizzle's typed `arrayOverlaps` helper. The mandatory Playwright health check,
  server checks, 41 server tests, 7 mocked Products tests, and 3 real Products tests
  passed. The fresh filtered-state screenshot was inspected.
- 2026-08-22: Refined the Products filter dialog against Pencil node `DsR63`: compact
  520px modal proportions, horizontal icon/title header, semantic filter-pill colors,
  11px uppercase group labels, compact summary/footer spacing, and responsive one-row
  category pills. The Products route suite and Web typecheck passed; fresh desktop and
  narrow dialog screenshots were inspected.
- 2026-08-22: Standardized modal headers so icons sit to the left of the title and
  description across Product, Stock, Recipe, Identity, Dialog, and AlertDialog surfaces.
  Representative Product and Recipe modal flows passed Playwright validation, and fresh
  dialog captures were inspected.
- 2026-08-22: Reused the shared formatter hooks for Products stock quantities and
  registration dates, removing widget-local quantity/date formatting helpers. Web
  typecheck and the full Web unit suite passed.
