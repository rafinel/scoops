# Global accompaniments design handoff

The saved PNGs are the implementation references. Node IDs are provenance only. Implementation,
Builders and the Visual Reviewer use this handoff and the images and must not reopen Pencil.
All references were exported from `design/onoreo.pen` at scale 1 on 2026-10-17 and visually
inspected. Dialog exports include transparent shadow bounds, so their PNGs are larger than the
measured node size.

Four Link/Edit state frames (`zN1rE`, `ymvAn`, `DT6Vc`, `y7dXvq`) were added during Spec
clarification (Q7/Q46). They are instances of the reusable `iSdux` component, which also gained a
hidden `Aviso substituição de vínculos` node (`yq4QV`). The types page `A5c2Q` lost its `USO`
column (Q43/Q47). No other existing frame changed.

| Reference | Pencil file/node | State | Measured node / PNG | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Portion Accompaniments table | `design/onoreo.pen` / `b1dyL` | Manager, 2 global + 3 individual rows | 1560 × 1097 / 1560 × 1097 | [b1dyL.png](./b1dyL.png) | `/products/$productId/accompaniments` card and table | Card, Table, Badge (`accent`), Button, Icon `globe` | AC-01, AC-10, AC-11, MV-01, MV-02 |
| Link, switch off | `iSdux` | Manager, individual link of a candidate | 520 × 814 / 670 × 964 | [iSdux.png](./iSdux.png) | Link dialog | Dialog, Select, Switch (off), price/quantity fields, cost preview | AC-02, MV-01 |
| Link, global on (new global) | `zN1rE` | Manager, candidate without individual links, switch on | 520 × 886 / 670 × 1036 | [zN1rE.png](./zN1rE.png) | Link dialog | Switch (on, `primary`), global notice (`accent`) | AC-02, MV-01 |
| Link, global on with replacement | `ymvAn` | Manager, candidate with individual links on other Portions, switch on | 520 × 976 / 670 × 1126 | [ymvAn.png](./ymvAn.png) | Link dialog | Global notice + replacement notice (`warning-soft`/`warning`) | AC-03, MV-01 |
| Edit, individual link | `DT6Vc` | Manager, individual row, switch off and enabled | 520 × 814 / 670 × 964 | [DT6Vc.png](./DT6Vc.png) | Edit dialog | Same dialog, Edit title and `Salvar alterações` | AC-04, MV-01 |
| Edit, global locked | `DyrWo` | Manager, global row, switch on and locked | 520 × 886 / 670 × 1036 | [DyrWo.png](./DyrWo.png) | Edit dialog | Locked switch row (60% opacity), global notice | AC-05, MV-01 |
| Link again, global locked | `y7dXvq` | Manager, global removed from this Portion | 520 × 886 / 670 × 1036 | [y7dXvq.png](./y7dXvq.png) | Link dialog | Locked switch row, global notice, Link title | AC-07, MV-01 |
| Remove global, this Portion | `q2gZuS` | Manager, scope switch off | 480 × 338 / 630 × 488 | [q2gZuS.png](./q2gZuS.png) | Global removal dialog | AlertDialog, Switch (off), muted consequence, outline destructive action | AC-06, MV-01 |
| Remove global, all Portions | `C8la0H` | Manager, scope switch on | 480 × 320 / 630 × 470 | [C8la0H.png](./C8la0H.png) | Global removal dialog | Switch (on, `danger`), danger-outlined field, `danger-soft` consequence, filled destructive action | AC-06, MV-01 |
| Accompaniment types page | `A5c2Q` | Manager, three types, no usage count | 1560 × 956 / 1560 × 956 | [A5c2Q.png](./A5c2Q.png) | `/accompaniment-types` table | Table, status Badge | AC-12, MV-01 |

