# Search-only unavailable products: design handoff

**Source:** the active Pencil document `design/onoreo.pen` (editor path
`/Ubuntu-22.04/home/petros/projects/scoops/design/onoreo.pen`). Frames were exported at scale 1
and inspected on 2026-10-18. The PNG files are the durable implementation references.

**What this handoff covers:** the visual realization of the [Spec](../spec.md). Product and
runtime behavior stay in the Spec.

## Implementation and validation inputs

Implementation and UI-validation agents **must not use Pencil MCP or the live canvas**. This
handoff and the two adjacent PNGs are their complete design inputs.

- Node IDs are provenance and comparison labels, not instructions to query Pencil.
- Use repository Design, Rules and existing component source for token mappings.
- Use Playwright CLI for browser interaction and fresh runtime screenshots, then compare those
  captures against the saved PNGs.

If a required measurement, state or reference is missing or contradictory, report a Design
Contract gap to the Orchestrator. Do not guess, and do not reopen Pencil.

## Frame inventory and visual analysis

### `VEtyb`: New Sale, search with unavailable products

- **Reference:** [VEtyb.png](./VEtyb.png). Frame "Tela Nova venda — Busca com produtos indisponíveis".
- **Surface and state:** `/sales/new`, catalog searched with `açaí` under the `Todos` filter.
- **Viewport:** 1632 × 1050. This is the frame size; the runtime desktop comparison uses 1481 × 1050.
- **Visible inventory:**
  - Catalog header "Produtos" with the count `3 produtos encontrados · 2 adicionados`.
  - The `Todos`/`Porções`/`Revendas` filters and a search field showing `açaí`.
  - Three cards in name order:
    - Açaí tradicional, added: "A partir de R$ 16,00" and an `Adicionado` pill.
    - Pote de açaí 1 L, out of stock: muted `R$ 28,00` and a `Sem estoque` pill with a `circle-off` icon.
    - Pote de açaí 500 ml, unpriced: `Preço não definido` and a `Sem preço` pill with a `circle-dollar-sign` icon.
  - The guidance row about the added badge, and the cart column.
- **States to cover:**
  - Default (no search) hides both unavailable cards.
  - Search reveals them.
  - Disabled cards cannot open configuration by mouse or keyboard.
  - The count says "encontrados" while searching.
- **Ambiguities and exclusions:**
  - No `Adicionar` button is drawn. The approved implementation keeps the existing button as the `aria-disabled` control (see allowed deviations).
  - The cart's register button shows only `+`, a pre-existing design artifact that is out of scope.
  - Category chip colors and icons are out of scope.
- **Validation target:** AC-01–AC-04, AC-07, AC-11, AC-12; MV-01; visual EV for desktop and narrow.

### `cUFG9`: Combo "Adicionar produto", search with unavailable products

- **Reference:** [cUFG9.png](./cUFG9.png). Frame "Modal Adicionar produto — Busca com produtos indisponíveis".
- **Surface and state:** the `/discounts/new` dialog, product list searched with `açaí`.
- **Viewport:** the frame is 900 wide with content-driven height. The export is 1050 × 689 because it includes the modal shadow.
- **Visible inventory:**
  - Header "Adicionar produto" and its description.
  - The search field showing `açaí` and the `Todos`/`Porções`/`Revendas` filters.
  - Three rows:
    - Açaí tradicional, selected, with a check icon.
    - Pote de açaí 1 L, muted content and a `Sem estoque` pill.
    - Pote de açaí 500 ml, muted content and a `Sem preço` pill.
  - The configuration pane for the selected portion.
- **States to cover:**
  - The default list hides unavailable rows.
  - Search reveals them as disabled rows that cannot be selected by mouse or keyboard.
- **Ambiguities and exclusions:**
  - The row subtitles ("Porção · 3 tamanhos disponíveis", "Revenda · Pote fechado · Frooty"), the check icon and the "Disponível para venda" label are not implemented (allowed deviations).
- **Validation target:** AC-05, AC-06, AC-07, AC-12; MV-02; visual EV for desktop and narrow.

