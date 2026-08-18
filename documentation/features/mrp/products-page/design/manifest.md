---
feature: mrp/products-page
spec: ../spec.md
status: open
revision: 12
source:
  type: pencil
  ref: design/onoreo.pen
captured_at: 2026-08-17
---

# MRP products-page design manifest

The source file is the repository Pencil document [`design/onoreo.pen`](../../../../../design/onoreo.pen). The saved PNGs are reviewable snapshots of the source nodes and are the stable visual references for implementation and later evaluation. Existing Scoops tokens in [`documentation/design.md`](../../../../../documentation/design.md) remain authoritative when a screenshot and the design system differ.

## Reference inventory

| State | Pencil node | Saved reference | Size | Visual inventory | Contract use |
| --- | --- | --- | --- | --- | --- |
| Products catalog | `AXNGh` | [`AXNGh.png`](./AXNGh.png) | 1481 × 1450 | White sidebar with active Produtos navigation; global search and manager identity header; `Estoque > Produtos` breadcrumb; title/subtitle; Products, Brands, and Low Stock metric cards; list card with New Product action; search, filter-count button, product table, category chips, unit/brand/stock columns, low-stock markers, source details links, and pagination. | Normative desktop catalog composition and hierarchy; source details links are omitted because no detail page is implemented. |
| Product filters | `DsR63` | [`DsR63.png`](./DsR63.png) | 677 × 601 | Filter dialog with title/subtitle; applied-group count and clear action; category group with Ingredient, Manufacturable, Portion, Accompaniment, and Resale; Normal/Low stock group; Active/Inactive status group; selected states; Cancel/Apply actions; close control. | Normative filter grouping and dialog interaction model. |
| New product — by brand | `XzPz2` | [`XzPz2.png`](./XzPz2.png) | 727 × 1240 | Registration dialog with title/subtitle; name, unit, category controls; stock-control selection with By brand selected; immutable-control helper; negative-stock toggle; Cancel/Create actions; source also shows an inline brand/package editor. | Normative registration shell and By-brand variant. Negative-stock permission is included; inline brand management remains outside this feature. |
| New product — single stock | `LPdBK` | [`LPdBK.png`](./LPdBK.png) | 708 × 826 | Registration dialog with title/subtitle; name, unit, category controls; Single stock selected; immutable-control helper; source shows optional initial-stock input; Cancel/Create actions. | Normative registration shell and Single variant. Initial stock is fixed to zero by Issue #8 and is excluded from the implementation contract. |

## Visual verification record

- The five references were exported from Pencil and inspected at their original dimensions on 2026-08-17.
- The source frames showed no visible clipping or overlap in the inspected states. No separate formal layout-diagnostic artifact is available from the Pencil session; implementation validation must therefore include DOM geometry, overflow, focus, and screenshot checks.
- The source document provides desktop/artboard references only. The implementation must add a 320px keyboard/responsive validation state with no page-level horizontal scroll, no clipped primary action, and an accessible alternative for dense table content.
- All UI values must map to existing Scoops tokens: Manrope typography, semantic surface/text/border/status colors, documented spacing/radii/shadows, and Lucide icons. Do not sample screenshot pixels into new ad hoc values.

## Intentional deviations

| Source element | Decision | Reason |
| --- | --- | --- |
| `Permitir estoque negativo` in `XzPz2` | Include as a disabled-by-default product option | Managers may enable it to allow write-offs to project that product's balance below zero. |
| Inline `Marcas do produto` editor in `XzPz2` | Omit | Brand management is explicitly outside Issue #8. By-brand selection remains supported, with zero brands after registration. |
| `Estoque inicial` in `LPdBK` | Omit and initialize zero server-side | Issue #8 acceptance requires new products to start with zero stock; initial stock mutation is out of scope. |
| Ideal-stock field absent from `XzPz2` and `LPdBK` | Add required field to both registration variants | User confirmed ideal stock is required during registration; initial stock remains fixed at zero. |
