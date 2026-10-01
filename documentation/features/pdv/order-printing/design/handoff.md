# Order-printing design handoff

Source: active Pencil document `design/onoreo.pen` (editor path `/Ubuntu-22.04/home/petros/projects/scoops/design/onoreo.pen`). Exported and inspected on 2026-09-30 at scale 1. PNG files are the durable implementation references. Pencil MCP was used only to author and inspect the design before this handoff.

## Implementation and validation inputs

Implementation and UI-validation agents **must not use Pencil MCP or the live canvas**.
This handoff and the seven adjacent PNGs are their complete saved design inputs. Node IDs
below are provenance/comparison labels, not instructions to query Pencil. Use the Spec for
behavior, repository Design/Rules and existing component source for token mappings, and
Playwright CLI for real browser interaction and fresh runtime screenshots. Compare those
captures against the saved PNGs using image inspection; no design-tool connection is required.

If a required measure, state or reference is missing or contradictory, report a Design
Contract gap to the Orchestrator before implementing the ambiguous surface. Any design
authoring/reference refresh belongs to the Spec authoring workflow, outside the Builder's
implementation and validation work. Do not guess details or reopen Pencil to fill the gap.

## Frame inventory and visual analysis

| Node / reference | Route/surface/state | Viewport / dimensions | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| QuVaH / [QuVaH.png](./QuVaH.png) | `/sales/new`, saved registration success | 1481 × 1050 | Existing application shell; centered green success marker/title; order card with metadata, item rows and total; outlined Ver pedido and primary Iniciar nova venda; Manrope and existing tokens | Existing success actions plus approved secondary Imprimir pedido extension | Screenshot predates print action; add outlined printer Button alongside actions. Stray partially clipped status-switch node `fos8V/oFz3s` is excluded, not new behavior | AC-01, AC-08; MV-01; EV-01 success desktop/mobile |
| I2Kra / [I2Kra.png](./I2Kra.png) | `/orders/$orderId`, registered order | 1481 × 1050 | Shell/sidebar; back link and title; header action group with outlined printer button and cancellation; summary, items and total cards; green registered badge | Imprimir pedido for both roles; cancellation retains existing Manager-only policy | Header action layout adjusted in Pencil; screenshot shows Manager. Operator omits cancellation only. Screen fixture differs from print fixture | AC-02, AC-08; MV-02; EV-02 registered desktop/mobile |
| dPHci / [dPHci.png](./dPHci.png) | `/orders/$orderId`, canceled order | 1481 × 1050 | Same detail hierarchy; outlined printer action; canceled badge; cancellation record and reason; item/configuration cards and totals | Both roles can print canceled snapshot; no cancel action | Stock-return/loss details, if exposed by the screen, are excluded from paper | AC-02, AC-08; MV-02; EV-02 canceled desktop/mobile |
| lFo88 / [lFo88.png](./lFo88.png) | Printable registered order, 80 mm | 302 × 753; content-driven height | White flat paper, dark Manrope; left-aligned Pedido # and Cópia não fiscal; date/operator/channel/status label-value rows; count in footer; three separated product blocks with size/brand/accompaniments, quantity × unit price and subtotal; discounts, bold final total and footer | Noninteractive print document; saved registered snapshot | Paper is an illustrative fixture, not a fixed height, number-padding rule or source of financial truth; narrow metadata/items wrap | AC-03, AC-05; MV-03; EV-03 80mm registered |
| Y7CU6l / [Y7CU6l.png](./Y7CU6l.png) | Printable registered order, A4 | 794 × 1123; 210 × 297 mm paper | Flat paper with wider margins; left-aligned Pedido # and non-fiscal subtitle; full-width label-value metadata rows including status; aligned product/quantity/unit/subtotal table; savings and total block; non-fiscal footer | Same information as receipt, wider layout | No screen navigation, controls, decorative background or fiscal claims; long orders paginate | AC-03, AC-05; MV-03; EV-03 A4 registered |
| YtJxW / [YtJxW.png](./YtJxW.png) | Printable canceled order, 80 mm | 302 × 877; content-driven height | Receipt hierarchy above; Cancelado label; separated cancellation section with timestamp, responsible person and reason before footer | Saved cancellation facts; no return/loss outcomes | Omit optional reason when absent; no guessed stock result | AC-02, AC-05; MV-03; EV-03 80mm canceled |
| aWCXQ / [aWCXQ.png](./aWCXQ.png) | Printable canceled order, A4 | 794 × 1123 | Wide table and metadata hierarchy above; cancellation block below financial totals, with responsible person/date/reason; non-fiscal footer | Same canceled facts as narrow document | No printing-success badge; order remains canceled | AC-02, AC-05; MV-03; EV-03 A4 canceled |

