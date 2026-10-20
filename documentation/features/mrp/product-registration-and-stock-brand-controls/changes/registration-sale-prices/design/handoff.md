# Registration sale prices design handoff

Source design: `design/onoreo.pen`. Every node below was inspected through Pencil MCP on
2026-10-19, checked for layout problems, exported at scale 1, copied into this directory and
verified as a valid, non-empty PNG with the declared dimensions. Node IDs are provenance only.
Implementation and validation agents use these saved files and this handoff, never the live
canvas. Reopen Pencil only when the Design Contract changes.

Design changes made for this delivery (approved in the Spec clarification, Q6, Q7, Q8, Q10):

- the unapproved Estoque-section "Preço de venda" field is absent from `k4tYU`/`r1j4ip`;
- the "Usar preço de revenda" suggestion text (`hGjh1`) was deleted from `IYhx0`;
- the partially clipped `Custo unitário` field was hidden in `o5ZnH`, `SvYqt` and `IYhx0`
  because none of those products is an Ingredient;
- the hint `Opcional. Sem preço, o produto fica indisponível no PDV.` was added under every
  price field;
- the `Estoque` card and `Ações` row in `o5ZnH`, `SvYqt` and `IYhx0` were re-spaced so the
  cards use the same 11px gap and the actions no longer overlap the `Estoque` card;
- the narrow frame `n1BjGx` was created from `g9l12m` with the price fields stacked.

## Reference inventory

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fields hidden (Ingredient) | `design/onoreo.pen` / `k4tYU` | Manager; Ingredient selected; Single stock; no price field; `Custo unitário` visible | 1440 × 900 | [k4tYU.png](./k4tYU.png) | `/products/new`; `ProductRegistrationForm` Catálogo card | Existing shell, inputs, category cards, stock card | AC-01; MV-01 step 2 |
| Resale only | `design/onoreo.pen` / `o5ZnH` | Manager; Revenda selected (Porção disabled); Single stock; empty `Preço de revenda` with hint | 1440 × 900 | [o5ZnH.png](./o5ZnH.png) | Catálogo price row, left column | `R$` affixed input, hint text, category Resale tokens | AC-01, AC-12; MV-01 step 3 |
| Accompaniment only | `design/onoreo.pen` / `SvYqt` | Manager; Acompanhamento selected (Porção disabled); Single stock; empty `Preço como acompanhamento` with hint | 1440 × 900 | [SvYqt.png](./SvYqt.png) | Catálogo price row, left column | `R$` affixed input, hint text, category Accompaniment tokens | AC-01, AC-12; MV-01 step 4 |
| Both categories | `design/onoreo.pen` / `IYhx0` | Manager; Revenda + Acompanhamento selected; Single stock; Resale `R$ 12,00`, Accompaniment empty; no suggestion | 1440 × 900 | [IYhx0.png](./IYhx0.png) | Catálogo price row, two columns | Same as above | AC-01, AC-07, AC-12; MV-01 step 5 |
| Both categories, narrow | `design/onoreo.pen` / `n1BjGx` | Same state as `IYhx0` at mobile width; fields stacked full width | 390 × 844 | [n1BjGx.png](./n1BjGx.png) | `/products/new` responsive layout | Compact header; stacked price fields | AC-01, AC-12; MV-01 narrow steps |


Inherited references for adjacent hidden states stay in the parent bundle and are not copied:
By-brand desktop `lZGJu` and narrow `g9l12m`/`z41Sbx` in
[`../../../design/manifest.md`](../../../design/manifest.md). They show the registration page
without price fields and remain valid for the By-brand hidden state.

