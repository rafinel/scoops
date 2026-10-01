---
title: Order printing
status: completed
revision: 5
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/44
scope:
  - apps/web/src/ui/pdv/widgets
  - apps/web/src/ui/shared/widgets/components/icon
  - apps/web/tests/pdv
last_updated_at: 2026-10-01
---

## 1. Context and scope

Provide Manager and Operator with a non-fiscal printed copy of a saved order from registration success and order details, including canceled orders. Source: [issue #44](https://github.com/rafinel/scoops/issues/44). Mode: **complete**, because three screen states and two paper layouts require DOM/SSR lifecycle and visual contracts within one application.

Today the saved order is displayed in the success view and history details, but neither offers printing. PRQ-16 consumes immutable snapshots (PRQ-09) and authenticated order access (PRQ-10), and provides a print-ready operational copy. Printing preserves the existing sale-registration → success → saved-details journey and PRQ-11 establishment/role isolation.

| Area | In scope | Out of scope |
| --- | --- | --- |
| Availability | Successful saved registration and accessible saved details; Manager/Operator; registered/canceled | Cart/draft printing, history bulk printing, automatic printing |
| Paper | Adaptable 80 mm thermal and A4 copies; locally configured printer/settings | 58 mm, printer setup, direct hardware protocol, silent printing |
| Content | Saved identity/date, operator, products/configurations, quantities, prices, discounts/Combos, totals, channel and status; cancellation facts | Costs/margins/internal identifiers, consumption and stock return/loss outcomes, fiscal documents |
| Interaction | Native browser/OS print dialog in the same page, repeatable action | Popup/new tab, paper selector in the app, PDF-generation library, external storage/provider |

| Source requirement | Delivery | Notes |
| --- | --- | --- |
| PRQ-16 Order Printing | full | Its Outcome/Actors/Consumes/Provides/Capabilities/Experience define this contract |
| PRQ-09 Order Snapshot | existing dependency | Read saved facts; do not alter snapshot generation or analytics facts |
| PRQ-10 Order History; PRQ-11 access/isolation | existing dependency | Reuse authorized loaded order; preserve cancellation permissions and navigation |

User-approved decisions: 80 mm and A4; extended saved content and explicit `Cópia não fiscal`; same-page native printing; secondary printer action on both details frames and registration success. Pencil now includes the two details buttons and four paper designs. Narrow actions stack at 390 × 844. No new technology dependency is required. PRQ-16 is checked by conclude-spec after passing local closure preflight; dependency checkboxes remain unchanged.

## 2. Implementation Contract

### Requirements

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | PRQ-16, PRQ-10, PRQ-11 | Offer Imprimir pedido on saved registration success and accessible registered/canceled details to both Manager and Operator |
| FR-02 | PRQ-16, PRQ-09 | Print approved saved facts, including optional item configuration, discount/Combo savings and cancellation metadata; label Cópia não fiscal; omit private operational facts |
| FR-03 | PRQ-16 | Open the native local-printer dialog on the current page; cancellation/repetition preserves URL, order, stock and sale state; no external provider |
| FR-04 | PRQ-16 Experience | Provide readable monochromatic 80 mm and A4 layouts, wrapping long content and paginating long orders without screen chrome |
| FR-05 | PRQ-16, PRQ-10, PRQ-11 | Expose printing only for a loaded saved order; disable while not ready/refreshing; recover from unavailable/failed dialog invocation without asserting printing succeeded |
| FR-06 | PRQ-16 Experience | Accessible action name, visible focus and keyboard activation; responsive action groups without clipping |

### Acceptance

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01, FR-02, FR-03 | Print saved registration | Successful order response | Either role activates Imprimir pedido | Dialog opens from persisted response; original success actions remain available; no second registration or catalog read | Confirmation/browser suites; MV-01 |
| AC-02 | FR-01, FR-02 | Details roles/statuses | Accessible registered/canceled order | Manager or Operator opens details and prints | Same action available; saved status retained; cancellation facts only when present; existing Manager cancellation guard unchanged | Details/browser suites; MV-02/MV-03 |
| AC-03 | FR-02 | Historical facts | Saved order and subsequently edited catalog/channel/Combo | Order is printed | Names/configurations/prices/savings remain saved values; no catalog-based rebuilding; no costs, IDs or stock outcomes on paper | Projection tests; browser suite; MV-02 |
| AC-04 | FR-03 | Cancel/repeat safety | Loaded order | Native dialog is canceled and action repeated | URL/snapshot/cart context unchanged; no mutation/network request from printing; action can be reused; no printed-success claim | Print hook/browser suites; MV-01/MV-02 |
| AC-05 | FR-02, FR-04 | Paper content/layout | Registered/canceled snapshots with optional and long fields/many lines | 80 mm or A4 selected | All required data readable, no cropped columns/lines; no shell/controls; non-fiscal text; optional absent fields omitted/fallback; text safely escaped | Document tests; MV-03 all four paper refs |
| AC-06 | FR-01, FR-05 | Loading/access/stale guards | Loading/error/not-found/denied route or refresh | User attempts to print | No order copy before authorized data exists; refresh disables action; no exposure of another establishment's order | Widget/browser tests; MV-02 |
| AC-07 | FR-03, FR-05 | Native/DOM lifecycle | SSR/hydration, failed API or active dialog | Mount/print/retry/leave page | No hydration mismatch; no premature print; duplicate guard; existing error feedback and retry; document/listeners removed on unmount | Hook/browser tests; MV-01/MV-02 |
| AC-08 | FR-01, FR-06 | Responsive accessibility | Desktop or 390 × 844 success/details | Tab and Enter/Space activate action | Visible focus/name; actions fit; dialog close allows continued keyboard use; existing actions/navigation work | Widget/browser tests; MV-01/MV-02 |

### Design contract

[Design handoff](./design/handoff.md) owns the seven inspected PNGs, exact frame/state mapping and transient capture IDs. Implementation and UI validation use only this saved handoff, its PNGs, repository source/Design/Rules and Playwright CLI; agents must not query Pencil MCP or the live canvas. Node IDs identify provenance only. Screen references are 1481 × 1050; runtime also validates 390 × 844. Four print references cover 80 mm/A4 × registered/canceled. Match hierarchy/tokens and relationships; paper height grows with content. The approved success-button extension and deferred supplemental states are recorded in the handoff. Printing excludes screen chrome and stock-result content even when shown in details. No animations are introduced; respect existing reduced-motion behavior.

## 3. Technical Contract

### Baseline

| Evidence | Current responsibility | Gap |
| --- | --- | --- |
| NewSalePage / useNewSalePage under `apps/web/src/ui/pdv/widgets/pages/new-sale-page/` | Keeps registeredOrder from registration response and renders OrderConfirmation | No print action; parent already supplies complete saved OrderDetails |
| OrderConfirmation in `order-confirmation/index.tsx` | Success card, existing actions and inline metadata/items helpers | Add print composition; move touched nontrivial logic/inline child components into compliant widget boundaries |
| OrderDetailsPage / useOrderDetailsPage under `apps/web/src/ui/pdv/widgets/pages/order-details-page/` | Authorized order query and loading/error/refetch state; role-specific cancellation | Add loaded-order print action; retain hook/query/cancellation behavior |
| `packages/core/src/pdv/domain/structures/order-details.ts` and `domain/entities/order.ts` | Readonly saved Order snapshot with Date values; lines/discounts/channel/cancellation | Existing data sufficient; no new payload/schema |
| Web PdvService plus existing register/get-order adapters | Converts serialized dates to domain OrderDetails | Reuse existing response; no print request or serializer change |
| Shared IconName / Lucide ICONS | Existing typed icon registry | printer key not yet registered |
| Existing OrderDetailsHeader | Inline sequence conversion and Intl date formatting in index | Move touched formatting to colocated useOrderDetailsHeader using shared formatter |
| `apps/web/src/constants/routes.ts` | Existing routes `/sales/new` and `/orders/$orderId` | Reuse unchanged route constants; no route generation |
| Shared formatter hooks and `styles/global.css` | Locale/date/currency formatting; screen tokens and 320 px minimum width | Reuse formatting/tokens; print CSS must prevent inherited minimum width from cropping 80 mm paper |

### Runtime and data ownership

PDV Web owns the action and printable representation. Existing success/details widgets pass their saved `OrderDetails` to one feature-shared `OrderPrint`. It renders an outline Button and, only after client mount, a hidden-on-screen document via React DOM portal directly into `document.body`. SSR and the first client render agree; the action remains disabled until its document is ready. No client API is accessed during server rendering.

The hook owns readiness, duplicate-invocation guard, native-dialog lifecycle and cleanup. Its handler calls `window.print()` on the current document; no route, window, provider, fetch, mutation, outbox or transaction is added. The browser API cannot distinguish successful printing from cancellation, so closing only restores availability and focus; it never records printing success. Use native lifecycle events and cleanup to prevent stuck busy state without inventing a timer-based print outcome. Missing/throwing API uses existing error notification and permits retry: `Não foi possível abrir a impressão. Tente novamente.` Parent refresh disables printing. Navigation/new sale removes the document and listeners; no retained order cache is added.

`useOrderPrintDocument` projects an explicit public display model from the prop. It uses shared currency/date/quantity formatters and existing locale/time-zone conventions. Format the printed sequence with the existing details five-digit minimum; keep item ordering and quantities. Dates come from `createdAt`/saved cancellation, never current time. Render product name, size name, brand name and saved accompaniment names when present; never infer missing units/configuration from the live catalog. Prices use saved `finalUnitPrice` and line `subtotal`; monetary totals use saved `subtotal`, `totalDiscount`, `total`. Display each saved discount name and savings; optional channel name/percentage, with `Sem canal` fallback. Registered operator is `createdByName`; cancellation uses `canceledByName`, `canceledAt` and optional `reason`. Do not expose object IDs, idempotency keys, costs, margin/allocation or stock-restoration details. React renders text; no HTML interpolation or document.write.

Print CSS is imported by this widget, hidden outside print media, and scopes isolation to pages with the body-level print document. During printing hide body siblings, reveal the document, reset inherited width/min-width/height/overflow as necessary and force existing light monochromatic token values. Other routes retain normal browser printing. Use `@media print` and `@page` without forcing a paper size; the native dialog owns printer/paper settings. Adapt item/metadata layout to printable width: receipt blocks on narrow thermal paper, aligned wide columns on A4; no fixed document height, ellipsis, hidden overflow or mandatory background graphics. Avoid splitting a normal item when it fits, but allow oversized content to paginate. Physical margins correspond to the references without installing a parallel global token system.

[React createPortal](https://react.dev/reference/react-dom/createPortal) documents the existing React DOM primitive; [MDN window.print](https://developer.mozilla.org/en-US/docs/Web/API/Window/print) documents the native dialog. Existing React/React DOM ^19.2.0 and Lucide ^1.31.0 remain; no new dependency, backend layer, persistence or external integration.

### apps/web — UI

Component hierarchy and explicit props:

| Widget | Kind/owner | Inputs and outputs | Children / behavior owner |
| --- | --- | --- | --- |
| OrderConfirmation | Existing Page child | order, onNewSale unchanged | useOrderConfirmation; pure OrderConfirmationBody composing heading/card/actions; actions compose OrderPrint |
| OrderDetailsPage | Existing Page | Existing route order and query states | Existing useOrderDetailsPage; OrderDetailsContent composes summary/items/totals; header receives printAction node containing OrderPrint |
| OrderDetailsHeader | Internal Component | Existing header props plus printAction: ReactNode | useOrderDetailsHeader owns sequence/date/status display and callback delegation; pure OrderDetailsBody composes heading/actions, print slot and existing cancel action |
| OrderPrint | Feature-shared Component | order: OrderDetails; disabled?: boolean | useOrderPrint; pure OrderPrintAction renders Button; portal OrderPrintDocument |
| OrderPrintDocument | Internal Component | order: OrderDetails | useOrderPrintDocument; pure OrderPrintBody composes header/items/summary/cancellation; OrderPrintItems renders OrderPrintLine |
| OrderPrintAction | Pure internal Component | isPrinting, isDisabled, handlePrint | Print Button markup; callback delegation only; no hook |
| OrderPrintBody | Pure internal Component | sequence, metadata, lines, totals, cancellation, count | Article and existing header/items/summary composition; no hook |
| OrderConfirmationHeading | Pure internal Component | none | Existing success heading/icon/description markup; no hook |
| OrderConfirmationCard | Pure internal Component | sequence, metadata, lines, total | Existing saved-order card with metadata/lines children; no hook |
| OrderConfirmationActions | Pure internal Component | order, handleNewSale | Existing detail/new-sale actions plus OrderPrint and footer; no hook |
| OrderDetailsHeading | Pure internal Component | sequence, handleBack | Existing back link and sequence heading markup; no hook |
| OrderDetailsActions | Pure internal Component | isCanceled, timestamp, printAction, canCancel, handleOpenCancel | Existing timestamp/action group; callback delegation only; no hook |
| OrderDetailsContent | Pure internal Component | order | Existing summary/items/totals grid markup; no hook |
| OrderConfirmationBody | Pure internal Component | order, sequence, metadata, lines, total, onNewSale | Existing success section wrapper, heading, card and actions children; no hook |
| OrderDetailsBody | Pure internal Component | isRefreshing, sequence, isCanceled, timestamp, printAction, canCancel, onBack, onOpenCancel | Existing refresh status/header wrapper, heading and actions children; no hook |
| OrderPrintHeader | Pure internal Component | sequence and formatted metadata tuples | Heading/metadata markup; no hook |
| OrderPrintItems | Pure internal Component | readonly formatted lines | Wide/thermal table and real OrderPrintLine; no hook |
| OrderPrintSummary | Pure internal Component | readonly formatted total rows, count and cancellation | Financial rows, cancellation child and footer; no hook |
| OrderPrintCancellation | Pure internal Component | preformatted date, actor and optional reason | Cancellation block markup; no hook |
| OrderPrintLine | Pure internal Component | Explicit formatted line view | Markup only; no hook |
| OrderConfirmationMetadata / OrderConfirmationLines | Pure internal Components | Explicit readonly formatted metadata/lines | Markup only; no hook |

Every component exports a widget-specific Props type and `const` entry point from its own index. Behavior/formatting/handlers live in the named colocated hook. Do not add local component declarations or generic widgets barrels. Extract confirmation children and header formatting only to bring the touched surfaces into selected Rules, preserving existing behavior. Existing header uses five-digit sequence display while confirmation uses four; preserve each screen convention, and use the five-digit details convention on the printable copy.

Expected widget trees (relative to repository root; each file has the same classification as the path table):

```text
apps/web/src/ui/pdv/widgets/components/order-print/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-action/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/use-order-print.ts [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print.css [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-body/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/use-order-print-document.ts [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-line/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-summary/order-print-cancellation/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-summary/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-items/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-header/index.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/tests/order-print.test.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/tests/use-order-print.test.ts [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/order-print-document.test.tsx [Create]
apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/use-order-print-document.test.ts [Create]
```

```text
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/index.tsx [Modify]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-body/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-actions/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-card/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-heading/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/use-order-confirmation.ts [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/use-order-confirmation.test.ts [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-metadata/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-lines/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/order-confirmation.test.tsx [Modify]
```

```text
apps/web/src/ui/pdv/widgets/pages/order-details-page/index.tsx [Modify]
apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-content/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/index.tsx [Modify]
apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/order-details-body/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/order-details-actions/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/order-details-heading/index.tsx [Create]
apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/use-order-details-header.ts [Create]
apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/tests/use-order-details-header.test.ts [Create]
apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/order-details-page.test.tsx [Modify]
```

The two browser-suite paths below are outside widget trees. Each affected path appears once in the owning-layer map.

| Path | Change | Declaration/surface | Widget/role | State/actions contract | Async/failure contract | Design/responsive/accessibility | Dependencies/tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-action/index.tsx` | Create | OrderPrintAction / OrderPrintActionProps | Pure internal Component | isPrinting, isDisabled, handlePrint; Print Button markup; callback delegation only | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderPrint composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-body/index.tsx` | Create | OrderPrintBody / OrderPrintBodyProps | Pure internal Component | sequence, metadata, lines, totals, cancellation, count; Article and existing header/items/summary composition | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderPrintDocument composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-heading/index.tsx` | Create | OrderConfirmationHeading / OrderConfirmationHeadingProps | Pure internal Component | none; Existing success heading/icon/description markup | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderConfirmation composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-card/index.tsx` | Create | OrderConfirmationCard / OrderConfirmationCardProps | Pure internal Component | sequence, metadata, lines, total; Existing saved-order card with metadata/lines children | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderConfirmation composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-actions/index.tsx` | Create | OrderConfirmationActions / OrderConfirmationActionsProps | Pure internal Component | order, handleNewSale; Existing detail/new-sale actions plus OrderPrint and footer | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderConfirmation composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/order-details-heading/index.tsx` | Create | OrderDetailsHeading / OrderDetailsHeadingProps | Pure internal Component | sequence, handleBack; Existing back link and sequence heading markup | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderDetailsPage composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/order-details-actions/index.tsx` | Create | OrderDetailsActions / OrderDetailsActionsProps | Pure internal Component | isCanceled, timestamp, printAction, canCancel, handleOpenCancel; Existing timestamp/action group; callback delegation only | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderDetailsPage composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-content/index.tsx` | Create | OrderDetailsContent / OrderDetailsContentProps | Pure internal Component | order; Existing summary/items/totals grid markup | No local state, effects or requests | Existing saved references/responsive contract; unchanged DOM/classes | OrderDetailsPage composition; real internal children; no dedicated hook/test |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-body/index.tsx` | Create | OrderConfirmationBody / OrderConfirmationBodyProps | Pure internal Component | order, sequence, metadata, lines, total, onNewSale; Existing success section wrapper, heading, card and actions children | No local state, effects or requests; callbacks delegated | Existing saved screen references; exact DOM/classes preserved | OrderConfirmation real composition suite; no hook/direct test |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/order-details-body/index.tsx` | Create | OrderDetailsBody / OrderDetailsBodyProps | Pure internal Component | isRefreshing, sequence, isCanceled, timestamp, printAction, canCancel, onBack, onOpenCancel; Existing refresh status/header wrapper, heading and actions children | No local state, effects or requests; callbacks delegated | Existing saved screen references; exact DOM/classes preserved | OrderDetailsPage real composition suite; no hook/direct test |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-summary/order-print-cancellation/index.tsx` | Create | OrderPrintCancellation / OrderPrintCancellationProps | Pure internal Component | preformatted cancellation date/actor/optional reason; pure cancellation markup | No hook, requests or handlers | Existing four paper references and wrapping | Real owning document composition test; AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-summary/index.tsx` | Create | OrderPrintSummary / OrderPrintSummaryProps | Pure internal Component | readonly formatted totals, count and cancellation; financial rows, cancellation child and footer | No hook, requests or handlers | Existing four paper references and wrapping | Real owning document composition test; AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-items/index.tsx` | Create | OrderPrintItems / OrderPrintItemsProps | Pure internal Component | readonly formatted lines; table header and real OrderPrintLine composition | No hook, requests or handlers | Existing four paper references and wrapping | Real owning document composition test; AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-header/index.tsx` | Create | OrderPrintHeader / OrderPrintHeaderProps | Pure internal Component | sequence and readonly metadata tuples; heading and metadata markup | No hook, requests or handlers | Existing four paper references and wrapping | Real owning document composition test; AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/components/order-print/index.tsx` | Create | OrderPrint / OrderPrintProps | Explicit Component boundary | Feature-shared Component; order: OrderDetails, disabled?: boolean; outline Button and native body portal | Wire useOrderPrint; portal absent during SSR; accessible Imprimir pedido; no fetching | Seven-frame handoff; screen-hidden and print-only | Confirmation and details; real document child; order-print.test.tsx |
| `apps/web/src/ui/pdv/widgets/components/order-print/use-order-print.ts` | Create | useOrderPrint | Colocated widget hook | Own DOM readiness, print guard, handlePrint, dialog lifecycle, error recovery and cleanup | Disabled before mounted/when parent disabled; prevent overlapping invocations; restore action after dialog; existing error notification | Seven-frame handoff; screen-hidden and print-only | Native browser only; use-order-print.test.ts |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print.css` | Create | Scoped print stylesheet | Feature-scoped stylesheet | Hide document on screen; isolate portal for printing; adaptable thermal/sheet layout | No fixed height or truncation; reset inherited minimum widths in scoped print mode | Seven-frame handoff; screen-hidden and print-only | Seven design references; print-media browser checks |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/index.tsx` | Create | OrderPrintDocument / OrderPrintDocumentProps | Explicit Component boundary | Internal Component; order: OrderDetails; semantic metadata, items, discounts, totals, cancellation | Render hook view model only; no interactions, requests or unsafe HTML | Seven-frame handoff; screen-hidden and print-only | useOrderPrintDocument; real OrderPrintLine; document component test |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/use-order-print-document.ts` | Create | useOrderPrintDocument | Colocated widget hook | Own snapshot projection and all display formatting; expose immutable line view type | Handle absent channel/configurations/discounts/reason; no recomputation of monetary totals | Seven-frame handoff; screen-hidden and print-only | Existing shared formatters; document hook test |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/order-print-line/index.tsx` | Create | OrderPrintLine / OrderPrintLineProps | Explicit Component boundary | Pure internal Component; explicit preformatted line prop; product/configuration/quantity/prices markup | No hook, state, handlers or local formatting; text wraps | Seven-frame handoff; screen-hidden and print-only | Document composition test; responsive print stylesheet |
| `apps/web/src/ui/pdv/widgets/components/order-print/tests/order-print.test.tsx` | Create | OrderPrint boundary tests | Widget boundary test | Mock own hook with vi.mocked; render real document composition | Readiness/disabled/action wiring; portal and accessible name | Seven-frame handoff; screen-hidden and print-only | AC-01, AC-02, AC-06, AC-08 |
| `apps/web/src/ui/pdv/widgets/components/order-print/tests/use-order-print.test.ts` | Create | useOrderPrint hook tests | Widget boundary test | Real hook; native print seam; DOM lifecycle and guards | Closed/canceled dialog recovery; duplicate invocation; unavailable/throwing API; unmount | Seven-frame handoff; screen-hidden and print-only | AC-04, AC-06, AC-07 |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/order-print-document.test.tsx` | Create | OrderPrintDocument boundary tests | Widget boundary test | Mock own hook; render real OrderPrintLine | Registered/canceled markup, omitted sections, non-fiscal copy, escaped text | Seven-frame handoff; screen-hidden and print-only | AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/use-order-print-document.test.ts` | Create | useOrderPrintDocument hook tests | Widget boundary test | Real projection over typed complete saved snapshots | Saved values, optional branches, private fields excluded, latest order props | Seven-frame handoff; screen-hidden and print-only | AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/index.tsx` | Modify | OrderConfirmation / OrderConfirmationProps | Explicit Component boundary | Keep order and onNewSale public props; compose print and existing sale actions | Move existing nontrivial display logic into own hook; real explicit child widgets | QuVaH approved extension; 1481 × 1050 and 390 × 844 | QuVaH accepted print extension; confirmation boundary test |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/use-order-confirmation.ts` | Create | useOrderConfirmation | Colocated widget hook | Own existing metadata/line view models, currency/date formatting and callback handler | Preserve current success behavior; delegate onNewSale; no new request | QuVaH approved extension; 1481 × 1050 and 390 × 844 | Shared formatters; real hook through new-sale browser suite |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/use-order-confirmation.test.ts` | Create | use-order-confirmation tests | Widget hook test | Public display values and callback outcomes | Real hook; no query/action direct tests | Existing saved screen state | Preserve four-digit screen sequence, saved metadata/lines and new-sale callback; AC-01, AC-08 |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-metadata/index.tsx` | Create | OrderConfirmationMetadata / OrderConfirmationMetadataProps | Explicit Component boundary | Pure child; explicit readonly label/value tuples | Extract existing inline OrderMetadata without product changes | QuVaH approved extension; 1481 × 1050 and 390 × 844 | Confirmation composition test; no dedicated test/hook |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/order-confirmation-lines/index.tsx` | Create | OrderConfirmationLines / OrderConfirmationLinesProps | Explicit Component boundary | Pure child; explicit readonly formatted lines | Extract existing inline OrderLineItems without product changes | QuVaH approved extension; 1481 × 1050 and 390 × 844 | Confirmation composition test; no dedicated test/hook |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/order-confirmation.test.tsx` | Modify | OrderConfirmation boundary tests | Widget boundary test | Mock useOrderConfirmation; real internal children | Print action and existing actions/content; typed complete fixtures | QuVaH approved extension; 1481 × 1050 and 390 × 844 | AC-01, AC-08 |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/index.tsx` | Modify | OrderDetailsPage | Explicit Component boundary | Pass loaded order to OrderPrint; pass node as header printAction slot | Existing loading/error/auth/cancel guards; disabled print during isRefreshingOrder | I2Kra/dPHci; 1481 × 1050 and 390 × 844 | I2Kra/dPHci; existing useOrderDetailsPage unchanged |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/index.tsx` | Modify | OrderDetailsHeader / OrderDetailsHeaderProps | Explicit Component boundary | Add printAction: ReactNode composition slot; move existing header formatting/handlers into own hook | Both roles/statuses; preserve Manager-only registered cancel action | I2Kra/dPHci; 1481 × 1050 and 390 × 844 | Stack actions at 390 px; useOrderDetailsHeader; page boundary and real browser coverage |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/use-order-details-header.ts` | Create | useOrderDetailsHeader | Colocated widget hook | Own existing sequence/date/status view model and handleBack/handleOpenCancel callback delegation | Reuse shared useFormatDate; optional canceled date fallback uses saved createdAt rather than current time; no requests | I2Kra/dPHci; 1481 × 1050 and 390 × 844 | Header composition in page boundary; real hook via order-page browser suite |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/tests/use-order-details-header.test.ts` | Create | use-order-details-header tests | Widget hook test | Public display values and callback outcomes | Real hook; no query/action direct tests | Existing saved screen state | Preserve five-digit sequence, shared date formatting, status and callback delegation; AC-02, AC-08 |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/order-details-page.test.tsx` | Modify | OrderDetailsPage boundary tests | Widget boundary test | Mock own page hook; render real header composition | Manager/Operator and both statuses; loading/error/refresh; cancel guard unchanged | I2Kra/dPHci; 1481 × 1050 and 390 × 844 | AC-02, AC-06, AC-08 |
| `apps/web/tests/pdv/new-sale-page.test.ts` | Modify | New-sale mocked-transport browser suite | Browser boundary | Real widget/hook composition after successful registration response | Print button/native API seam; immutable returned document; new-sale cleanup | QuVaH approved extension; 1481 × 1050 and 390 × 844 | AC-01, AC-04, AC-07, AC-08 |
| `apps/web/tests/pdv/order-page.test.tsx` | Modify | Order-details mocked-transport browser suite | Browser boundary | Real composition under Manager/Operator session fixtures | Registered/canceled content; GET errors; no print-triggered mutations | I2Kra/dPHci; 1481 × 1050 and 390 × 844 | AC-02, AC-03, AC-04, AC-06, AC-08 |

All screen paths follow the design/responsive/accessibility contract in section 2 and handoff. Print widget paths additionally follow the scoped paper lifecycle above. Pure child components receive formatted values and own no direct tests; their owning composition is exercised.

### apps/web — Composition

| Composition boundary | Kind/scope | Imports/dependencies | Provides/exports | Consumers | Lifecycle/order |
| --- | --- | --- | --- | --- | --- |
| Existing shared icon registry | Application UI registry | Existing lucide-react Printer | IconName printer + ICONS entry | Shared Icon consumed by OrderPrint | Static mapping, no provider lifecycle |

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/ui/shared/widgets/components/icon/types/icon-name.ts` | Modify | IconName | Add printer to existing typed icon union | Static | Existing Icon contract | No generation; OrderPrint consumer |
| `apps/web/src/ui/shared/widgets/components/icon/lucide-icon/icons.ts` | Modify | ICONS | Map printer to existing Lucide Printer; no dependency installation | Static | Existing Icon contract | No generation; OrderPrint consumer |

### Decisions and Builder boundary

| Decision | Chosen approach | Alternative considered | Reason | Accepted trade-off |
| --- | --- | --- | --- | --- |
| Printing | Current-page window.print | Popup/new route or printing/PDF package | Native local-printer choice, existing data, no new dependency | Browser settings/driver control actual output; success cannot be detected |
| Document isolation | Body portal and scoped print CSS | Print application subtree directly | Avoid shell, nested clipping and narrow-paper inherited width | Requires hydration/lifecycle and print-media validation |
| Content authority | Existing saved OrderDetails | Re-query current catalog | Preserve historical operation facts | No live product enrichment; optional snapshot fields stay optional |
| Paper coverage | Adaptable 80 mm and A4 | 58 mm or app paper selector | Approved operational formats | Other paper sizes unvalidated |

Allowed production/test edits are exactly the UI and Composition path tables. Owning module is PDV; shared icon changes are wiring only. Prohibited changes: Core/Server/Validation, REST services, query/action hooks, routes/generated route tree, database/migrations, package manifests/lockfile, global screen stylesheet, PRD implementation checkboxes and unrelated widgets. No generated artifacts. If implementation requires expansion, amend the Contract and recompute Rules first. Builder exits are the applicable commands and behavior checks in section 4; the Orchestrator owns real-service manual/visual evidence.

## 4. Validation Contract

### Test ownership and strategy

The complete policy is `test-integrity.config.mjs`, enforced by `scripts/check-test-integrity.mjs`. Widget behavior `.ts` sources are allowed for direct hook tests; component `index.tsx` sources are excluded from file-local direct pairing but widget tests are permitted boundary suites. Icon union/registry receive indirect consumer coverage and type checks; no dedicated test is added. CSS is covered through browser/manual layout. Pure children have owning-composition coverage. Query/action hooks, REST adapters and shared formatting hooks receive no dedicated tests. All widget tests stay in `tests/` with `.test.ts(x)` suffix. Component tests mock their own hook via typed `vi.mocked`, render real internal children and use real assertions; linked hook/browser tests cover real behavior. No forbidden query-hook tests or per-index source-pair tests.

| Test file | Test type | Target | Coverage goal |
| --- | --- | --- | --- |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/tests/use-order-details-header.test.ts` | Widget hook | use-order-details-header | Preserve five-digit sequence, shared date formatting, status and callback delegation; AC-02, AC-08 |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/use-order-confirmation.test.ts` | Widget hook | use-order-confirmation | Preserve four-digit screen sequence, saved metadata/lines and new-sale callback; AC-01, AC-08 |
| `apps/web/src/ui/pdv/widgets/components/order-print/tests/order-print.test.tsx` | Component boundary | OrderPrint boundary tests | Readiness/disabled/action wiring; portal and accessible name; AC-01, AC-02, AC-06, AC-08 |
| `apps/web/src/ui/pdv/widgets/components/order-print/tests/use-order-print.test.ts` | Widget hook | useOrderPrint hook tests | Closed/canceled dialog recovery; duplicate invocation; unavailable/throwing API; unmount; AC-04, AC-06, AC-07 |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/order-print-document.test.tsx` | Component boundary | OrderPrintDocument boundary tests | Registered/canceled markup, omitted sections, non-fiscal copy, escaped text; AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/use-order-print-document.test.ts` | Widget hook | useOrderPrintDocument hook tests | Saved values, optional branches, private fields excluded, latest order props; AC-03, AC-05 |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/order-confirmation.test.tsx` | Component boundary | OrderConfirmation boundary tests | Print action and existing actions/content; typed complete fixtures; AC-01, AC-08 |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/order-details-page.test.tsx` | Component boundary | OrderDetailsPage boundary tests | Manager/Operator and both statuses; loading/error/refresh; cancel guard unchanged; AC-02, AC-06, AC-08 |
| `apps/web/tests/pdv/new-sale-page.test.ts` | Mocked-transport browser | New-sale mocked-transport browser suite | Print button/native API seam; immutable returned document; new-sale cleanup; AC-01, AC-04, AC-07, AC-08 |
| `apps/web/tests/pdv/order-page.test.tsx` | Mocked-transport browser | Order-details mocked-transport browser suite | Registered/canceled content; GET errors; no print-triggered mutations; AC-02, AC-03, AC-04, AC-06, AC-08 |

| Test file | Test case | Description | Assertions |
| --- | --- | --- | --- |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-header/tests/use-order-details-header.test.ts` | use-order-details-header public contract | Real hook with shared formatter boundaries | Preserve five-digit sequence, shared date formatting, status and callback delegation; AC-02, AC-08 |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/use-order-confirmation.test.ts` | use-order-confirmation public contract | Real hook with shared formatter boundaries | Preserve four-digit screen sequence, saved metadata/lines and new-sale callback; AC-01, AC-08 |
| `apps/web/src/ui/pdv/widgets/components/order-print/tests/order-print.test.tsx` | OrderPrint boundary state matrix | Mock own hook with vi.mocked; render real document composition | Readiness/disabled/action wiring; portal and accessible name |
| `apps/web/src/ui/pdv/widgets/components/order-print/tests/use-order-print.test.ts` | useOrderPrint hook state matrix | Real hook; native print seam; DOM lifecycle and guards | Closed/canceled dialog recovery; duplicate invocation; unavailable/throwing API; unmount |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/order-print-document.test.tsx` | OrderPrintDocument boundary state matrix | Mock own hook; render real OrderPrintLine | Registered/canceled markup, omitted sections, non-fiscal copy, escaped text |
| `apps/web/src/ui/pdv/widgets/components/order-print/order-print-document/tests/use-order-print-document.test.ts` | useOrderPrintDocument hook state matrix | Real projection over typed complete saved snapshots | Saved values, optional branches, private fields excluded, latest order props |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/tests/order-confirmation.test.tsx` | OrderConfirmation boundary state matrix | Mock useOrderConfirmation; real internal children | Print action and existing actions/content; typed complete fixtures |
| `apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/order-details-page.test.tsx` | OrderDetailsPage boundary state matrix | Mock own page hook; render real header composition | Manager/Operator and both statuses; loading/error/refresh; cancel guard unchanged |
| `apps/web/tests/pdv/new-sale-page.test.ts` | New-sale mocked-transport browser suite state matrix | Real widget/hook composition after successful registration response | Print button/native API seam; immutable returned document; new-sale cleanup |
| `apps/web/tests/pdv/order-page.test.tsx` | Order-details mocked-transport browser suite state matrix | Real composition under Manager/Operator session fixtures | Registered/canceled content; GET errors; no print-triggered mutations |

Mocked native print calls prove invocation/lifecycle, not a visible operating-system dialog or physical output. Committed Playwright suites use mocked transport; they are not evidence of real authentication/persistence. Browser cases assert document fields and unchanged URL/no print-triggered mutation, rather than only spy counts. Typed fixtures include full saved snapshots and optional branches; privacy assertions address actual output, not mock projection alone.

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| AC-01 | Confirmation component; new-sale browser suite | MV-01 | EV-01 registration/actions |
| AC-02 | Details component/browser; document component | MV-02, MV-03 | EV-02 roles/status; EV-03 canceled papers |
| AC-03 | Document projection hook; details browser suite | MV-02 | EV-02 saved values; EV-03 content |
| AC-04 | Print hook; both browser suites | MV-01, MV-02 | EV-01/EV-02 native cancel/repeat safety |
| AC-05 | Document component/projection; print-media checks | MV-03 | EV-03 four reference comparisons and long-content capture |
| AC-06 | Details component/browser; print hook | MV-02 | EV-02 guards/denial/refresh |
| AC-07 | Print hook; new-sale browser real composition | MV-01, MV-02 | EV-01/EV-02 hydration/lifecycle/recovery |
| AC-08 | Print/confirmation/details components; both browser suites | MV-01, MV-02 | EV-01/EV-02 desktop/narrow keyboard captures |

Record commands, assertions, capture paths and comparisons in [evaluation.md](./evaluation.md), created at implementation kickoff. No runtime evidence is claimed by this Spec.

### Manual validation prerequisites

Use Playwright CLI exclusively for browser interaction. Inspect `docker compose ps`, server `/health` at `http://localhost:3336/health`, and web response at `http://localhost:4000` before real-service flows. PostgreSQL is on localhost:54322; Mailpit localhost:54324 only if authentication setup needs it. Verify local seeded Manager (`manager.seed@scoops.com`) and Operator (`operator.seed@scoops.com`) and establishment membership; use the existing auth setup/environment configuration without recording credentials. Browser storage files are `apps/web/playwright/.auth/manager.json` and `operator.json` as declared by the auth-state module. If missing, explicitly run the documented seed before auth setup; never let Playwright silently reset the database. Use persistent server/web dev sessions only when needed, wait for compilation/bootstrap, and stop processes started for validation afterward; leave shared Docker services running.

Use saved orders in this establishment with configurations, channel, Combo savings and one canceled snapshot with actor/date/reason. Include no-channel/no-discount/optional-reason cases and a long-text/many-lines fixture. Obtain a known inaccessible order from another establishment for denial checks without granting access or changing tenancy. Inspect failed network requests/console/hydration warnings and classify each as fixed, pre-existing or blocking. Screen dimensions are 1481 × 1050 and 390 × 844; compare against handoff refs/approved responsive assumptions. Native dialogs require a headed host with working OS/browser printing; browser automation emulation alone cannot close that evidence requirement.

### MV-01 — Successful registration and repeatable native printing

Covers AC-01, AC-04, AC-07, AC-08. Use real Manager and Operator sessions, catalog fixtures and required services above. Start `/sales/new` at 1481 × 1050; reference QuVaH/accepted secondary-action extension.

1. Register an order with saved configuration/channel/discount fixtures. Verify registration response/order identity and success state, capturing fresh desktop evidence.
2. Tab to Imprimir pedido; inspect visible focus/name and activate using Enter. Observe native dialog and select an available local printer. Cancel the dialog, then repeat via Space; verify availability/focus and retained success/order identity/URL.
3. Check the network for no printing request, duplicate registration or catalog reload. Compare loaded snapshot and stored order GET before/after printing. No printed-success toast or stock change.
4. At 390 × 844 capture stacked actions and keyboard operation. Exercise Ver pedido, then a fresh success fixture's Iniciar nova venda; ensure no stale print document remains.
5. Inspect console/failed requests/hydration and record native-dialog observation separately from automated invocation. Evidence EV-01, desktop/narrow capture paths and preserved-state results; cleanup task-started sessions at end of all scenarios.

### MV-02 — Saved details, access and historical content

Covers AC-02, AC-03, AC-04, AC-06, AC-07, AC-08. Real Manager/Operator sessions and establishment-scoped registered/canceled fixtures; same service checks. Start `/orders/$orderId` at 1481 × 1050, references I2Kra/dPHci.

1. Open each status as both roles. Confirm Imprimir pedido; only existing Manager/registered cancellation remains. Compare document projection to the saved GET response, including cancellation and omitted private fields.
2. With a task-owned catalog fixture, rename/change a referenced product/channel/Combo using existing Manager UI; reload saved order and confirm printed names/prices/savings remain its snapshot. Restore task-owned fixture changes afterward.
3. Print/cancel/repeat with keyboard; verify URL and saved state unchanged and no print-triggered network mutation. Capture fresh registered/canceled desktop and 390 × 844 states, visible focus and unclipped actions.
4. Inspect loading and refresh behavior; print disabled until ready/during refetch. Visit missing/inaccessible order and confirm existing error state and no print document. Verify actual denied/not-found network result; controlled test errors remain separate mocked evidence.
5. Leave details and confirm document removal. Check console/network; evidence EV-02 records role/status/access/snapshot assertions and fresh screenshot paths. Restore fixtures and stop only processes started for this validation after MV-03.

### MV-03 — Both paper layouts and canceled content

Covers AC-02, AC-03, AC-05. Real accessible saved fixtures and headed native-dialog host, required services/accounts above. Start saved details and use all four paper refs from handoff; print widths 80 mm and A4 210 × 297 mm. Supporting print-media captures use 302 px/794 px widths and content-driven height, matching reference dimensions for sample-length content.

1. For registered and canceled snapshots, open native print preview, choose 80 mm then A4 using the local printer/browser settings. Inspect all pages: no shell/actions, no horizontal clipping, clear status/non-fiscal identity, metadata/configurations, saved unit/subtotal/discount/final totals, cancellation actor/time/reason where present.
2. Use Playwright CLI to emulate print media for fresh supporting captures; inspect actual DOM and compare each layout/state with lFo88/Y7CU6l/YtJxW/aWCXQ. Record CSS/layout screenshots separately from native-dialog observation. A test PDF may support pagination inspection; no production PDF technology is introduced.
3. Repeat with long names/configurations/reason and enough lines for multiple A4 pages; verify wrapping, no lost items and readable receipt width. Optional fields omit cleanly, both screen themes produce monochromatic paper, existing minimum width does not crop receipt output.
4. Cancel print dialogs, return focus and inspect unchanged URL/order/network/console. Record EV-03 four comparisons, paper settings, multi-page evidence and any driver limitations. If native preview cannot be observed, retain that manual evidence as pending; never substitute a print spy for it. Cleanup task-owned fixture changes and application processes.


Use the installed CLI with accessible role/name locators and inspect each state, for example:

```sh
playwright-cli open http://localhost:4000
playwright-cli state-load apps/web/playwright/.auth/manager.json
playwright-cli goto http://localhost:4000/sales/new
playwright-cli resize 1481 1050
playwright-cli snapshot
playwright-cli press Tab
playwright-cli press Enter
playwright-cli resize 390 844
playwright-cli screenshot --filename=test-results/order-print-success-mobile.png
playwright-cli console
playwright-cli requests
playwright-cli close
```

Load the Operator state analogously. Adapt snapshot actions to the actual fixture; `playwright-cli run-code` may use role locators, `page.emulateMedia({ media: 'print' })` and paper-width screenshots for MV-03. CLI JavaScript dialog dismissal does not dismiss the operating-system print dialog; native preview/cancel observation remains a separate headed-host check.

### Commands and exits

| Command | Purpose/coverage |
| --- | --- |
| `pnpm --filter web check:code` | Web code conventions |
| `pnpm --filter web check:architecture` | Dependency direction and UI placement |
| `pnpm --filter web check:types` | Props, snapshot projection and complete icon mapping |
| `pnpm --filter web check:complexity` | Existing complexity policy |
| `pnpm check:test-integrity` | Allowed widget/boundary test ownership and locations |
| `pnpm --filter web test:coverage` | Component/hook coverage; preserve repository configured thresholds |
| `pnpm --filter web exec playwright test tests/pdv/new-sale-page.test.ts tests/pdv/order-page.test.tsx` | Focused committed mocked-transport browser flows |
| `pnpm --filter web test:integration` | Integrated Web browser suite |
| `pnpm --filter web build` | SSR/build and imported print stylesheet compatibility |
| `docker compose ps` | Required real-flow service state |
| `pnpm --filter server dev` and `pnpm --filter web dev` | Persistent real-service sessions for MV scenarios when not already running |
| `pnpm --filter web test:auth:setup` | Persisted browser authentication after verifying seed accounts |
| `pnpm --filter server db:seed` | Only explicitly if necessary seeded accounts are absent; resets local seed/auth data |
| `pnpm check:spec-implementation -- documentation/features/pdv/order-printing/spec.md` | During implementation, check allowed paths/classifications against resulting files/diff |

Core and Server `test:coverage` are omitted because neither workspace changes; Validation has no changed schema. HTTP route/controller/.rest contracts remain unchanged, so REST-client parity is unaffected. Do not create screenshot-only integration suites or modify coverage thresholds. Implement-spec determines actual evidence readiness and owns the manual/visual verdict.

## 5. Documentation alignment and revision history

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| `documentation/prds/pdv.md` | PRQ-16 and snapshot/access dependencies | confirmed | Existing approved product behavior; PRQ-16 checked by conclude-spec after complete local traceability |
| `documentation/architecture.md` | Layer/dependency boundaries | confirmed | Web-only rendering/native DOM; no new provider/core browser dependency |
| `documentation/modules.md` | PDV ownership | confirmed | Print saved PDV order; do not absorb stock/fiscal rules |
| `documentation/design.md` | Tokens, typography, accessibility | confirmed | Reuse Button/Icon/Manrope; feature-local paper adaptation |
| `documentation/tooling.md` | Validation commands and coverage | confirmed | Existing pnpm/Vitest/Playwright; no installation |
| `documentation/sdd.md` | Spec lifecycle and evidence | confirmed | Revision 5; existing evaluation preserved; conclusion owns delivery checkbox update |
| `documentation/rules.md` | Rule routing | confirmed | Selected three Rules below; no route/REST/Domain edits |
| `test-integrity.config.mjs` | Test ownership | confirmed | Widget hooks/direct tests; widget/browser boundary suites; no forbidden direct tests |
| `design/onoreo.pen` and `documentation/features/pdv/order-printing/design/handoff.md` | Approved visual references | confirmed | Details printer actions and four paper frames exported; accepted success/narrow extensions documented |

| Rule | Applies to | Evaluated revision |
| --- | --- | --- |
| `documentation/rules/code-conventions-rules.md` | All changed TS/TSX | `3ac7d236594573a6f1148171e14a754096cec143` |
| `documentation/rules/ui-layer-rules.md` | Widget/hook boundaries, formatting, icon composition | `3ac7d236594573a6f1148171e14a754096cec143` |
| `documentation/rules/widget-testing-rules.md` | Typed own-hook mocks, tests/ placement and real internal composition | `3ac7d236594573a6f1148171e14a754096cec143` |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| 1 | 2026-09-30 | Initial saved-order printing Contract, seven design refs, Web ownership and validation | Issue #44 and approved native-print/paper/content/design choices |
| 2 | 2026-09-30 | Add dedicated confirmation/header behavior-hook tests | Mandatory implement-spec behavior-hook coverage gate; product and design unchanged |
| 3 | 2026-09-30 | Add four pure print-document child widget paths | Enforce existing UI component boundaries and complexity thresholds without changing product/design |
| 4 | 2026-09-30 | Add eight pure action/body/screen child boundaries; shorten private data/lifecycle helpers in existing hook modules | Measured MI warnings require smaller hook-owning composition boundaries; no product/design/dependency changes |
| 5 | 2026-09-30 | Add two pure confirmation/header body wrappers | Final two measured MI warnings require separating owning-hook composition from existing screen wrapper markup; no product/design changes |

Recommended execution: direct `implement-spec`. One cohesive Web capability uses stable existing data/dependencies; the native-dialog and paper evidence fit three canonical manual scenarios without meaningful phased delivery. No Plan or Evaluation is created by create-spec.

## Delivery outcome

Revision 5 completed: native same-page order printing on confirmation and details, with saved-snapshot 80 mm/A4 output. FR-01–06, AC-01–08 and MV-01–03 passed; PRQ-16 fully delivered. Detailed validation, human native-print attestation, visual comparisons, findings and candidate CI are retained in [evaluation.md](./evaluation.md). Delivery: [PR #50](https://github.com/rafinel/scoops/pull/50).