All seven PNGs were opened and visually inspected. Detail and four paper frames passed refreshed Pencil layout diagnostics. The excluded success-frame node above is a pre-existing visual artifact. Paper frames use the existing `$bg-card`, `$text-primary`, `$border`, `$font-body` variables; monochromatic output uses their light-theme equivalents. Inspected thermal padding is 18 px horizontally/24 px vertically; A4 padding is 48 px on each side. Match relationships using documented tokens and physical print units, avoiding a new global token system.

## Additional coverage decisions

| Proposed reference/state | Viewport and actor/fixture | Gap and decision | Contract / validation |
| --- | --- | --- | --- |
| Confirmation with print action | 1481 × 1050, Manager or Operator | Approved visual extension to QuVaH using existing secondary Button/Icon; no extra pre-implementation export required | FR-01, AC-01, AC-08; MV-01 fresh runtime capture |
| Confirmation/details narrow action groups | 390 × 844, both roles/statuses | Accepted responsive assumption: stack actions without cutting labels; existing content adapts. Defer additional design screenshots; runtime captures required | AC-08; MV-01/MV-02 |
| Loading/error/refetch details | 1481 × 1050 and 390 × 844, existing order route | Preserve established states; no print content before order load; disabled while refreshing. Supplemental design export deferred because existing states are unchanged | AC-06; MV-02 |
| Long product/configuration/reason and many lines | Paper widths 302/794 px; registered/canceled saved fixtures | Recommended supplemental reference deferred; approved paper structure plus wrapping/pagination contract governs | AC-05; MV-03 fresh print-media captures |

Printing is monochromatic under both screen themes. Exact sample names, dates, sequence formatting and totals are fixture illustrations; repository snapshot/formatter contracts govern actual values. No screenshot introduces status editing, fiscal issuance or different role permissions. Runtime capture IDs are transient evidence in the future `evaluation.md`, not additional design exports.


## Measured design specifications

The tables below were read from the live Pencil nodes and checked against all seven saved PNGs on 2026-09-30. Measurements describe the reference at 1× export. They are layout targets, not fixed DOM coordinates or fixed content heights. The Spec owns behavior/data; this handoff owns visual implementation guidance. Preserve the saved order and reading order when text grows.

### Existing token mapping

| Design property | Inspected Pencil token/value | Existing Web mapping | Implementation guidance |
| --- | --- | --- | --- |
| Paper/card background | `$bg-card` = `#FFFFFF` | `bg-card`; `--card` → `--bg-card` | Paper stays white even when the application is dark; scope the print palette locally |
| Body/heading/price text | `$text-primary` = `#111827` | `text-foreground`; `--foreground` → `--text-primary` | Do not use Tailwind `text-primary`: that class is brand purple, not this Pencil text token |
| Dividers/button border | `$border` = `#E5E7EB` | `border-border`; `--border` | One-pixel neutral separators; no purple/color-coded status on paper |
| Text family | `$font-body` = Manrope | Existing `font-sans` / `--font-sans`; Manrope, Segoe UI, system-ui, sans-serif | Keep fallback stack; no new font request or embedded-font dependency |
| Application canvas | `$bg-page` = `#F7F7F8` | `bg-background` / `--background` | Screen only; never print sidebar/canvas color |
| Screen success/canceled indicators | Existing success/danger semantic tokens | Existing status widgets | Preserve screen treatment; printed status is readable text in the neutral paper palette |
| Screen radius | Pencil print action 10 px; Design range 8–10 px | Existing `rounded-md` is 8 px; Button currently defaults to `rounded-lg`, 12 px | Record source/primitive differences; reuse existing radius tokens instead of adding a parallel 10 px global token |
| Screen spacing | Existing Design scale 4, 6, 8, 12, 14, 16, 20, 24, 32 px | Existing Tailwind spacing utilities | No custom Scoops spacing variables exist; do not invent them for this feature |