## Visual inventory

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| `k4tYU.png` | `/products/new`, Ingredient, Single stock | 1440 × 900 | Sidebar and header; `Voltar`, `Novo produto`, description; Catálogo card with Nome/Unidade row and category cards directly below; Estoque card with mode selector, negative switch, initial/ideal stock and `Custo unitário` | No price row for a non-Resale/non-Accompaniment product | `Custo unitário` belongs to Ingredient only and is unchanged by this delivery | AC-01 hidden case; MV-01 |
| `o5ZnH.png` | `/products/new`, Resale, Single stock | 1440 × 900 | Catálogo card: Nome/Unidade row; category cards with Revenda selected and Porção disabled (45% opacity); then the price row with `Preço de revenda` in the left column and an empty right column; placeholder `R$ 0,00`; hint; Estoque card without `Custo unitário`; Cancelar/Criar produto | Empty optional field | Right column stays empty, not stretched; no availability control at registration | AC-01, AC-12; MV-01 |
| `SvYqt.png` | `/products/new`, Accompaniment, Single stock | 1440 × 900 | As above, with `Preço como acompanhamento` in the left column and Acompanhamento selected; Porção disabled | Empty optional field | Porção disabled reflects the PRQ-01 Portion + Accompaniment rejection, which the current Web picker does not enforce; that picker behavior is outside this Spec. Compare only the price row, hint and layout | AC-01, AC-12; MV-01 |
| `IYhx0.png` | `/products/new`, Resale + Accompaniment, Single stock | 1440 × 900 | Price row with `Preço de revenda` (value `R$ 12,00`, primary text) left and `Preço como acompanhamento` (placeholder) right, each with its hint; no suggestion control | Independent entry: the typed Resale price is not reflected in the Accompaniment field | No `Usar preço de revenda` control (removed by decision Q10) | AC-01, AC-07, AC-12; MV-01 |
| `n1BjGx.png` | `/products/new`, Resale + Accompaniment, Single stock | 390 × 844 | Compact header; title block; Catálogo card: Nome/Unidade two columns, then `Preço de revenda` and `Preço como acompanhamento` stacked full width with hints, then categories; Estoque card; actions | Narrow stacking, readable labels and hints | Content may continue below the 844px viewport through normal document scroll; no horizontal overflow | AC-12; MV-01 narrow |


## Measured specifications

Values are read from Pencil node properties. `$font-body` resolves to Manrope. Pencil has no
explicit line-height for these texts, so none is claimed.

| Element/source | Design value | Repository mapping | Responsive/state guidance |
| --- | --- | --- | --- |
| Price row container (`SUDPj`, `wK4Fo`, `C2D2j`) | Horizontal, width fill, gap 8; each field `fill_container` (≈521px of 1049px) | The page's established responsive grid: `grid gap-3 sm:grid-cols-2` (used by the category fieldset); column gap matches the Nome/Unidade grid (`gap-3`) | One visible field keeps its column width and leaves the other column empty (`o5ZnH`, `SvYqt`). Below `sm` (640px) the grid is one column (`n1BjGx`) |
| Narrow price stack (`a6UIR`) | Vertical, width fill (330px inside a 14px-padded card), gap 12 | Same grid collapsed to one column below `sm`; `gap-3` | Nome/Unidade keep their existing two-column grid; no horizontal overflow at 390px |
| Section order inside Catálogo (`dL55Z`, `fuWIl`) | Header → Nome/Unidade → Categorias → price row; vertical gap 12, padding 14 | Existing `CardContent className='grid gap-4 p-3.5'` order, with the price row appended after the Categorias fieldset | Price row is absent from the DOM when no price field is visible |
| Field label (`f8Cio`, `O6bLZf`, `YnSPs`, `zdbwc`) | `Preço de revenda` / `Preço como acompanhamento`; 11px, weight 700, `$text-secondary`; gap 5 to control | Same classes as the existing Nome label: `Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'` | Implementation keeps the repository label scale (`text-xs`/600) already approved for Nome/Unidade; the 11/700 Pencil value is a known design-tool rounding, not a new token |
| Price control (reusable component `Input com prefixo`, `e9J7oO`, styled after `U4aae`; instances replace `C1CNhH`, `ysFh3`, `I6mC7`, `XmnbA` and every size `Preço` control) | Horizontal, width fill, radius 8, 1px `$border`, fill `$bg-card`; prefix segment `R$` (13/800 `$text-secondary`, fill `$bg-muted`, padding 10 × 12, radius only on the outer corners, right separator 1px `$border`) and value (13/700, padding 10 × 12; placeholder `0,00` in `$text-tertiary`, filled value in `$text-primary`); invalid state: outer 1px `$danger` | Reuse the affixed-input pattern of `CurrentUnitCostField`: wrapper `flex min-w-0 overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20`; `R$` prefix span `grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground`; `Input` with `border-0 shadow-none focus-visible:ring-0` and `data-focus-ring='delegated'` | The design draws `R$` as a prefix segment and `0,00` as the value, matching the repository (approved Q8). One continuous wrapper focus ring; invalid state adds `aria-invalid` and the ring-based destructive treatment already used by `Input` |
| Value text (`L2c4n`, `gkYxD`, `aTLGv`) | 12px, weight 500; placeholder `$text-tertiary`, filled value `$text-primary` | Shared `Input` text and `placeholder:text-muted-foreground` behavior | Use `inputMode='decimal'`; accept `,` or `.` as the decimal separator |
| Hint (`o9EGNp`, `hlEQ5`, `p5Gyu6`, `GVZQL`, `qhu9Q`, `R3zuqd`) | `Opcional. Sem preço, o produto fica indisponível no PDV.`; 10px, weight 500, `$text-secondary`; wraps within the field width | Same treatment as the `Custo unitário` hint: a `font-normal` span inside the muted `text-xs` label grid (`STOCK_FIELD_HINT_CLASS` in `product-stock-control-card/index.tsx`); a module-level constant may be shared or duplicated per Rules | Wraps on narrow screens; linked to the input with `aria-describedby` together with any error id |
| Field error | No Pencil frame (runtime state) | Reuse the existing field error pattern: destructive `text-sm` message with a stable id, `aria-invalid` and `aria-describedby` on the input | Error appears below the hint without moving other fields horizontally; capture at runtime |
| Category cards (`asVeM`, `c1B1wS`, `YHPeC`) | Selected Resale `$category-resale*`, Accompaniment `$category-accompaniment*`; disabled Portion opacity 0.45 | Existing `CATEGORY_STYLES` in `product-registration-form/index.tsx` | Unchanged by this delivery |
| Estoque card without cost | `Custo unitário` absent for non-Ingredient products | Existing `matchesStockControlCategory(..., 'ingredient', ...)` visibility | Unchanged by this delivery |
| Actions row | 12px below the Estoque card | Existing page footer actions | The original desktop frames overlapped the card by 4px; do not reproduce that overlap |