Both PNGs were opened and visually inspected after export. Their dimensions match the frame
sizes above.

The older frames `jKmSB` (New Sale default) and `zBoAn` (Combo default) remain the references
for the default, unsearched states owned by the concluded features. They were inspected only to
identify what changed. The only change confirmed from `jKmSB` is the count copy: `elegíveis`
without search, `encontrados` with search.

## Additional coverage decisions

### New Sale and Combo dialog at narrow width

- **Viewport and actor:** 390 × 844. New Sale as Operator, Combo picker as Manager.
- **Gap:** no frame exists. Accepted responsive assumption:
  - New Sale keeps the existing grid: 1 column by default, 2 from `sm`, 3 from `xl`.
  - The card name wraps.
  - The price line and reason pill stay on one row, and the pill never shrinks.
  - Combo rows truncate the name while the pill stays fully visible.
- **Validation:** AC-12; MV-01/MV-02 with fresh runtime captures.

### Added product that is also unavailable

- **Viewport and fixture:** desktop, a cart line whose product became unavailable.
- **Gap:** not drawn. The unavailable pill wins over `Adicionado`, as the code does today.
- **Validation:** AC-04 automated (widget).

### Loading, empty and error states

- **Viewport:** both viewports.
- **Gap:** unchanged existing states. No new export.
- **Validation:** existing widget tests stay green.

## Measured design specifications

Values were read from the live Pencil nodes on 2026-10-18 and checked against the saved PNGs.
They are layout targets, not fixed DOM coordinates. No line-height is defined on these nodes, so
the existing font defaults apply.

### Token mapping

| Pencil token | Value | Repository mapping |
| --- | --- | --- |
| `$bg-muted` | `#F9FAFB` | `bg-muted` (`--color-muted` → `--muted` → `--bg-muted`) |
| `$bg-card` | `#FFFFFF` | `bg-card` |
| `$border` | `#E5E7EB` | `border-border` |
| `$border-soft` | `#F3F4F6` | Variable `--border-soft` exists, but `@theme` has no `--color-border-soft`, so the `border-border-soft` utility generates nothing today. 86 existing widgets use that class, so adding the theme mapping would change borders app-wide; that is **out of scope** for this delivery. Disabled cards keep the existing `Card` border (`border-border`). This is approved deviation 6. |
| `$danger` | `#991B1B` | `text-danger` |
| `$danger-soft` | `#FEE2E2` | `bg-danger-soft` |
| `$text-tertiary` | `#9CA3AF` | `text-text-tertiary` |
| `$text-secondary` | `#6B7280` | `text-muted-foreground` |
| `$font-body` | Manrope | `font-sans` (existing stack) |

### New Sale disabled card (`y4AAz` out of stock, `GKBoJ` without price)

| Element | Design value | Repository mapping | Responsive and state guidance |
| --- | --- | --- | --- |
| Card container | fill `$bg-muted`, stroke `$border-soft` 1 px, radius 14, padding 16, height 178, vertical, `space_between`, opacity 0.72 | Existing `Card`/`CardContent` (`rounded-2xl` = 16 px, `p-4`, `min-h-44`). Unavailable: `bg-muted opacity-70`, replacing today's `opacity-55`, with the existing card border. | Radius 14 vs 16 and the stroke shade (deviation 6) are approved primitive differences. The height stays content-driven. |
| Name | 15 / 800, `$text-primary` | Existing `h3 font-extrabold` | Unchanged. Wraps at narrow widths. |
| Price, out of stock (`Z0bgdH`) | 13 / 800, `$text-tertiary`, e.g. `R$ 28,00` | Existing price span plus `text-text-tertiary` when unavailable | Copy follows Spec FR-07: a plain price for single-stock Resale; "A partir de" for Portion and by-brand Resale. |
| Price, without price (`m2SaVs`) | 12 / 600, `$text-tertiary`, `Preço não definido` | Same span with `text-xs font-semibold text-text-tertiary` | Only for `missing_price`. |
| Reason pill (`LQang`, `Xo9Sj`) | fill `$danger-soft`, radius 8, padding 4×7, gap 5. Lucide icon 12×12 `$danger` (`circle-off` / `circle-dollar-sign`). Text 10 / 800 `$danger`. | The new shared PDV pill on the shadcn `Badge`: `bg-danger-soft text-danger rounded-md px-1.5 py-1 gap-1 text-[10px] font-extrabold h-auto`, icon `size-3`. | 7 → 6 px padding and 5 → 4 px gap are approved token roundings. `text-[10px]` follows existing precedent. `shrink-0`; never truncated. |
| `Adicionar` button | Not drawn | Kept. `aria-disabled="true"` when unavailable, `aria-describedby` pointing to the pill text. No native `disabled`. | Visible focus ring stays. Muted look comes from the card opacity. Click, Enter and Space do nothing. |
| Count (`F1MK4`) | 12 / 500, `$text-secondary`, `3 produtos encontrados · 2 adicionados` | Existing count paragraph | "encontrados" while the debounced trimmed search is non-empty; otherwise "elegíveis". |