Sources: [`documentation/design.md`](../../../../design.md), [`global.css`](../../../../../apps/web/src/ui/shared/styles/global.css), and [`Button`](../../../../../apps/web/src/ui/shadcn/button.tsx). Paper uses the light design values above, so it is neutral under either screen theme. Thermal drivers may rasterize shades to black; do not alter global text/border tokens or introduce a colored fiscal/status treatment.

### Typography and text alignment

All inspected paper text uses Manrope. Pencil has no explicit `lineHeight` override on these nodes; do not claim a measured line-height multiplier. Reference rendered heights below help comparison; use the font's metrics and inspect the final print preview. The existing Web body has line-height 1.5, which must not silently enlarge the entire paper layout without validation.

| Element | Size / weight | Alignment | Representative node | Text behavior |
| --- | --- | --- | --- | --- |
| Receipt order heading | 20 px / 800 | Left | `y1tYke` | Full content width; sample rendered height 27 px; wraps rather than clips |
| A4 order heading | 26 px / 800 | Left | `B5CFw5` | Full content width; sample rendered height 36 px |
| Cópia não fiscal, subtitle/footer | 12 px / 500 | Left | `Fm3NF`, `l6RYK`, `du1oS` | Normal readable caption, not a watermark |
| Itens do pedido section heading | 16 px / 700 | Left | `pR2Ir`, `J2RuU` | Sample rendered height 22 px |
| Product name | 13 px / 700 | Left | `IwUPR`, `IVGOF` | Separate line above configurations; sample height 18 px |
| Configuration/accompaniment text | 12 px / 500 | Left | `Q62Xv`, `zJ0a8` | Every present configuration remains readable; full-width wrapping |
| Metadata/subtotal/discount labels | 12 px / 500 | Left | `Sa9t8`, `bzDOV`, `lP6Hg` | Label is flexible; wraps before forcing numeric values off paper |
| Metadata and financial values | 12 px / 600 | Right edge of row | `bgcJP`, `he9uI`, `m7THo` | Sample text height 16 px; preserve currency format |
| A4 table headers | 12 px / 700 | Product left, numeric columns right | `KFHci`, `c63aIM`, `MNCny`, `D92VqW` | Ordinary sentence-case labels, not the application's uppercase table style |
| Final total, label and amount | 16 px / 700 | Label left / amount right | `l4bUj`, `lsu2W` | Strongest financial row; sample height 22 px; no colored badge |
| Cancellation title / body | 12 px / 700 title; 12 px / 500 facts | Left | `qF7YM`, `C6LUzT`, `Kxm64`, `u0j5K` | Date, actor and optional reason follow title in reading order |

### Paper geometry and spacing

| Region/property | 80 mm reference | A4 reference | Implementation constraint |
| --- | --- | --- | --- |
| Artboard | 302 px wide; 753 px registered / 877 px canceled | 794 × 1123 px | These correspond approximately to physical paper at 96 px/in; driver/dialog controls actual paper dimensions |
| Outer padding | Top/bottom 24 px, left/right 18 px | 48 px all sides | Approximately 6.35 mm vertical / 4.76 mm horizontal thermal and 12.7 mm A4; apply each inset once, not both page margin and document padding |
| Content width | 266 px | 698 px | Fill available printable width; shrink gracefully with driver non-printable margins |
| Main vertical gap | 18 px | 18 px | Between direct sections/dividers; use natural document flow |
| Header internal gap | 6 px | 6 px | Heading then non-fiscal subtitle; both left aligned |
| Metadata group | Vertical rows; 8 px row gap, 10 px label/value gap | Same full-width rows and gaps | Four rows: registered date, registered actor, channel, lifecycle status; no two-up metadata cards |
| Items group | 12 px gap | 12 px gap | Heading, optional wide-column header, separator and each line |
| Item description | 5 px vertical gap | 6 px vertical gap | Missing configuration removes its line; do not keep blank placeholders |
| Totals group | 8 px vertical gap; 10 px label/value gap | Same | Preserve discount names/savings before final total |
| Rules/dividers | 1 px, content width | 1 px, content width | Neutral border token; no shadows or rounded paper cards |
| Cancellation block | Full width, 1 px text-color outline; 12 px padding; 6 px gap | Same | Square corners; inserted between total and footer; absence removes whole block |
| Footer | 12 px top padding; 6 px internal gap | Same | Rule, product/unit count, Cópia não fiscal; remains in content flow, not pinned to page bottom |