## Supplemental-state decision

No further Pencil frame is required before implementation (decision Q7). These behavior-driven
states reuse established patterns and must be captured as fresh Playwright CLI screenshots
during MV-01 and recorded in Evaluation:

| State | Route/fixture | Viewport | Reason | Criteria | Classification |
| --- | --- | --- | --- | --- | --- |
| Price field error (negative or three decimals) | `/products/new`, Manager, Resale + Accompaniment | 1440 × 900 and 390 × 844 | Error layout under the hint is runtime-only | AC-03, AC-12 | Recommended; deferred to runtime capture |
| Hidden-then-restored price | `/products/new`, toggle Resale off and on | 1440 × 900 | Proves retention visually | AC-02 | Recommended; deferred to runtime capture |
| By-brand with Resale selected | `/products/new`, By brand | 1440 × 900 | Hidden state; layout already covered by `lZGJu` | AC-01 | Recommended; deferred to runtime capture |
| Server rejection alert | Mocked 400 in the route suite only | 1440 × 900 | Reuses the existing page-level alert | AC-08 | Covered by existing pattern; no capture required |

## Comparison checklist

For each runtime capture, compare against the mapped reference:

1. Price row sits after the Categorias section, at the end of the Catálogo card, never in the Estoque card.
2. Labels, `R$` prefix, `0,00` placeholder and hint copy match exactly.
3. One price field occupies one column on desktop; both fields share the row; narrow stacks.
4. No suggestion control or copied value appears in the Accompaniment field.
5. `Custo unitário` appears only for a Single-stock Ingredient.
6. One visible focus ring on the affixed wrapper; no doubled outline.
7. No clipping, overlap or horizontal scroll at 390 × 844.

## Revision 4 additions

Revision 4 adds the Portion `Tamanhos e preços` section. The frames were built in
`design/onoreo.pen` on 2026-10-20 by copying the existing registration frames, inspected through
Pencil MCP, checked for layout problems and exported at scale 1 into this directory (valid PNGs
with the declared dimensions). Node IDs are provenance only. The frames are full-height frames:
validate at the stated viewport with vertical scroll, as for `lZGJu`.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Portion, one empty row | `design/onoreo.pen` / `z4KT5` | Manager; Porção selected (Revenda disabled); Single stock; `Tamanhos e preços` with one empty row | 1440 × 960 frame (900 viewport + scroll) | [z4KT5.png](./z4KT5.png) | `/products/new`; sizes section widget between Catálogo and Estoque | Section card, affixed fields, `Adicionar tamanho` | AC-13, AC-21; MV-02 step 1 |
| Portion, filled rows with row error | `design/onoreo.pen` / `U8PLRt` | Two valid rows, a third row with quantity `0` and an empty price showing both errors | 1440 × 1160 frame | [U8PLRt.png](./U8PLRt.png) | Same | Same + destructive field state | AC-14, AC-21; MV-02 steps 2–3 |
| Portion, narrow | `design/onoreo.pen` / `SJ0wZ` | One valid row and one row with both errors; fields stacked per row | 390 × 1444 frame | [SJ0wZ.png](./SJ0wZ.png) | Same, narrow | Same, stacked row cards | AC-21; MV-02 step 8 |

