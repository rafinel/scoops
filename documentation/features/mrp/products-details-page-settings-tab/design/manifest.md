# Product details Settings tab — design manifest

All files were exported from `design/onoreo.pen` at scale 1 through the Pencil MCP,
verified as non-empty PNG images, opened locally for visual inspection, and checked with
Pencil layout-problem traversal. Dialog exports include transparent canvas and shadow padding,
so their PNG dimensions are larger than the component bounds recorded below.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Settings screen | `design/onoreo.pen` / `Fa5wO` | Populated desktop settings inventory | 1560×1450 | [Fa5wO.png](./Fa5wO.png) | `/products/$productId/settings`; `ProductSettingsSlot` | Shared Sidebar, Header, Breadcrumb, Product Header, Tabs Pill, form cards, switches, category cards, danger card; Scoops semantic tokens | Compare hierarchy, fields, actions, category selection, danger treatment and desktop spacing under `CA-01`, `CA-02`, `CA-04`, `CA-14`, `MV-01`. Add the approved read-only Stock Control section and Portion category; never show Portion and Resale selected together. |
| Ingredient dependency | `design/onoreo.pen` / `qIePb` | Category removal blocked by consuming recipes | Component 520×336; PNG 684×489 | [qIePb.png](./qIePb.png) | `CategoryDependencyDialog` for Ingredient | Existing modal, warning list, neutral and primary buttons | Compare recipe list, direct `View recipes` action, cancel/close behavior and focus return under `CA-05`, `CA-06`, `MV-02`. |
| Manufacturable dependency | `design/onoreo.pen` / `sATbF` | Category removal blocked | Component 520×372; PNG 670×522 | [sATbF.png](./sATbF.png) | `CategoryDependencyDialog` for Manufacturable | Shared dependency-dialog structure | Use its visual hierarchy, but list only the owned recipe and expose only the Recipe action under the approved capability-specific contract (`CA-06`, `MV-02`). |
| Accompaniment dependency | `design/onoreo.pen` / `C0bvNK` | Category removal blocked by Portion products | Component 520×336; PNG 684×489 | [C0bvNK.png](./C0bvNK.png) | `CategoryDependencyDialog` for Accompaniment | Shared dependency-dialog structure | Compare product list and filtered Products action under `CA-06`, `MV-02`. |
| Resale dependency | `design/onoreo.pen` / `YsyKL` | Category removal blocked by resale configurations | Component 520×329; PNG 684×489 | [YsyKL.png](./YsyKL.png) | `CategoryDependencyDialog` for Resale | Shared dependency-dialog structure | Compare configuration summary and Prices action under `CA-06`, `MV-02`. |
| Portion dependency | `design/onoreo.pen` / `uT6Rn` | Category removal blocked by sizes and accompaniment links | Component 520×353; PNG 684×507 | [uT6Rn.png](./uT6Rn.png) | `CategoryDependencyDialog` for Portion | Shared dependency-dialog structure | Compare grouped dependency summary and separate Prices/Accompaniments actions under `CA-06`, `MV-02`. |
| New product modal | `design/onoreo.pen` / `XzPz2` | By-brand product registration with per-brand unit | Component reference | — | Product registration dialog and `BrandEditor` | Each brand starts with the product unit and can select its own unit before registration. |
| Unit change warning | `design/onoreo.pen` / `x4MQHd` | Initial compatible/incompatible impact warning | Component 440×230; PNG 596×389 | [x4MQHd.png](./x4MQHd.png) | `UnitChangeDialog` | Existing warning modal, unit labels, cancel/block actions | Compare consequence copy and cancel/block flow under `CA-07`, `CA-08`, `MV-01`; compatible changes preview canonical conversion and incompatible changes do not request factors. |
| Product removal | `design/onoreo.pen` / `O11tq` | Destructive confirmation with dependency summary | Component 560×385; PNG 710×535 | [O11tq.png](./O11tq.png) | `RemoveProductDialog` | Destructive modal, grouped impact list, danger button | Compare named product, consolidated removable configuration, retained-history note, cancel/remove actions and focus return under `CA-09`, `CA-10`, `CA-11`, `MV-03`. |

