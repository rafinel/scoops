# New Sale design manifest

## Source

- Pencil document: design/onoreo.pen
- Source issue: https://github.com/rafinel/scoops/issues/23
- Inspection date: 2026-08-26
- Manifest revision date: 2026-08-27
- Reference mode: supplied design; implementation matches covered states using
  existing Scoops tokens and reusable components.

## Exported evidence

| Export | Pencil node | State | Dimensions | Implementation responsibility |
| --- | --- | --- | --- | --- |
| jKmSB.png | jKmSB, Tela Nova venda | Desktop catalog and current order | 1481 x 1050 | Product search/tabs/cards, optional channel, cart rows, totals, Combo breakdown, entry action. |
| QavkX.png | QavkX, Frame Configurar porção | Portion dialog | 756 x 966 | Required size, optional accompaniments, unavailable choice, quantity, price, add/cancel. |
| YKYIX.png | YKYIX, Frame Configurar revenda | Resale dialog | 756 x 866 | Required brand/package, unavailable brand, quantity, price, add/cancel. |
| BWsuP.png | BWsuP, Dialog Conflitos do pedido | Revalidation conflict | 717 x 547 | Combo/stock conflict and review action; no registration. |
| olIiS.png | olIiS, Dialog Pedido atualizado | Valid reprice | 717 x 546 | Channel/Combo changes, updated total, re-confirmation. |
| e6D4f.png | e6D4f, Dialog Corrija o pedido | Correction required | 717 x 564 | Preserve selections, identify correction action, no registration. |
| o81IK.png | o81IK, Dialog Falha ao registrar pedido | Confirmed rollback | 717 x 420 | Integrity assurance after server-confirmed rollback, preserve cart/key, return/retry. |
| QuVaH.png | QuVaH, Tela Pedido registrado | Registered confirmation | 1481 x 1050 | Immutable sequence/order summary and follow-up actions. |

## Implementation-facing screenshot coverage

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| [jKmSB.png](./jKmSB.png) | /sales/new, populated desktop workflow | 1481 x 1050 | authenticated shell; search and kind tabs; product cards/statuses; optional channel; right cart with editable lines, Combo breakdown, subtotal/discount/total and register action | search, filter, select, edit/remove/clear and open registration | Manager-only discounts catalog is excluded; cards must use Scoops tokens rather than literal Pencil styling | RF-02, RF-05, RF-06, RF-07; CA-02, CA-05, CA-06; MV-01 |
| [QavkX.png](./QavkX.png) | /sales/new, Portion configuration dialog | 756 x 966 | title/product identity; required size; optional accompaniment choices; unavailable treatment; quantity; live price; cancel/add actions | pointer and keyboard selection, disabled choice, validation, edit restoration, focus return | exact source frame is a dialog export rather than browser viewport; surrounding page remains inert | RF-03, RF-11; CA-03, CA-12; MV-01/MV-06 |
| [YKYIX.png](./YKYIX.png) | /sales/new, Resale configuration dialog | 756 x 866 | title/product identity; applicable brand/package options; unavailable treatment; quantity; live price; cancel/add actions | by-brand selection, single-stock omission, disabled choice, validation, edit restoration and focus return | exact source frame is a dialog export rather than browser viewport | RF-04, RF-11; CA-04, CA-12; MV-01/MV-06 |
| [BWsuP.png](./BWsuP.png) | /sales/new, review-required conflict | 717 x 547 | conflict heading, itemized Combo/stock information and review action | preserve cart, return to editable state, no registration | used for valid configurations with shortage/conflict; invalid configuration uses e6D4f | RF-08, RF-11; CA-08, CA-12; MV-04 |
| [olIiS.png](./olIiS.png) | /sales/new, repriced | 717 x 546 | changed channel/Combo values, updated total and re-confirm action | no write, preserve rebuilt selections, require explicit confirmation | must not imply that an order exists | RF-08, RF-11; CA-07, CA-12; MV-03 |
| [e6D4f.png](./e6D4f.png) | /sales/new, correction-required | 717 x 564 | invalid selection details, corrective copy and return action | preserve valid selections and focus the repair path, no registration | dominates shortages when any invalid configuration exists | RF-08, RF-11; CA-08, CA-12; MV-04 |
| [o81IK.png](./o81IK.png) | /sales/new, server-confirmed rollback | 717 x 420 | failure heading, explicit integrity assurance and return/retry action | retain cart/key and allow retry only after trustworthy rollback response | prohibited for unknown transport; neutral verification has no supplied frame | RF-11, RF-12; CA-11, CA-12; MV-05 |
| [QuVaH.png](./QuVaH.png) | /sales/new, registered success | 1481 x 1050 | sequence/status emphasis, immutable order lines/pricing and new-sale action | clear mutable cart/key and start a fresh sale; order-detail affordance is non-delivered | order detail itself is excluded | RF-09, RF-10, RF-11; CA-09, CA-10, CA-12; MV-01 |

