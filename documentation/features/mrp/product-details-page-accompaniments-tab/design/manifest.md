# Product details Accompaniments tab — design manifest

The authoritative Pencil source is `design/onoreo.pen`. The six named nodes were exported
at scale 1 on 2026-08-22, verified as non-empty PNG files in the repository workspace and
visually inspected. Modal exports include outer backdrop/shadow bounds, so their PNG
dimensions exceed the nominal 520 px Pencil frames. Runtime copy, brands, quantities and
counts come from persisted establishment data rather than the visible fixtures.

## Reference inventory

| Reference | Pencil file/node | Route/surface/state | Viewport/export | Required visible inventory | Interaction/state coverage | Ambiguities, authority overrides and exclusions | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [b1dyL.png](./b1dyL.png) | `design/onoreo.pen` / `b1dyL` | `/products/:productId/accompaniments`, populated Portion product | 1560 × 1097 | Existing application shell, breadcrumb and product identity; category-aware tabs with Accompaniments selected; count/subtitle and Link accompaniment CTA; table columns for accompaniment, type, current main brand, quantity per portion, commercial price and actions | Open Link/Edit/Remove; read five linked rows | The single visible price conflicts with size-owned PDV pricing and renders as `Não disponível` in this slice. Adjacent tabs are non-normative. Brand is dynamically derived, never stored on the link. | `ProductAccompanimentsSlot`, `ProductAccompanimentsCard`, `ProductAccompanimentsTable` | Existing shell, card, table, badge, button and icon primitives; documented Scoops tokens | `CA-01`–`CA-04`, `CA-07`, `MV-01`, desktop comparison |
| [iSdux.png](./iSdux.png) | `design/onoreo.pen` / `iSdux` | Link accompaniment dialog | nominal 520 px wide; export 676 × 843 | Accompaniment selector, type selector, Manage types link, current-main-brand context, positive quantity with product-unit suffix, current cost preview, Cancel and Link | Select eligible product/type, enter quantity, navigate to types, submit and retain values on failure | Brand is read-only current-source context despite the selector appearance. The editable commercial-price field is intentionally omitted; PDV pricing is excluded. Use the current Design semantic-icon dialog header while retaining the frame hierarchy. | `ProductAccompanimentDialog` add mode | Existing Dialog, Select/search, form field, context/metric, button and semantic-icon treatments | `CA-03`–`CA-05`, `CA-13`, `MV-01` |
| [DyrWo.png](./DyrWo.png) | `design/onoreo.pen` / `DyrWo` | Edit accompaniment dialog | nominal 520 px wide; export 676 × 843 | Locked accompaniment identity, editable type and quantity, current-main-brand context, current cost preview, Cancel and Save | Change type/quantity; preserve form and retry a failed save | Product and brand are immutable link inputs. Commercial price remains absent. Use the authority-aligned semantic-icon header. | `ProductAccompanimentDialog` edit mode | Same primitives and tokens as add mode | `CA-03`, `CA-06`, `CA-13`, `MV-01` |
| [A5c2Q.png](./A5c2Q.png) | `design/onoreo.pen` / `A5c2Q` | `/accompaniment-types`, populated first page | 1560 × 956 | Application shell with Types destination selected; title/subtitle and New type CTA; count, in-use warning, table with Name/Usage/Status/Actions; Available versus In use treatment; pagination | Create, edit, remove unused type and change URL-backed page | Visible three-row fixture and `1–3 of 24` are illustrative; runtime page size is 10. Types destination is Manager-only. | `AccompanimentTypesPage`, `AccompanimentTypesCard`, `AccompanimentTypesTable` | Existing page, card, table, badge, pagination, button and icon primitives | `CA-08`–`CA-11`, `MV-02`, desktop comparison |
| [PUht1.png](./PUht1.png) | `design/onoreo.pen` / `PUht1` | Create type dialog | nominal 520 × 400; export 676 × 562 | Name field, concise help/info, Cancel and Add type | Validate unique trimmed name, submit, retain context on failure | Missing invalid/pending/server-error states follow the Spec. Use the current semantic-icon header pattern. | `AccompanimentTypeDialog` create mode | Existing Dialog, form, alert/info and button primitives | `CA-09`, `CA-13`, `MV-02` |
| [l5ItL.png](./l5ItL.png) | `design/onoreo.pen` / `l5ItL` | Edit type dialog | nominal 520 × 400; export 676 × 562 | Existing name, usage-impact information, Cancel and Save | Rename and retry failure without losing input | The usage count is live data. Rename updates the shared type identity and therefore every linked row. Use the current semantic-icon header pattern. | `AccompanimentTypeDialog` edit mode | Same primitives and tokens as create mode | `CA-10`, `CA-13`, `MV-02` |

