# Product details pricing tab — design manifest

All files were exported from `design/onoreo.pen` at scale 1 through the shared WSL path,
verified as non-empty PNG images, opened for visual inspection, and checked with Pencil layout
problem traversal. Modal exports include transparent/canvas padding, so their PNG dimensions are
larger than the component bounds recorded below.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Composite Pricing screen | `design/onoreo.pen` / `X1avQ` | Populated design inventory for Portion and By-brand Resale | 1560×1178 | [X1avQ.png](./X1avQ.png) | `/products/$productId/prices`; `ProductSizesCard`, `ProductSizesTable`, By-brand `ProductResaleSettingsCard` | Sidebar, Header, Breadcrumb, Product Header, Tabs Pill, cards, table, inputs, switches; Scoops semantic tokens | Compare section hierarchy, table columns/rows, action placement, inherited packaging, disabled row, copy and desktop spacing under `CA-02`, `CA-09`, `MV-01`, `MV-02`. Never render Portion and Resale together because PRD categories are exclusive. |
| Add size | `design/onoreo.pen` / `yX4RY` | Add form, valid populated preview | Component 520×447; PNG 676×597 | [yX4RY.png](./yX4RY.png) | `ProductSizeDialog` add mode | Existing modal/input/prefix/suffix/metric/button tokens | Compare labels, two-column fields, optional metric preview, Cancel/Add actions and focus flow under `CA-03`, `CA-04`, `MV-01`. |
| Edit size | `design/onoreo.pen` / `hqaUm` | Prefilled edit with Active switch | Component 520×548; PNG 676×698 | [hqaUm.png](./hqaUm.png) | `ProductSizeDialog` edit mode | Add-modal visual basis plus reusable `oFz3s` status field | Compare prefilled fields, explicit Active switch, preview and Save action under `CA-05`, `CA-06`, `MV-01`. This corrected node supersedes issue node `jYr6B`. |
| Remove size | `design/onoreo.pen` / `uQYUR` | Destructive confirmation, final-active warning | Component 440×212; PNG 596×362 | [uQYUR.png](./uQYUR.png) | `RemoveProductSizeDialog` | Reusable destructive-dialog pattern from `FpJbN`, danger tokens and Lucide trash icon | Compare named warning, PDV-unavailable consequence, Cancel/Remove actions and focus return under `CA-07`, `MV-01`. |
| Single-stock Resale | `design/onoreo.pen` / `JwtuK` | Configured and available | Component 1200×251 export bounds | [JwtuK.png](./JwtuK.png) | Single mode of `ProductResaleSettingsCard` | Card, currency input, availability switch, info note | Compare absence of package input, one-stock-unit copy, price/availability controls and desktop spacing under `CA-08`, `MV-02`. |

## Visual inventory and exclusions

| Reference | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- |
| `X1avQ.png` | Shared shell, breadcrumb/header/tabs, size card/title/count/add action/table, By-brand card/brand packaging/price/switch rows/info note | Edit/remove entry points; available/unavailable brand rows | Composite showcases both mutually exclusive modes; shared missing header Edit/Remove actions are outside this Spec | `CA-02`, `CA-09`, `MV-01`, `MV-02` |
| `yX4RY.png` | Modal title/subtitle/close, Name, Quantity + unit, Price + BRL, optional three-metric block, footer | Add, Cancel, close; invalid/pending variants keep geometry | Metrics show representative available values, not a guarantee that cost exists | `CA-03`, `CA-04`, `MV-01` |
| `hqaUm.png` | Same form plus labeled Active switch and Save action | Edit, status, Cancel, close, pending/error retention | Final-active rejection is a behavioral error state, not encoded as a different frame | `CA-05`, `CA-06`, `MV-01` |
| `uQYUR.png` | Danger icon, named size, consequence copy, close, Cancel, destructive Remove | Cancel/confirm/pending/failure and focus return | Confirmation allows final-active removal; it is not the deactivation-conflict dialog | `CA-07`, `MV-01` |
| `JwtuK.png` | Resale title/copy, currency input, availability field and one-unit note | Save/disable/validation/error through same card | No packaging input; By-brand mode is represented by `X1avQ` | `CA-08`, `MV-02` |

## Supplemental coverage decision

| Proposed state | Viewport | Why references are insufficient | Criteria | Decision |
| --- | --- | --- | --- | --- |
| Portion loading/read error/empty | 1560×1178 and 390×844 | Pencil contains only populated state | `CA-02`, `CA-10`, `CA-11` | Recommended supplemental; defer to transient Playwright artifacts because repository loading/error/empty primitives and Design rules establish the treatment. |
| Validation, pending and mutation error in size dialog | 390×844 | Saved modal is valid idle state | `CA-04`, `CA-10`, `CA-11` | Recommended supplemental; mandatory runtime screenshots in `MV-01`. |
| By-brand no-brands and failed row save | 1560×1178 and 390×844 | Composite has configured brands only | `CA-09`, `CA-10`, `CA-11` | Recommended supplemental; mandatory runtime screenshots in `MV-02`. |
| Single-stock unavailable/validation state | 390×844 | Saved frame is configured/available desktop | `CA-08`, `CA-10`, `CA-11` | Recommended supplemental; mandatory runtime screenshots in `MV-02`. |

No additional Pencil screenshot is required before implementation. Responsive and transient-state
behavior is explicitly contracted by the Spec and must receive fresh Playwright CLI evidence.