Content origin is `(18, 24)` on the receipt and `(48, 48)` on A4. Registered receipt sections start at y = 24 heading, 110 metadata, 216 items, 551 totals, 672 footer. A4 registered sections start at y = 48 heading, 143 metadata, 249 items, 553 totals, 674 footer. These are reference comparison landmarks only; changing line count/name length changes subsequent positions.

Canceled receipt adds `SXPMh` at y = 672, height 106 px for the sample reason, moving footer to y = 796. Canceled A4 adds `WMjRQ` at y = 674, height 106 px, moving footer to y = 798. The cancellation box grows with reason text; it must not be held to 106 px.

### Item layouts and alignment

| Property | Receipt item blocks | A4 table |
| --- | --- | --- |
| Owning surface | OrderPrintDocument → OrderPrintLine | Same components; wider print layout |
| Product/configuration | Full width above prices | Flexible left column, 442 px in the 698 px sample |
| Quantity | `quantity × unit price` on final item row | Dedicated right-aligned column, 40 px sample |
| Unit price | Beside quantity at left of final row | Dedicated right-aligned column, 90 px sample |
| Subtotal | Right end of final item row | Dedicated right-aligned column, 90 px sample |
| Horizontal gaps | 10 px price label/subtotal gap | Three 12 px gaps; sample columns begin at x = 0, 454, 506, 608 relative to content |
| Row vertical alignment | Name/configuration then price row | Numeric values align to the first product-name line, not vertically centered across the description |
| Separators | Above each item, full width | Under headers and between items, full width |
| Sample item height | 81 px with accompaniment; 60 px without | 62 px with accompaniment; 40 px without |
| Long content | Wrap names/configuration and, if necessary, stack a metadata/price value below its label | Product column grows vertically while quantities/prices retain readable columns; no fixed row height |

The sample paid values and the caption `Subtotal com canal` illustrate the approved layout. Actual financial labels/values follow the saved snapshot semantics in the Spec; do not infer or recompute a channel-adjusted subtotal from the picture. Screen fixture dates/totals differ from paper fixture dates/totals deliberately.

### Screen action placement and component reuse

| Surface/element | Inspected design | Existing component mapping | Placement/responsive guidance |
| --- | --- | --- | --- |
| Registered detail print action | `wNSUn`, reusable Button Primary instance restyled as outline; 147 × 36 px sample; padding 9 × 14 px; gap 6 px; border 1 px; radius 10 px | Existing Button outline, Icon with planned printer mapping | Header right-side group before Cancelar pedido; both roles can print; omit cancellation for Operator |
| Canceled detail print action | `LR37S`, same visual dimensions | Same OrderPrint widget | Header right-side group after saved cancellation summary; no cancellation button |
| Printer icon | Lucide printer, 14 × 14 px, neutral foreground | Existing Icon wrapper after adding printer registry key | Decorative/aria-hidden; visible label supplies accessible name; icon precedes label |
| Action label | Imprimir pedido; Manrope 13 px / 700 | Shared Button with semantic foreground/font weight | Keep on one line; never replace with icon-only action on mobile |
| Detail action spacing | 12 px between action-group children; sample group height 36 px | Existing spacing utilities | Align group with header; wrap/stack before collision with title/metadata |
| Detail content context | 267 px sidebar; 72 px application header; content padding 28 px top, 32 px sides/bottom; 1150 px inner width on desktop | Existing application shell/details page | Reuse existing shell; do not recreate it to add one action; content remains outside printed document |
| Confirmation context | `fos8V/tOWLf`, 720 px centered success region; card `fos8V/N2IdLX` width 720 px, radius 16 px; existing actions 44 px high and 12 px apart | Existing OrderConfirmation card/actions | Approved print extension belongs beside existing Ver pedido/Iniciar nova venda; keep primary new-sale action visually strongest |
| Confirmation print extension | Not drawn in QuVaH; already approved secondary action | Same outlined OrderPrint, shared focus/disabled behavior | Existing action sequence remains; inserted secondary action shares action-row alignment and spacing; no duplicate toolbar |