## Supplemental screenshot decision

| Proposed route/surface/state and fixture | Exact viewport | Why supplied references are insufficient | Criteria clarified | Decision |
| --- | --- | --- | --- | --- |
| /sales/new populated stacked workflow as Manager, including reachable total and register action | 390 x 844 | The supplied bundle contains only desktop page frames and dialog-sized exports, so it does not define catalog/cart stacking, overflow or sticky-action behavior on a phone viewport. | RF-05, RF-11; CA-05, CA-12; MV-06 | Recommended supplemental coverage, deferred to implementation. Capture a fresh Playwright CLI screenshot after the responsive widget exists, compare hierarchy with jKmSB, and record its transient artifact path and console/layout result in evaluation.md. No acceptance gap remains because the Spec explicitly requires stacking and reachable total/action. |
| /sales/new neutral Verificando registro after a dropped POST response, Manager fixture | 390 x 844 | o81IK proves only a server-confirmed rollback and would communicate a false guarantee for unknown transport. | RF-12; CA-11, CA-12; MV-05 | Required state with an explicitly accepted visual assumption from the user: use the existing feedback/dialog primitives, neutral copy, visible progress and no rollback assurance. Capture desktop and 390 x 844 Playwright evidence during implementation; no new Pencil screenshot is required before implementation. |

## Visual and interaction inventory

- Desktop uses existing sidebar/header, catalog work area, and persistent
  right-hand cart. Narrow screens stack sections without hiding total/action.
- Catalog labels distinguish Disponível, Adicionado, and Sem estoque; unavailable
  valid choices are visibly muted and not selectable.
- Portion and Resale are separate semantic dialogs. Their required controls,
  quantity, base/final price, and action label update together.
- Reprice, correction, conflict, and confirmed rollback are distinct dialogs
  with different recovery behavior, not a generic toast.
- User-approved extension: an interrupted request first shows neutral
  Verificando registro feedback while it replays the unchanged idempotency key.
  It makes no no-write assertion. The supplied o81IK dialog is shown only after
  a server-confirmed rollback response.
- Success emphasizes sequence/status and immutable summary. Ver pedido remains
  only a link affordance until order detail is delivered.
- Pencil Manrope/purple values are reference only. Production maps hierarchy to
  existing Scoops typography/tokens, shadcn components, responsive/focus, and
  reduced-motion behavior.

## Validation record

- All eight supplied nodes were inspected in Pencil with screenshots before
  authoring.
- Pencil produced all PNGs above; local file inspection verified valid PNG
  dimensions.
- jKmSB.png was re-opened after export and found visually intact. The other
  states were inspected directly through Pencil screenshots.
- No narrow Pencil frame was supplied. The responsive and neutral-verification
  decisions above are recorded assumptions/deferrals, not claims that a missing
  design screenshot already exists.