## Visual inventory and interaction coverage

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| `b1dyL` | Portion Accompaniments tab, Manager | 1560 × 1097 frame (runtime 1560 × 1178) | Title `Acompanhamentos (5)`; description ending "Itens globais aparecem em todas as porções."; `Vincular Acompanhamento`; columns ACOMPANHAMENTO, TIPO, MARCA, QTD POR PORÇÃO, PREÇO DO PRODUTO, AÇÕES; Granola and Leite Condensado with a `Global` pill (globe icon) listed first, then Banana, Nutella, Paçoca by name; Editar/Remover per row | Edit opens the Link/Edit dialog for the row; Remove opens the global removal dialog for global rows and the existing dialog for individual rows | Product header chips are context only. No Portion count anywhere. Operator view hides AÇÕES and the Link button (existing pattern). | AC-01, AC-10, AC-11 |
| `iSdux` | Link dialog, individual | 520-wide dialog | Title, subtitle, close; Acompanhamento select; switch row `Disponível para todas as porções` + help "Aparece em todas as porções, incluindo as novas. Tipo, quantidade e preço são compartilhados."; Tipo with `Gerenciar tipos →`; Marca (read-only current main brand); price field and help; quantity with unit suffix; cost preview; Cancelar/Vincular | Switch off by default for a non-global candidate | Selector chrome on Marca is visual only; brand stays read-only (existing contract). | AC-02 |
| `zN1rE` | Link dialog, switch on | 520-wide dialog | Same as `iSdux` plus top notice (globe icon, "Acompanhamento global: as alterações valem para todas as porções.") and switch on | Turning the switch on reveals the global notice (polite status) | Sample product values are illustrative. | AC-02 |
| `ymvAn` | Link dialog, replacement | 520-wide dialog | `zN1rE` plus a warning notice under the switch row: "Este acompanhamento já está vinculado individualmente a outras porções. Ao salvar, esses vínculos serão substituídos pela configuração global." | Notice appears only while switch is on and the product has individual links on other Portions; Type/Quantity start empty in Link and show the Manager's entries | No Portion count. | AC-03 |
| `DT6Vc` | Edit dialog, individual row | 520-wide dialog | Edit title "Editar Acompanhamento", subtitle "Atualize como este item aparece no PDV.", switch off and enabled, `Salvar alterações` | Turning the switch on shows the global notice and, when `hasOtherPortionLinks`, the replacement notice from `ymvAn` | Product select is visually a select but the product stays locked in Edit (existing contract). | AC-04 |
| `DyrWo` | Edit dialog, global row | 520-wide dialog | Global notice; switch row at 60% opacity, switch on; help "Aparece em todas as porções, incluindo as novas. Para deixar de ser global, use Remover na tabela." | Switch is focusable but cannot change (`aria-disabled`); saving changes the global for every Portion | — | AC-05 |
| `y7dXvq` | Link dialog, link again | 520-wide dialog | `DyrWo` locked switch and help with Link title/subtitle and `Vincular` | Selecting a global candidate prefills shared Type/Quantity/price and locks the switch | — | AC-07 |
| `q2gZuS` | Global removal, switch off | 480-wide alert dialog | Trash tile (`danger-soft`), "Remover Granola?", "Granola é um acompanhamento global. Escolha onde ele deve ser removido.", close; scope switch row "Remover de todas as porções" + "Desligado: remove apenas de Polpa de Açaí."; info consequence "Granola continua nas outras porções e nas novas. Você pode vinculá-lo de novo a esta porção depois. Os saldos de estoque não mudam."; Cancelar, outlined `Remover desta porção` | Switch starts off on every open; consequence is a polite status | Names are interpolated from the accompaniment and the current Portion. | AC-06 |
| `C8la0H` | Global removal, switch on | 480-wide alert dialog | Switch on (`danger`), field border `danger`, help "Granola deixa de ser global."; warning consequence on `danger-soft` "Será removido de todas as porções, incluindo esta. Novas porções não o receberão. Os saldos de estoque não mudam."; filled `Remover de todas` | Toggle updates help, consequence and action label/style | — | AC-06 |
| `A5c2Q` | Accompaniment types page | 1560 × 956 frame | Columns NOME, STATUS, AÇÕES; `Em uso`/`Disponível` badges; no usage count text | Unchanged actions; removal disabled for in-use types | Pagination and info banner unchanged. | AC-12 |

## Measured component specifications