## Visual inventory and accepted deviations

| Reference | Required visible inventory | Interaction/state coverage | Accepted ambiguity or deviation | Validation target |
| --- | --- | --- | --- | --- |
| `Fa5wO.png` | Shared shell, breadcrumb/header/tabs, Basic Information, Categories, Internal Notes and Danger Zone | Blur-save text fields; immediate select/switch saves; pending, error and retry; remove entry point | Add Stock Control with immutable mode and editable negative-stock policy. Add Portion. The frame's simultaneous Portion/Resale chips are component inventory, not a valid product fixture. Current unit cost and header Edit/Remove actions are excluded. | `CA-01`–`CA-04`, `CA-14`, `CA-15`, `MV-01`, `MV-02` |
| `qIePb.png` | Warning, consuming-recipe list, direct action, close/cancel | Block, navigate, preserve retry intent | Recipe consumption is the only Ingredient blocker. | `CA-05`, `CA-06`, `MV-02` |
| `sATbF.png` | Warning, owned-recipe dependency, direct action | Block, navigate, preserve retry intent | Prices and accompaniments shown in Pencil are excluded because they remain valid without Manufacturable. | `CA-06`, `MV-02` |
| `C0bvNK.png` | Warning, Portion products using the accompaniment, filtered Products action | Block, navigate, preserve retry intent | The dependency is the inverse accompaniment link, not all products. | `CA-06`, `MV-02` |
| `YsyKL.png` | Warning, current resale configuration, Prices action | Block, navigate, preserve retry intent | Resale configuration is the only Resale blocker. | `CA-06`, `MV-02` |
| `uT6Rn.png` | Warning, sizes/size prices and accompaniment links, two direct actions | Block, navigate, preserve retry intent | Owned recipe is not a Portion blocker. | `CA-06`, `MV-02` |
| `XzPz2` | Product identity, stock unit, by-brand editor, brand name/unit/package/value/stock fields | Choose an independent brand unit before product creation | Brand unit defaults to the product unit and is persisted with the brand. | Registration behavior and brand-unit persistence |
| `x4MQHd.png` | Current/target unit, affected-scope copy, cancel/block | Compatible preview; incompatible block; no mutation on cancel | Product unit affects product-owned records; existing brands keep their configured units. | `CA-07`, `CA-08`, `MV-01` |
| `O11tq.png` | Named product, removable configuration groups, retained-history note, destructive controls | Impact load, cancel, pending, atomic success/failure | Removal exists only in Settings Danger Zone. Historical transactions, productions and orders remain unchanged. | `CA-09`–`CA-11`, `MV-03` |

## Supplemental coverage decision

| Proposed state | Viewport | Why references are insufficient | Criteria | Decision |
| --- | --- | --- | --- | --- |
| Settings loading, save-pending and recoverable save error | 1560×1450 and 390×844 | Pencil contains only a populated idle desktop frame | `CA-02`, `CA-03`, `CA-14`, `CA-15` | Recommended supplemental; mandatory fresh Playwright CLI screenshots in `MV-01` and `MV-02`. |
| Incompatible unit block | 390×844 | Pencil contains only the populated warning state | `CA-08`, `CA-11`, `CA-15` | Recommended supplemental; mandatory runtime screenshot in `MV-01`. |
| Product-removal failure | 390×844 | Removal frame contains only confirmation | `CA-11`, `CA-15` | Recommended supplemental; mandatory runtime screenshot in `MV-03`. |
| Narrow settings layout and keyboard focus sequence | 390×844 | No mobile Pencil frame exists | `CA-15` | Derive from repository responsive/accessibility rules; mandatory runtime screenshot and keyboard evidence in `MV-02`. |

No additional Pencil frame is required before implementation. The approved deviations above are
part of the implementation contract, and transient states must receive fresh Playwright CLI
evidence rather than being stored under `documentation/features/**/evidence/`.