### Visual inventory (revision 4)

| Reference | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- |
| `z4KT5.png` | Sidebar, header, `Voltar`, `Novo produto`; Catálogo with Nome/Unidade and category cards (Porção selected, Revenda disabled, no price row); `Tamanhos e preços` card with title, hint `Opcional. Sem um tamanho ativo, a porção fica indisponível no PDV.`, one row (`Nome` placeholder `Ex: Pequeno`, `Quantidade` `0,00` with unit `g`, `Preço` `R$ 0,00`, trash button) and `Adicionar tamanho`; Estoque; actions | Empty optional row | The unit text follows the selected product unit (`g` here); the shell is the parent bundle's | AC-13, AC-21 |
| `U8PLRt.png` | As above with rows `Pequeno 0,300 / R$ 9,90`, `Médio 0,500 / R$ 14,50` and `Grande` with quantity `0` and empty price: destructive borders and messages `Informe uma quantidade maior que zero, com até três casas decimais.` and `Informe um preço válido, com até duas casas decimais.` | Row errors beside the fields; other rows unaffected | Labels repeat per row (each field has its own programmatic label) | AC-14, AC-21 |
| `SJ0wZ.png` | Compact header; Catálogo without price row; `Tamanhos e preços` card with two bordered row cards (`Tamanho 1`, `Tamanho 2`, trash buttons) each with Nome, Quantidade (unit) and Preço stacked full width; errors on row 2; `Adicionar tamanho`; Estoque; actions | Narrow stacking | The scrolled capture is a full frame; no horizontal overflow | AC-21 |

### Measured specifications (revision 4)

Values are read from the Pencil nodes.

| Element/source | Design value | Repository mapping | Responsive/state guidance |
| --- | --- | --- | --- |
| Section card (`YXxof` in `z4KT5`) | Vertical, gap 11, padding 14, radius 12, 1px `$border`, fill `$bg-card`; width = content width | Same classes as the Estoque card (`rounded-xl border p-3.5 grid gap-…`) | Placed between Catálogo and Estoque, same horizontal extent |
| Title / hint | `Tamanhos e preços` 13/800 `$text-primary`; hint 10/500 `$text-secondary`, gap 3 | Existing section-title and `font-normal text-xs` hint treatment | Hint wraps on narrow |
| Row (desktop) | Horizontal, gap 8, items aligned to the start; `Nome` fill, `Quantidade` 200, `Preço` 200, remove button 38 × 38 | `grid` columns `minmax(0,1fr) 200px 200px auto` from `sm`; one column below `sm` | Remove button aligned with the control row |
| Fields | Label 11/700 `$text-secondary`, gap 5; Nome control height 38, radius 9, 1px `$border`, padding 0 11, value 12/500 (`$text-primary`, placeholder `$text-tertiary`). Preço uses the reusable `Input com prefixo` (`e9J7oO`) and Quantidade the reusable `Input com sufixo` (`bwWHh`, styled after `YNmuK`): same style mirrored, with the unit segment (13/800 `$text-secondary`, fill `$bg-muted`, left separator, radius `[0,8,8,0]`) on the right and the value 13/700 on the left | Existing Nome field classes; the `R$` affixed input of the price row; for Quantidade the same wrapper pattern with a `border-l bg-muted px-3 text-sm font-bold text-muted-foreground` unit span after the `Input` | Error: control border `$danger` and message 10/600 `$danger` below; one focus ring on the affixed wrapper |
| Remove button | 38 × 38 (30 × 30 narrow), radius 9 (8), 1px `$border`, `trash-2` 14 `$text-secondary` | `Button` outline icon, accessible name `Remover tamanho <n>` | Always enabled (rows are optional) |
| Add button | Height 34, radius 9, 1px `$border`, padding 0 12, gap 6, `plus` 14 and `Adicionar tamanho` 11/700 `$primary` | `Button` outline | Below the last row |
| Narrow row card | Vertical, gap 10, padding 10, radius 9, 1px `$border-soft`; header `Tamanho n` 11/800 with trash button | One bordered group per row below `sm` | Fields stacked full width |

### Comparison checklist (revision 4)

1. The section sits between Catálogo and Estoque, only when Porção is selected; Catálogo has no price row for Portion.
2. Copy, hint, `R$` prefix, unit suffix and button labels match the references.
3. Desktop row shows Nome, Quantidade and Preço in one line with a remove button; narrow stacks them in a bordered row card.
4. Errors appear under the field with a destructive border and do not shift sibling columns.
5. One visible focus ring per affixed field; no horizontal overflow at 390 px.