| Element/source | Design value | Repository mapping | Responsive/state guidance |
| --- | --- | --- | --- |
| Global badge `nCXMF` | Pill radius 999, padding 3 × 8, gap 4; `globe` 12px `$primary`; label Manrope (`$font-body`) 11/700 `$primary`; fill `$primary-soft`; sits right of the 14/700 name | shadcn `Badge` with `bg-accent text-accent-foreground`, shared `Icon name='globe'` (add to `IconName`) | Keep on the same line as the name; wrap after the name on narrow widths without overlapping the next cell. Text `Global` is the accessible name. |
| Table description `mwMOP` | 13/normal `$text-secondary` under the 18/700 title | Existing card description (`text-muted-foreground`) | Always rendered for Manager and Operator; wraps naturally. |
| Switch `k6Ihbx` / `ndhJF` | Track 44 × 24, radius 999, padding 3; thumb 18 × 18 `$bg-card`; off `$border`, on `$primary` (scope removal on: `$danger`) | New `ui/shadcn/switch.tsx` (base-ui Switch) with `border`/`primary` defaults and a destructive tone using `danger`; focus ring per shared Input focus style | Visible focus ring; reduced motion disables the thumb transition. |
| Switch row `EqC4B` / `JTscp` | Card fill, 1px `$border` (removal-all: `$danger`), radius 10, padding 12 × 14, gap 12; title 14/700 `$text-primary`; help 12/500 `$text-secondary`, gap 2 | Label wraps switch + text; help linked by `aria-describedby` | Locked state renders the row at 60% opacity (`opacity-60`) and keeps the switch focusable with `aria-disabled="true"`. |
| Global notice `X10CE` | Fill `$primary-soft`, radius 10, padding 10 × 14, gap 10; `globe` 16 `$primary`; text 13/500 `$text-primary`; first item of the dialog body | `bg-accent` notice with `Icon`; `role="status"` | Shown whenever the switch is on (including locked). |
| Replacement notice `yq4QV` | Fill `$warning-soft`, radius 10, padding 10 × 14, gap 10; `triangle-alert` 16 `$warning`; text 13/500 `$warning`; directly below the switch row | `bg-warning-soft text-warning` notice; `role="status"`; referenced by the switch `aria-describedby` while visible | Only when switch on, not locked, and the product has individual links on other Portions. |
| Link/Edit dialog body | 520 wide, body padding 20 × 24, field gap 16; footer actions unchanged | Existing dialog | On 390 × 844 the dialog uses the existing max-width/scroll behavior; notices wrap; actions stay reachable. |
| Global removal dialog `q2gZuS`/`C8la0H` | 480 wide, radius 16, shadow 0 20 50 #00000033; header padding 24 × 24 × 0, gap 14, title 18/800, subtitle 13 `$text-secondary`, close 32 × 32 radius 8; body padding 20 × 24 × 0, gap 12; consequence radius 10, padding 10 × 14, 13/500 (`$bg-muted` with `info` icon, or `$danger-soft` with `triangle-alert` `$danger`); footer padding 20 × 24 × 24, gap 12; Cancel outline radius 10, padding 10 × 20, 13/700 | Shared `AlertDialog` two-column header with `AlertDialogMedia` destructive tile; Cancel `outline`; action `outline` destructive (`border-destructive text-destructive`) when off, filled `destructive` when on | Header/separator follows the shared dialog header rule. Fits within 350px on 390 × 844 with wrapped copy. Focus returns to the row's Remove button. |
| Types table `A5c2Q` | Columns NOME / STATUS / AÇÕES; status badges unchanged | Remove the `Uso` header and cell; keep `usageCount` only to derive status | No other visual change. |

Layout inspection: no clipping or overflow on any visible node of the mapped frames. The only
reported "fully clipped" nodes are the intentionally hidden notices (`X10CE`, `yq4QV`) in states
that do not show them.

## Reference gaps and comparison plan

- **Required before implementation:** none outstanding. The four required Link/Edit states and
  the types page change were added and exported before the Spec opened.
- **Recommended supplemental coverage (deferred to runtime capture):** 390 × 844 narrow states of
  the table and all dialogs, the Operator read-only table, and the loading/error states. Existing
  Scoops responsive and read-only patterns govern them; `MV-01`/`MV-02` must capture them and
  record comparisons or deviations in Evaluation.
- **Runtime comparisons:** with the Playwright CLI, capture every reference state above at
  1560 × 1178 and 390 × 844 and compare against these PNGs. Record paths and results as `EV-*`
  (`Type = visual`) in `evaluation.md`. Mocked routes cannot prove persisted or authenticated flows.