Primitive defaults differ from Pencil measurements: current Button outline uses page-background color, default height 40 px, body size 14 px and radius 12 px. Its `lg` size is 36 px high. Use the existing Button and semantic `bg-card`/`text-foreground` plus documented font/spacing/radius values; do not assume the outline variant alone reproduces the reference. Radius/font values map to the existing design system rather than adding new global tokens. Preserve shared focus ring, disabled opacity and dark-theme behavior when applying feature styling. Do not change the shared Button primitive just for this action.

### Responsive and interaction states

| State/viewport | Required visual behavior | Validation |
| --- | --- | --- |
| Desktop 1481 × 1050 | Detail action group stays beside header content; success actions centered below card; no overlap with title/status/metadata | QuVaH/I2Kra/dPHci comparisons, EV-01/EV-02 |
| Narrow 390 × 844 | Header/actions stack in normal reading order; buttons fill available action width where needed; labels and icon remain visible; content can scroll vertically | Approved responsive assumption; fresh success/registered/canceled runtime captures |
| Print 80 mm | Item blocks and label/value rows, narrow wrapping; no sidebar/header/actions; no inherited 320 px minimum width | lFo88/YtJxW, EV-03 |
| Print A4 | Wide item table; metadata remains label/value rows; footer follows content leaving unused page space naturally | Y7CU6l/aWCXQ, EV-03 |
| Hover/pressed | Existing outline Button treatments; no new custom animation | Shared component semantics; runtime comparison |
| Focus | Keep shared visible focus treatment and keyboard reading order | Tab plus Enter/Space in EV-01/EV-02 |
| Disabled/not ready/refreshing | Existing disabled appearance (50% opacity); same label; no clickable shortcut or invisible substitute | AC-06/AC-07; readiness and refresh checks |
| Order loading/error/access denied | Existing screen states remain; no print document or active action before authorized saved data | AC-06; existing widget/browser checks |
| Native print invocation failure | Existing error feedback; returning action remains usable; no success styling or persistent printed badge | AC-07; native seam plus manual recovery |
| Print dialog closed/canceled | Screen/action styling restored, no page reflow residue, keyboard continuation supported | AC-04/AC-08; native dialog observation |
| Canceled reason missing | Keep saved cancellation title/date/actor, omit reason line and unused gap | Document optional-branch checks |

Paper-width adaptation is separate from the screen's responsive breakpoint: a phone can print A4 and a desktop can print 80 mm. Choose layout based on available printable area, not the screen viewport, and validate both with the actual native preview. Long orders paginate with repeated wide-table labels where supported; do not force the document to fit a single A4 page. Avoid breaking an ordinary item/cancellation block when it fits, while allowing oversized blocks to continue rather than clipping.

## Implementation comparison checklist

1. Reuse OrderPrint on all three screen states; preserve the existing shell/card hierarchy and action permissions.
2. Match left-aligned paper headings and label/value metadata rows; avoid centered headers or invented metadata cards.
3. Compare font family, size/weight hierarchy, neutral token mapping, margins, gaps, dividers and price-column alignment against the exact paper reference.
4. Confirm canceled output adds the square bordered saved-facts block and increases content height naturally.
5. Validate long/optional content, multi-page output, both screen themes and both paper formats; inspect that no line, price or reason is lost.
6. Capture fresh desktop/narrow and four paper-state screenshots through Playwright CLI; record differences, accepted token mappings and native-preview evidence under the Spec's existing EV/MV IDs.

No new screen, action, permission, paper size or product behavior is introduced by these measured details. Required references and deferred supplemental-state decisions remain those in the inventory above.