### Combo disabled row (`meJWj` out of stock, `p1CRN` without price)

| Element | Design value | Repository mapping | Responsive and state guidance |
| --- | --- | --- | --- |
| Row container | fill `$bg-card`, stroke `$border` 1 px, radius 10, padding 10×12, gap 10, height 62, items centered | Existing row button (`min-h-14 rounded-xl border p-3 gap-3`). Unavailable: `aria-disabled="true"`, no hover fill, no `aria-pressed` selection. | Primitive radius and padding differences are approved. Focus stays visible. |
| Icon tile | 34×34, fill `$bg-muted`, radius 9, opacity 0.55; icon 16 px in the category color | Existing tile (`size-9 rounded-lg bg-muted`) plus `opacity-55` when unavailable | — |
| Text group | opacity 0.55. Name 12 / 800 `$text-primary`; detail 10 / 500 `$text-secondary` | Existing name and kind texts plus `opacity-55` | The name truncates. The kind line stays `Porção`/`Revenda` (subtitle deviation). |
| Reason pill (`WvwDP`, `IsbxC`) | Same as the New Sale pill | The same shared PDV pill | Replaces the trailing `arrow` icon on unavailable rows. `shrink-0`. |

## Allowed deviations

These are recorded so the Visual Reviewer does not treat them as failures. Each one is a
pre-existing difference or an approved exclusion, not a new product behavior.

1. New Sale cards keep the existing `Adicionar` button as the control. The frames draw the whole card as the target.
2. New Sale card subtitle copy and the existing `Adicionado`/`Disponível` badge sizing stay as implemented today.
3. Combo rows keep the `Porção`/`Revenda` kind line and the `arrow` icon on available rows. The design's detailed subtitles and selected check icon are not implemented.
4. The "Disponível para venda" label in the Combo selected-product header (`d5I4Tg`) is not implemented.
5. The category chip colors and icons, and the cart register button label, are out of scope.
6. Disabled New Sale cards keep the existing `border-border` stroke (`#E5E7EB`) instead of
   `$border-soft` (`#F3F4F6`). The repository's `border-border-soft` utility has no `@theme`
   mapping, and fixing that affects 86 widgets. It needs a separate design-system issue.

## Comparison checklist

| Check | Reference | Acceptance and evidence |
| --- | --- | --- |
| Search reveals the out-of-stock and unpriced cards in name order, with the correct pills, icons, price lines and muted card treatment | `VEtyb` | AC-02, AC-03, AC-04; MV-01 visual EV, desktop |
| The count reads `encontrados` with search and `elegíveis` without | `VEtyb` / `jKmSB` | AC-11; MV-01 |
| Disabled `Adicionar` keeps visible focus and announces its reason | `VEtyb` | AC-07; MV-01 keyboard path |
| Combo search reveals disabled rows with muted content and a reason pill; the selected available row is unchanged | `cUFG9` | AC-05, AC-06; MV-02 visual EV, desktop |
| At 390 × 844 the pills stay whole, the names wrap or truncate, and there is no horizontal overflow | assumption above | AC-12; MV-01/MV-02 narrow captures |