## Layout inspection

| Node | Result |
| --- | --- |
| `b1dyL` | The 1560 × 1097 export is visually complete. Pencil reports the Sidebar and Content instances partially clipped because their 1100 px height exceeds the parent by 3 px; no required content is visibly truncated. Implementation follows the responsive app shell rather than reproducing this source-frame mismatch. |
| `iSdux` | The complete selector, context, preview and footer are visible within the 676 × 843 export; no overlap or content truncation is visible. |
| `DyrWo` | The complete Edit composition is visible within the 676 × 843 export; no overlap or content truncation is visible. |
| `A5c2Q` | The 1560 × 956 export is visually complete; title, warning, rows and pagination remain visible without clipping. |
| `PUht1` | The complete Create form and footer fit within the 676 × 562 export without visible clipping. |
| `l5ItL` | The complete Edit form, usage notice and footer fit within the 676 × 562 export without visible clipping. |

## Responsive contract

No narrow Pencil frame is supplied. At 320 × 900, both pages preserve one-column reading
order, visible focus and no page-level horizontal overflow. Data tables use a contained
horizontal-scroll region with an accessible label; card headings and actions wrap; dialog
bodies scroll internally when required and footer actions remain reachable. The existing
desktop sidebar may remain hidden below `lg`; shared mobile application navigation is
excluded. The types route remains reachable from the dialog's Manage types link and direct
URL. Desktop comparison uses the saved references; narrow validation is behavioral and
layout-based.

## Supplemental coverage decisions

| Proposed reference | Viewport and fixture | Gap and criteria clarified | Decision |
| --- | --- | --- | --- |
| Accompaniments loading, empty, GET error/retry and unavailable current source | 1560 × 1097, Manager, Portion | The page frame shows populated success only; `CA-01`, `CA-02`, `CA-04`, `CA-12` require recovery and unavailable-source states. Existing Scoops state patterns plus the exact Spec behavior are sufficient. | Recommended supplemental; defer to fresh implementation screenshots in `MV-01`. |
| Link/edit mutation validation, pending, duplicate and server failure | 676 × 843, Manager | The dialogs show valid idle forms only; `CA-03`, `CA-05`–`CA-07`, `CA-12` require blocked and retryable states. | Recommended supplemental; defer to implementation screenshots in `MV-01`. |
| Remove-link and remove-type confirmation dialogs | 596 × 353, Manager | No destructive reference is supplied. Design authority and existing Stock/Recipe confirmation primitives fully determine hierarchy and focus behavior. | Recommended supplemental; defer to implementation screenshots in `MV-01` and `MV-02`. |
| Types loading, empty, error/retry, in-use rejection and pagination | 1560 × 956, Manager | The supplied type page is populated and shows only the idle first page. | Recommended supplemental; defer to implementation screenshots and behavioral evidence in `MV-02`. |
| Both pages and all dialogs at narrow width | 320 × 900, Manager | No mobile artboard exists; responsive, scroll and keyboard obligations need real-render proof. | Recommended supplemental; defer to fresh Playwright CLI screenshots in `MV-03`. |
| Unauthorized, Operator and foreign-tenant resources | 1280 × 900 | Security states are not visual-design states and must reveal no protected detail. | Behavioral evidence required in `MV-04`; screenshots are optional. |

No additional screenshot is required before implementation. The missing states introduce no
unresolved product choice after the approved brand, price and narrow-navigation decisions;
their fresh implementation captures remain required evidence in `evaluation.md`.
