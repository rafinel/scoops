---
title: Accompaniment Portions tab
status: in_progress
revision: 5
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/67
scope:
  - MRP Accompaniment-side management of Portion accompaniment links and global accompaniments (Core, Validation, Server REST, Web)
  - MRP product details header, tabs and Settings category-dependency navigation (Web)
  - MRP sales-configuration republishing refactor (Core use cases, Strategy, Server repository), behavior-preserving
  - Portion-side Link/Edit dialog presentation of global accompaniments (Web, absorbed Q25)
  - Per-link and per-global accompaniment sale price, with data migration and PDV catalog reader (Core, Server database/provision, Web, absorbed Q33A)
last_updated_at: 2026-10-21
---

# Accompaniment Portions tab

## 1. Context and scope

**Objective:** From an Accompaniment product's page, a Manager manages every Portion that offers
it — listing, linking several Portions at once, editing and removing links, and managing global
status — without opening each Portion. Operators inspect the same tab read-only.

**Source/depth:** [Issue #67](https://github.com/rafinel/scoops/issues/67), `complete`. The change
adds Accompaniment-side Core use cases, REST routes and a multi-Portion atomic write, reuses
global-accompaniment conversion and restoration, and adds a Web tab, header query, multi-select
dialog and many UI states.

**Baseline and gap:** Each Portion↔Accompaniment pairing is one `product_accompaniments` row owned
by the Portion (`productId`), optionally referencing a `global_accompaniments` record. A global's
exclusion from a Portion is the absence of that Portion's row. Through revision 4 the sale price
was product-owned (`products.accompaniment_price`) and shared by every link; revision 5 moves it
to the link and the global record (FR-21). Every accompaniment use case requires the route product to be a
Portion (`BadRequestError('O produto não é uma porção.')`), the only reverse read is the Products
filter `usedAsAccompanimentId`, the tab bar has no `Porções` entry, `Product` carries no global
flag, and no multi-link operation exists. PDV reads the same rows by id; from revision 5 its catalog adapter
reads the price from the link or the global record (FR-21).

**Included:** `Porções` tab for an Accompaniment without the Portion category; paginated,
searchable list; multi-Portion Link dialog with picker, price, type, quantity, brand context and
cost preview; global creation, restoration of excluded Portions and shared edit; per-row Edit and
Remove; page-level global Edit and remove-from-all; `Global` header tag on every tab; Operator
read-only; inactive, empty, no-Portion, no-result, nothing-to-link, loading and error states;
desktop/narrow/keyboard/screen-reader behavior; a per-link price (FR-21).

**Absorbed beyond Issue #67 (approved Q13–Q15, recorded separately as FR-15/AC-16):** the Settings
category-dependency action for an Accompaniment dependency opens the Accompaniment's `Porções`
tab; a legacy product that also has the Portion category keeps opening Products filtered to the
Portions using it. PRQ-10 was amended and Issue #67 updated before this Spec.

**Absorbed refactor (approved Q16A/Q17A, recorded separately as FR-17/AC-18/AC-19):** the
sales-configuration republishing mechanism, in which 15 MRP use cases call
`GetAffectedProductSalesConfigurationsUseCase` and `publishAffectedProductSalesConfigurations`
(a use case used as a helper, against `core-package-rules.md`), is replaced by a batched
fact-reading repository plus a pure Strategy. Every caller and the three new write use cases
publish the same events directly. Behavior is unchanged; no product authority changes.

**Absorbed per-link price (approved Q33A–Q38A, revision 5, recorded separately as FR-21/AC-23/AC-24):**
after the first release candidate the Manager reported that editing one Portion's price in the
inline Edit changed it for every Portion. The product-level price rule of PRQ-09 was reversed by the
user: each individual link has its own price, a global has one shared price, and the Accompaniment
product's price becomes a default that only prefills. The PRD (PRQ-05, PRQ-08, PRQ-09, Journey G)
and Issue #67 were amended first. This is adjacent to the original Issue scope and was explicitly
absorbed by the user (Q33A); it adds a database migration, a seed change and a change to the PDV
catalog adapter's price source (not to PDV Core use cases).

**Exclusions:** bulk edit or bulk removal of existing rows; an Accompaniment Prices tab; a UI to
change the Accompaniment's default price after the first link (Q38A); a price per selected Portion
inside one multi-link save (Q37A); the tab for
legacy Portion+Accompaniment products (they keep Portion-side management); accompaniment types,
Combo rules, order history, PDV Core use cases and any PDV visual change; URL search parameters
for the tab's page and search; the other
MRP use-case-to-use-case dependencies (`GetProductRecipeUseCase`, `PublishProductStockAlertUseCase`,
`GetProductPricingUseCase`, `CreateAccompanimentTypeUseCase` and their callers), which remain
known deviations outside this scope (Q18).

**Resolved decisions (clarification ledger Q1–Q15 and later rounds, confirmed 2026-10-20/21):**

- Q26A/Q27B/Q28A/Q29A (revision 5) the backend, mode (c) of `POST …/portions` and the candidates
  read stay unchanged; the Link dialog loses its global mode, so a global Accompaniment's page has no
  `Vincular porções` and an excluded Portion is restored only from the Portion side; a 409 "became
  global" closes the dialog, refetches and shows a status message; frames `K94D7U`/`o0dUMY` lose the
  action and `jW65M` is obsolete (handoff, pending Pencil); PRQ-08, Journey G and Issue #67 amended.
- Q30–Q33A (revision 5) per-link price is absorbed into this Spec; the earlier read-only-price idea
  (Q30A, Q31, Q32) is withdrawn.
- Q34A the product-level `accompanimentPrice` stays as a default that prefills new links and globals
  and never changes existing ones; Q35A a global's price lives on `global_accompaniments`; Q36A both
  price columns are nullable and the migration copies each product's price into its existing
  individual links and globals (null stays null: `Não configurado`, inactive for PDV); Q37A one price
  per Link save applies independently to every new link; Q38A the default is written at registration
  and by the first link save when still unset, never afterwards (no UI to change it later).
- Q1 inactive Accompaniment: tab and list readable; `Vincular porções`, row `Editar` and page
  `Editar` disabled with "Ative o produto para vincular ou editar porções."; every Remove allowed.
- Q2 page-level global Edit/remove-all use new Accompaniment-scoped `PATCH`/`DELETE
  /products/:productId/global-accompaniment`, so a global with zero rows stays manageable.
- Q3 the header `Global` tag reads `GET /products/:productId/global-accompaniment` on every tab,
  only for products with the Accompaniment category; the tab reuses it for the page-level Edit.
- Q4 new Pencil frames for the undesigned states, desktop plus narrow tab and Link dialog; loading
  and error follow the existing skeleton/retry pattern.
- Q5 10 rows per page, local page/search state, 300 ms search debounce, a new search resets to
  page 1; refresh/back do not restore page or search.
- Q6 the picker loads every eligible Portion once, searches in the browser, scrolls rows inside a
  six-row area with fixed search row and footer, and `Selecionar todas`/`Limpar seleção` act on the
  current search results; selections survive search changes.
- Q7 all-or-none multi-link with up to 500 unique Portion ids; a rejection keeps the dialog open,
  refetches candidates, drops only no-longer-eligible selections and keeps entered values.
- Q8 per-row Edit reuses the Edit dialog; its subtitle names the Portion (its switch was later
  removed by Q24).
- Q9 a global row's `Remover desta porção` reuses the scope-switch dialog unchanged (help names the
  row's Portion); the page-level action opens the remove-from-all state with the switch locked on.
- Q10 no Portion registered: Manager empty state with `Cadastrar produto` → `/products/new` and no
  header Link; Operators see the ordinary empty copy; the listing returns `hasPortionProducts`.
- Q11 nothing left to link: `Vincular porções` stays enabled and the picker explains; going global
  stays available for a non-global Accompaniment; a global's submit stays disabled.
- Q12 a global with no rows keeps its page actions and shows a global empty state.
- Q13/Q14/Q15 absorbed dependency navigation, PRQ-10 wording with legacy fallback, Issue updated.
- Q25 (absorbed, recorded separately as FR-20/AC-22): on the Portion side, the Edit dialog of a
  global row and the Link dialog for a global candidate no longer show the locked switch; their
  global notice explains how global status ends. PRQ-08 and Issue #67 were amended before
  revision 4. The page-level remove-all dialog (`U3fQY1`) keeps its locked scope switch (not
  requested).
- Q24 dialogs opened from the Porções tab (Link, Link for a global, per-row and page Edit, Tornar
  global) have no `Disponível para todas as porções` switch; the Portion side keeps it. PRQ-08,
  Journey G and Issue #67 were amended before revision 3.
- Q23 `Tornar individual` is hidden for a global without rows (it would duplicate `Remover de todas as porções`).
- Q19 individually linked Accompaniments get a page-level `Tornar global` (Edit dialog, global notice;
  originally with a locked switch, removed by Q24); Q20 globals get `Tornar individual`, which ends global status and keeps every current
  row as an individual link; Q21 making a product global still requires a registered Portion; Q22
  `Tornar individual` is `DELETE …/global-accompaniment?keepPortionLinks=true`, allowed for inactive
  products. PRQ-08 and Issue #67 were amended for Q19/Q20 before revision 2.
- Q16 the republishing refactor is in this Spec and removes the sales-configuration helper use case
  from all 15 callers; Q17 a batched `ProductSalesConfigurationSourcesRepository` plus a pure
  `ProductSalesConfigurationStrategy` replace it; Q18 the four other use-case-to-use-case
  dependencies are listed as known out-of-scope deviations (no follow-up Issue was requested).
- Repository-fixed: the picker lists only Portions without a row for this Accompaniment (for a
  global these are exactly its excluded Portions), inactive Portions are selectable; brand is the
  read-only current main brand; the replacement warning appears only when individual links exist;
  rows are ordered by Portion name; PDV consumes unchanged rows and republished events.

| Source requirement | Coverage | Boundary |
| --- | --- | --- |
| MRP PRQ-05 | partial | `Porções` tab availability, Operator read access, `Global` tag in the header chip. |
| MRP PRQ-08 | full (Accompaniment-side capabilities and Experience, amended 2026-10-20 for `Tornar global`/`Tornar individual`) | Every `Porções` tab, Link Portions, global, conversion, removal and Operator statement. Portion-side behavior unchanged (no `Tornar individual` there). |
| MRP PRQ-09 | partial (amended 2026-10-21) | Per-link and per-global sale price and the default price, edited from this entry point under existing rules; migration of existing prices. |
| MRP PRQ-10 | partial | Empty/loading/error/retry states, accessible responsive tab and dialogs, amended Accompaniment dependency destination. |

Journey G (alternate path from the Accompaniment product) supplies MV-01/MV-02; PDV consumption is
proven by MV-04.

## 2. Behavior Contract

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | PRQ-05 | The `Porções` tab (icon `ice-cream-cone`) appears for a product with the Accompaniment category and without the Portion category, and for no other product. Its route is `/products/$productId/portions`; opening it for another product redirects to the product's Stock tab. Managers and Operators can open it. |
| FR-02 | PRQ-05, PRQ-08 | For a global Accompaniment, the product header shows a `Global` tag (globe icon) inside the Accompaniment category chip on every product tab, for Managers and Operators. Non-global products and products without the Accompaniment category show no tag. |
| FR-03 | PRQ-08, PRQ-09 | The tab lists the Portions that have the Accompaniment (individually or through its global) in a table with the columns PORÇÃO, TIPO, QTD POR PORÇÃO (with unit), PREÇO (the link's own sale price: `Grátis` for zero, `Não configurado` when unset; a global shows its shared price on every row) and, for Managers, AÇÕES. Rows of an individual Accompaniment may show different prices. Rows are ordered by Portion name (case-insensitive) then link id, 10 per page with numbered pagination and visible range, and filtered by a 300 ms-debounced, case-insensitive partial Portion-name search that resets to page 1. A page beyond the last returns the last page. |
| FR-04 | PRQ-08 | Individually linked: title `Porções (N)` with the total count and the individual subtitle "Porções que oferecem este acompanhamento no PDV. Cada vínculo tem o seu preço.". Global: title without count and the global subtitle; no Portion count appears in the global copy or removal dialogs. Individual rows show `Editar` and `Remover`; global rows show only `Remover desta porção`. An individual page shows `Tornar global` and `Vincular porções`; a global page shows `Editar`, `Tornar individual` (only with rows) and `Remover de todas as porções`, and no `Vincular porções` (Q27B). |
| FR-05 | PRQ-08, PRQ-09 | For an individually linked Accompaniment, `Vincular porções` opens a dialog with the read-only Accompaniment, a Portion picker, Type with `Gerenciar tipos →`, read-only current main brand, one price for the new links (help "Este preço vale para as porções selecionadas."), Quantity per portion with unit and cost preview, and no `Disponível para todas as porções` switch (Q24). The picker lists every eligible Portion (Portion category, any status, without a row for this Accompaniment) by name with an `Ativo`/`Inativo` badge, an in-list search, a six-row scroll area with fixed search row and "N selecionada(s)" footer, and `Selecionar todas`/`Limpar seleção` over the current search results. Selections survive search changes; the submit reads "Vincular 1 porção"/"Vincular N porções" and is disabled with no selection. A global Accompaniment's tab has no Link dialog (FR-09). |
| FR-06 | PRQ-08, PRQ-09 | Saving links every selected Portion with one shared type and quantity, gives each new link the entered price independently (existing links keep theirs), and writes the Accompaniment's default price only when it was still unset (FR-21), atomically: either every selected Portion link and the default are saved or nothing is. A rejected save keeps the dialog open with an inline error, refetches eligible Portions, drops only selections that are no longer eligible and keeps the other values. A 409 because the Accompaniment became global while the dialog was open closes the dialog, refetches the list and the global read, and shows the status message "Este acompanhamento agora é global. A lista foi atualizada." (`role="status"`). On success the dialog closes and the list, count and every affected Portion's accompaniment table show the new rows. |
| FR-07 | PRQ-09 | The Link dialog's price field prefills the Accompaniment's default price; before the default is set it proposes the applicable Resale price when configured (Single: product Resale price; By brand: current main brand's Resale price); otherwise a valid price is required before linking. The price is non-negative with at most two decimals. The entered price becomes the price of each link created by that save and never changes an existing link. Opening or cancelling writes nothing. |
| FR-08 | PRQ-08 | On this tab a non-global Accompaniment becomes global only through `Tornar global` (FR-18). Saving makes it global: existing rows are converted in place (row ids kept) with the shared type and quantity, their own prices are cleared in favor of the global's single price, and every other Portion receives a row. Dialogs opened from this tab have no `Disponível para todas as porções` switch; the Portion-side dialogs keep theirs. |
| FR-09 | PRQ-08 | A global Accompaniment's tab offers no `Vincular porções`, whether rows exist or not (Q27B); an excluded Portion is restored only from that Portion's own Accompaniments tab (FR-20), as the same global item. The backend capability to restore Portions through `POST …/portions` (mode c) and the candidates read are kept unchanged (Q26A) and remain API-level behavior covered by Core and Server tests, with no Web entry point on this tab. |
| FR-10 | PRQ-08, PRQ-09 | Per-row `Editar` on an individual row opens the Edit dialog for that Portion's link, with the subtitle "Atualize como {Acompanhamento} aparece em {Porção} no PDV.", a read-only Accompaniment, no switch and an editable price prefilled with that link's price (help "Este preço vale só para este vínculo."); saving changes only that link's type, quantity and price and cannot convert the link to global. Page-level `Editar` on a global opens the Edit dialog with "Atualize como {Acompanhamento} aparece em todas as porções no PDV.", the global notice, the shared price (help "Este preço vale para todas as porções.") and no switch, and saves the shared type, quantity and price for every Portion, including when the global has no rows. |
| FR-11 | PRQ-08 | Per-row `Remover` on an individual row asks for confirmation ("O vínculo de {Acompanhamento} com {Porção} será removido. O estoque e o histórico permanecem intactos.") and removes only that link. A global row's `Remover desta porção` opens the existing scope dialog (switch off; help "Desligado: remove apenas de {Porção}."): off removes only that Portion's row; on removes it from all Portions and ends global status. Page-level `Remover de todas as porções` opens the remove-from-all dialog with the switch on and locked and the warning "Será removido de todas as porções. Novas porções não o receberão. Os saldos de estoque não mudam."; confirming removes every row and the global record, including when no rows exist. No removal changes stock balances. |
| FR-12 | PRQ-08, PRQ-10 | States are distinct: loading skeleton; load error with `Tentar novamente`; no linked Portion (`i4m0t` copy and CTA); no Portion registered (Manager: "Nenhuma porção cadastrada", `Cadastrar produto` → `/products/new`, header Link hidden; Operator: ordinary empty copy without CTA); search without results with `Limpar busca`; global with no rows (global empty copy "Ele continua global: novas porções o receberão." without CTA, page actions kept); picker with nothing to link on an individual Accompaniment ("Todas as porções já têm este acompanhamento.", submit disabled; the Accompaniment can still use `Tornar global`); picker search without match ("Nenhuma porção encontrada."); picker load error with retry. |
| FR-13 | PRQ-05, PRQ-08 | Operators see the list, header tag, counts and states without the Actions column, `Vincular porções`, page actions or CTAs, and every Accompaniment-side write and the candidate read reject them. For an inactive Accompaniment, Managers see "Ative o produto para vincular ou editar porções.", with `Vincular porções`, `Tornar global`, row `Editar` and page `Editar` disabled and every Remove and `Tornar individual` enabled; the server rejects Link, `Tornar global` and global Edit for an inactive Accompaniment. |
| FR-14 | PRQ-05, PRQ-08, PRQ-10 | Every read and write is scoped to the actor's establishment: foreign or unknown products, Portions and links are not found and nothing changes. The backend decides eligibility, price, global and atomicity rules; each write commits its links, global record, prices and sales-configuration events together or not at all. |
| FR-15 | PRQ-10 (amended, absorbed) | When removing the Accompaniment category is blocked by Portions using the product, the dependency dialog action opens that product's `Porções` tab (preserving the existing retry parameters); a legacy product whose saved categories also include Portion opens Products filtered to Portions using it. |
| FR-18 | PRQ-08 (amended) | For an individually linked Accompaniment of an active product, Managers see `Tornar global` (outline, `globe`) before `Vincular porções`, also in the empty state when Portions exist. It opens the Edit dialog in a make-global mode without switch: title "Tornar acompanhamento global", subtitle "{Acompanhamento} passará a aparecer em todas as porções, incluindo as novas.", global notice, read-only Accompaniment, the replacement warning ("Este acompanhamento já está vinculado individualmente a algumas porções. Ao salvar, esses vínculos serão substituídos pela configuração global (tipo, quantidade e preço).") when individual links exist, empty Type and Quantity, the default or proposed price (help "Este preço vale para todas as porções."), and `Tornar global`. Saving has exactly the FR-08 effect. `Tornar global` is hidden when no Portion is registered (Q21); the server rejects that case. |
| FR-19 | PRQ-08 (amended) | For a global Accompaniment that has at least one Portion row (active or inactive), Managers see `Tornar individual` (outline, `link`) after `Editar`; it is hidden for a global without rows, where `Remover de todas as porções` already ends global status (Q23). It asks for confirmation ("Tornar {Acompanhamento} individual?", "{Acompanhamento} deixará de ser global.", "As porções atuais continuam com o acompanhamento como vínculo individual; novas porções não o receberão. Os saldos de estoque não mudam.", `Cancelar`/`Tornar individual`, pending "Convertendo…"). Confirming ends global status: every current row stays with the same id, type and quantity as an individual link and receives the global's price as its own price, the global record is removed, new Portions no longer receive it and stock is unchanged; the header tag and global copy disappear and the tab shows the individual list. The server still accepts the keep mode for a global without rows and then simply ends it. |
| FR-20 | PRQ-08 (amended, absorbed Q25) | On the Portion side, editing a global row and linking a global candidate removed from that Portion show no `Disponível para todas as porções` switch; the global notice reads "Acompanhamento global: as alterações valem para todas as porções. Para deixar de ser global, use Remover na tabela." (`role="status"`). The switch, its help and the replacement warning remain unchanged for non-global items; request shapes are unchanged (PATCH of a global row keeps sending `isGlobal: true`; POST for a global candidate still sends `isGlobal: true`), while the price in those requests now means the link's own price for an individual item and the shared price for a global one (FR-21). This supersedes the locked-switch presentation of the completed global-accompaniments Spec. |
| FR-17 | PRQ-08, PRQ-09 (absorbed refactor, behavior-preserving) | Every MRP change that affects a product's sales configuration publishes exactly the `mrp/product.sales-configuration-changed` events it publishes today, plus the changes FR-21 requires — same affected products in the same order, same payload shape (sizes with accompaniment `accompanimentId`, product, name, type, `basePrice` and `isActive`; resale configurations with brand id/name; `updatedAt` as the latest fact update), plus the `deleted` event on product removal — inside the write transaction. From revision 5 `basePrice` is the link's price, or the global record's price for a global row, and a missing or invalid price keeps the item inactive as before. The three new write use cases publish the same way. No MRP use case depends on another use case to build or publish sales configurations. |
| FR-16 | PRQ-10 | The tab and dialogs work at desktop and 390 px without page overflow (the table scrolls horizontally inside its card), are keyboard operable (Tab/Shift+Tab, Space/Enter on checkboxes and switches, Esc closes, focus returns to the trigger), and announce selection count, Portion status, global and replacement notices, and removal scope to assistive technology. |
| FR-21 | PRQ-08, PRQ-09 (amended 2026-10-21, absorbed Q33A) | An individual link carries its own sale price and a global Accompaniment carries one shared price on its global record; a row that references a global has no price of its own. The Accompaniment product's `accompanimentPrice` is a default: it is set at registration or by the first Link save while unset, prefills new links and globals, and no later write changes it. Editing a link's price (per-row Edit on this tab or on the Portion side) changes only that link and republishes only that Portion; editing a global's price changes it for every Portion and republishes each. Linking never changes existing links' prices. `Tornar global` stores the entered price on the global and clears the converted rows' own prices; `Tornar individual` copies the global's price onto each remaining row. An omitted price never changes a stored price: on Update it keeps the link's (or the global's) price, in restore mode (c) it keeps the global's, and the default never replaces an existing link or global price. The Portion-side Edit that turns an individual link into a global (switch on) stores the entered price, else the edited link's price, else the default, on the new global and clears the converted rows' own prices. Reads (`salePrice` of a row, `GlobalAccompanimentDetails`, sales configuration and the PDV catalog) use the link's price, or the global's for a global row; a null price shows `Não configurado` and keeps the item inactive for PDV. The price column header of the Portion-side Accompaniments table also reads `PREÇO`, and the price field's saved-price note reads "Preço já configurado." (no longer "para este produto"). A migration copies each product's current price into its existing individual links and globals, leaving nulls null, and changes no sale price. Testcontainers apply migrations to empty tables, so the backfill itself is proven by a one-off SQL check on a populated local database (AC-24), recorded in Evaluation. |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01 | Tab availability | Products: Accompaniment-only, Accompaniment+Resale, Accompaniment+Manufacturable, legacy Portion+Accompaniment, Portion, Ingredient | Manager/Operator open the product | Only the three non-Portion Accompaniment products show `Porções`; direct navigation to `/portions` for the others redirects to Stock | Web tabs and slot tests; route suite; MV-01 |
| AC-02 | FR-02 | Global header tag | Global and non-global Accompaniments, a non-Accompaniment product | Open Stock, Porções and Configurações tabs | Tag only for the global, inside the Accompaniment chip, on every tab; no global request for non-Accompaniment products; GET returns `isGlobal` and shared values (Manager, Operator) | Core Get test; get-global controller; Web header tests; route suite; MV-02 |
| AC-03 | FR-03, FR-04 | Listing | 23 Portions, 12 linked (one global-materialized set in another tenant), mixed name case | Read page 1, page 2, page 9, search "AÇA" | Name order, 10 per page, totals, last page for 9, case-insensitive partial match, item fields (type, quantity, unit, the link's own or the global's price, `isGlobal`, link id, Portion id/name), `hasPortionProducts`, foreign rows excluded | Core List test; list-portions controller; route suite (query string); Web card/table tests |
| AC-04 | FR-03, FR-04, FR-09, FR-13 | Table presentation | Individual list with different link prices; global list; Operator | Render | Columns and price formatting (`Grátis`, `Não configurado`), each row's own price, count only when individual, subtitles, row actions per kind, page actions per kind for a Manager (individual: `Tornar global`, `Vincular porções`; global: `Editar`, `Tornar individual` with rows, `Remover de todas as porções`, never `Vincular porções`), none for Operators and no Actions column for them | Web table/card/slot tests; route suite; MV-01, MV-02, MV-03 |
| AC-05 | FR-05, FR-16 | Picker | 8 eligible Portions (one inactive), 3 already linked | Open Link, search, select, `Selecionar todas`, `Limpar seleção`, change search | Only the 8 eligible by name with status badges; six-row scroll area; selections kept across searches; count/label update; submit disabled with none; checkboxes keyboard-operable; count announced politely | Core Candidates test; candidates controller; Web dialog/picker tests; route suite; MV-01 |
| AC-06 | FR-06, FR-14, FR-21 | Atomic multi-link | Eligible Portions A, B (inactive) and C; an Accompaniment with a default price and one without; an existing link with another price | Manager links A, B, C with one type/quantity and a price | Three rows with shared values, each carrying the entered price, the existing link's price unchanged, the default written only when it was unset, one sales-configuration event per affected Portion, 201 with the created rows; rows appear in the tab and in each Portion's table | Core Link test; link-portions controller (persisted rows/prices/events); route suite (body); MV-01 |
| AC-07 | FR-06, FR-14 | All-or-none rejection | Selection where one Portion was linked concurrently, one id is foreign/unknown, one product lost the Portion category, a duplicate id, 501 ids, or an injected failure after the first insert | POST | 409 / 404 / 409 / 422 / 422 / 500 respectively with no rows, price or events persisted; Web keeps the dialog open with `role="alert"`, refetches candidates, drops ineligible selections and keeps type/quantity/price | Core Link test; link-portions controller (rollback helper); Web dialog test; route suite |
| AC-08 | FR-07 | Price rules | Unpriced Single and By-brand Accompaniments with/without Resale price; Accompaniment with a default price | Open Link, cancel, submit without price, submit invalid, submit zero | Prefill the default; propose Resale; empty when none; cancel writes nothing; missing price 400; invalid price 422; zero saved as free and shown `Grátis` on the new rows and those Portions' tables only | Core Link and Update-global tests; controllers; Web dialog tests; MV-01 |
| AC-09 | FR-08 | Going global | Accompaniment individually linked to Portions B and C with different prices; Portions A, D exist | Use `Tornar global` (warning shown) and save with a price; open per-row `Editar` | B and C rows keep their ids with shared values and the global id and lose their own prices; A and D receive rows; the global holds the entered price and `salePrice` is that price everywhere; `isGlobal` everywhere; header tag appears; without individual links only the global notice is shown; no tab dialog shows a `Disponível para todas as porções` switch; ids sent with `isGlobal: true` for a non-global return 400; the Portion-side Edit with the switch on gives the same price result (entered price, else the edited link's price, else the default) | Core Link and Update-product-accompaniment tests; link-portions and update-product-accompaniment controllers; Web dialog test; route suite; MV-01 |
| AC-10 | FR-09, FR-06 | Global Accompaniment has no Link on this tab; backend restoration kept | Global present on A, removed from B and C; an individual dialog open while the Accompaniment becomes global | Open the global tab; call `POST …/portions` mode (c) for B; submit the Link dialog after the Accompaniment became global | The global page shows no `Vincular porções` with or without rows; the API still restores B as one row referencing the same global with the shared price and applies a changed quantity to every row (POST without `isGlobal: true` returns 409; an already present Portion returns 409); the dialog's 409 closes it, refetches and shows "Este acompanhamento agora é global. A lista foi atualizada." | Core Link test (mode c); link-portions controller (mode c); Web card/dialog/slot tests; route suite; MV-02 |
| AC-11 | FR-10, FR-13, FR-21 | Edits | Individual rows on A and B with different prices; global with rows; global with no rows; inactive Accompaniment | Edit A's quantity and price; page-level Edit of the global (both row states); attempt edits when inactive | Only A changes (type, quantity, price) and B's price is unchanged; the row Edit offers no conversion; page Edit updates the global record (including its price) and every row and republishes only on change; PATCH on a non-global returns 404; inactive Accompaniment: controls disabled and PATCH/POST return 400 with no change | Core Update-global test; existing update controller; update-global controller; Web dialog tests; MV-01, MV-02 |
| AC-12 | FR-11 | Removals | Individual row; global with rows on A and B; global with no rows; recorded stock balances | Remove the individual row; `Remover desta porção` on A (off); page-level remove-all on the global with and without rows | Only the targeted row removed; A excluded while B and new Portions keep it; remove-all deletes every row and the global so new Portions do not receive it; 404 for a non-global; balances unchanged; the dialogs show the Portion-named and locked copy | Core Remove-global test; remove-global controller; existing remove controller; Web dialog tests; MV-01, MV-02 |
| AC-13 | FR-12 | Distinct states | Mocked and real data for each state | Render the tab and dialog in each state | Each state shows its own copy and actions as in FR-12 (global without rows: no CTA and "Ele continua global: novas porções o receberão."); retry recovers from load errors | Web slot/card/dialog tests; route suite; MV-01–MV-03 captures |
| AC-14 | FR-13, FR-14 | Authorization and tenancy | Operator; Manager of another establishment | Operator GET list/global (allowed), GET candidates, POST, PATCH, DELETE; foreign Manager on every route | Operator reads succeed, writes and candidates return 403 with no change; foreign ids return 404 with no change | Core tests (AuthorizationError, NotFoundError, no writes); every new controller test; MV-03 |
| AC-15 | FR-16 | Accessibility and responsiveness | Desktop 1560 × 1178 and narrow 390 × 844 | Operate the tab, Link, Edit and removal dialogs by keyboard | No page overflow; table scrolls in its card; focus order and return; checkbox group labelled, count and status announced; notices `role="status"`; errors `role="alert"`; captures match references | Web tests (roles/ARIA); MV-01 at both viewports; Visual Reviewer |
| AC-16 | FR-15 | Dependency navigation (absorbed) | Accompaniment-only product with Portion users; legacy Portion+Accompaniment product with users | Attempt to remove the Accompaniment category and follow the dependency action | Accompaniment-only opens `/products/<id>/portions` with the retry parameters; legacy opens `/products?usedAsAccompanimentId=<id>` with the retry parameters | Web `use-category-dependency-dialog` tests; `product-settings-page.test.ts`; MV-05 |
| AC-18 | FR-17 | Event parity | A Portion with an active and an inactive size, a global and an individual accompaniment (one priced, one unpriced, one inactive target), a By-brand Resale product with brand configurations, and a product to remove | Run each of the 15 refactored write paths and the three new ones | Events identical to the pre-refactor contract: route product first then affected ids, de-duplicated; full payload as in FR-17; brand `updatedAt` ignored for a Single product; Link/Update accompaniment and the new write paths publish only Portion configurations; `deleted` event on removal; nothing published on no-op or rollback; every existing event assertion still passes with no fewer assertions | Core tests of the 15 refactored and 3 new use cases (moved matrix from the removed helper test); controller tests asserting full outbox payloads for representative paths | 
| AC-19 | FR-17 | No helper use case | Refactored candidate | Inspect Core and run PDV suites | `GetAffectedProductSalesConfigurationsUseCase` and `publishAffectedProductSalesConfigurations` no longer exist and no MRP use case imports another use case for sales configurations; PDV `revalidate-combos-for-product-job` and catalog/order suites pass, their fixtures only gaining link/global prices (FR-21) with no assertion decrease | Scoped source inspection recorded in Evaluation; `pnpm --filter @scoops/core check:architecture`; Server PDV suites |
| AC-20 | FR-18, FR-13 | Tornar global | Individual Accompaniment linked to B and C; inactive variant; Operator | Manager uses `Tornar global` and saves; inactive and Operator views | Same result as AC-09 through `POST …/portions` with `isGlobal: true` and no ids; dialog mode copy, no switch, conditional warning, empty Type/Quantity; button disabled when inactive, absent for Operators, globals and when no Portion is registered; `isGlobal: true` with no Portion product returns 400 with nothing written | Web dialog/card tests; route suite body; Core/Server Link mode b (AC-09); MV-01 |
| AC-21 | FR-19, FR-14 | Tornar individual | Global with rows on A and B (one referenced by a Combo) and a global price; global without rows (button hidden; API keep mode); inactive product; Operator; foreign tenant | Confirm `Tornar individual` | Rows keep ids, type, quantity and `updated_at`-neutral facts with `globalAccompanimentId` cleared and the global's price copied to each row; the global record is removed; a Portion registered afterwards gets no row; zero-row global just ends; inactive allowed; no sales-configuration event (the effective price per Portion is unchanged) and the Combo stays valid; Operator 403, foreign 404, non-global 404, nothing changed on rejection | Core `remove-global-accompaniment-use-case.test.ts` (keep mode); `remove-global-accompaniment` controller (`?keepPortionLinks=true`); Web confirmation and card tests; route suite query; MV-02 |
| AC-22 | FR-20 | Portion-side global dialogs | Portion with a global row and a global candidate removed from it; an individual row | Manager opens Edit on the global row, Link with the global candidate, and Edit on the individual row | Global dialogs show the two-sentence notice and no switch and submit request shapes as today (`isGlobal: true`); the individual row still shows the enabled switch and replacement warning | Web `product-accompaniment-dialog` tests (locked-switch assertions replaced by notice assertions, recorded in Evaluation); route suite `product-accompaniments-page.test.ts` edit-global and re-link cases; MV-02 |
| AC-23 | FR-21, FR-10, FR-20 | Per-link price | Accompaniment individually linked to Portions A and B at 4,00; a global with rows | Edit A's price to 8,00 from the tab and from A's own Accompaniments tab; edit the global's price; link C at 5,00 | B stays 4,00 and A is 8,00 in the tab, in A's table and in the PDV configuration of A only; only A is republished; the default price is unchanged; C is 5,00 and nothing else changes; the global's new price shows on every row and republishes every Portion; the Portion-side dialog edits only that link | Core Update-product-accompaniment, Link and Update-global tests; update controllers asserting persisted prices and events; Web dialog tests; route suite; MV-01, MV-02, MV-04 |
| AC-24 | FR-21, FR-17 | Migration and readers | Database with individual links and a global created before revision 5, one product unpriced | Apply the migration; read the tab, the Portion tables, sales configuration and the PDV catalog | Each existing individual link and global holds its product's price, the unpriced one stays null (`Não configurado`, inactive); no sale price changes; Strategy and PDV catalog adapter read link/global prices; event shape unchanged | Server migration check on a seeded database (recorded in Evaluation); Core Strategy cases through consuming use-case tests; controller tests asserting event payloads; PDV `list-order-catalog`, `preview-order` and `register-order` controller suites (link, global and null prices through the catalog); MV-04 |
| AC-17 | FR-06, FR-08, FR-11, FR-21 | PDV consumption | Portions linked, restored, converted or removed from this tab; two Portions with different link prices for one Accompaniment | Open New Sale and configure each Portion | Linked accompaniments appear with that link's price (`Grátis` at zero) and consume quantity per portion; removed ones disappear; registered orders unchanged; Combos referencing converted rows stay valid | Existing PDV suites passing with fixtures updated to supply link/global prices (no assertion decrease), including a null-price inactive case in `list-order-catalog`; link-portions controller asserting events; MV-04 |

### Design Contract

Use [design/handoff.md](./design/handoff.md) and its twenty-two saved, visually inspected
references (revision 5 supersedes some of them: its "Revision 5 deltas" section governs wherever it
disagrees with a picture, `jW65M` is obsolete, and `K94D7U`/`o0dUMY` still show the removed
`Vincular porções`; the `.pen` file was not reachable when revision 5 was authored, so those deltas
are a documented visual assumption until the frames are redrawn): approved frames `Nlypf` (default), `K94D7U` (global), `i4m0t` (empty), `vrB3x` (Link
dialog, with the Q6 scroll area), reused `q2gZuS`/`C8la0H` (global
removal), and the Q4 frames `jW65M` (Link, global; obsolete since revision 5), `hl9fU` (nothing to
link), `U3fQY1` (page-level remove-all), `L4WsP` (no Portion registered), `pMRSi` (search without
results), `zkm8K` (Operator), `Ukgbr` (inactive), `o0dUMY` (global without rows), `fAy9D` (narrow
tab) and `A4lMzz` (narrow Link dialog), plus the revision-2 dialogs `V4tfiT` (Tornar global) and
`z6Ur3D` (Tornar individual), the revision-3 Porções-tab Edit dialogs `s30kJA` (page Edit of a global)
and `JyW9f` (per-row Edit), and the revision-4 Portion-side dialogs `DyrWo` (Edit of a global row) and `y7dXvq` (Link of a global candidate) without the locked switch; `Nlypf`, `i4m0t`, `Ukgbr` and `fAy9D` show `Tornar global` and `K94D7U`/`o0dUMY`
show `Tornar individual`. Node IDs are provenance only; implementation and review
use the saved bundle without Pencil. The `search-x` icon used by `pMRSi` must be added to
`IconName` and the icon map.

Runtime comparisons use 1560 × 1178 desktop and 390 × 844 narrow viewports. Loading and error use
the existing tab skeleton and retry pattern. Existing Portion-side dialog measurements (global
bundle handoff) govern reused dialogs. Preserve visible focus, readable wrapping, contrast, dialog
focus return and reduced motion. Approved copy deviations from reused frames are FR-10/FR-11's
Portion-named subtitles and help, the page-level remove-all copy, and the replacement warning's
"a algumas porções".

## 3. Technical Contract

This section lists expected changes, not completed work. Existing paths were verified on
2026-10-20; `[create]` names are proposals adjustable within the Rules. Public routes, payload
fields, status codes, atomicity and ordering are contract. Snippets are illustrative partial
deltas based on current types. Revision 5 adds one generated migration (nullable price columns plus a
data backfill, FR-21) and a seed change; the existing indexes of `product_accompaniments`
`(establishment_id, accompaniment_product_id)` and the unique `(establishment_id, product_id,
accompaniment_product_id)` (`product-accompaniment-model.ts:40-52`) are unchanged.

### Cross-layer flow and decisions

```text
Web Porções slot ──REST──▶ MRP controllers ──▶ Core use case (database.run: serializable, 1 retry)
 ├─ header GlobalTag ─ GET  /products/:id/global-accompaniment ─▶ GetGlobalAccompaniment
 ├─ list            ─ GET  /products/:id/portions                ─▶ ListAccompanimentPortions
 ├─ picker          ─ GET  /products/:id/portions/candidates     ─▶ ListAccompanimentPortionCandidates
 ├─ Link dialog     ─ POST /products/:id/portions (individual only on the Web; mode c stays API-only) ─▶ LinkAccompanimentPortions
 ├─ page Edit       ─ PATCH /products/:id/global-accompaniment   ─▶ UpdateGlobalAccompaniment
 ├─ page remove-all ─ DELETE /products/:id/global-accompaniment  ─▶ RemoveGlobalAccompaniment
 ├─ Tornar individual ─ DELETE …/global-accompaniment?keepPortionLinks=true ─▶ RemoveGlobalAccompaniment (keep mode)
 ├─ Tornar global   ─ POST /products/:id/portions { isGlobal: true } ─▶ LinkAccompanimentPortions (mode b)
 └─ row Edit/Remove ─ existing PATCH/DELETE /products/:portionId/accompaniments/:linkId (unchanged)
Writes ─▶ ProductAccompanimentsRepository / GlobalAccompanimentsRepository / ProductsRepository (price)
       ─▶ ProductSalesConfigurationSourcesRepository (batched facts) ─▶ ProductSalesConfigurationStrategy
       ─▶ scope.eventsRepository.add ─▶ outbox mrp/product.sales-configuration-changed (per Portion)
PDV catalog / preview / register / cost provider ─▶ product_accompaniments rows (the catalog adapter now reads the link's or the global's price, FR-21)
```

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| Global page actions (Q2) | Accompaniment-scoped `global-accompaniment` resource | Portion routes via any row | Works when a global has no rows; two more use cases. |
| Header tag source (Q3) | Dedicated read queried by the header | Flag added to stock/pricing/settings reads | Existing contracts unchanged; one extra request for Accompaniment products. |
| Multi-link atomicity (Q7) | One `database.run` for all rows, price and events; reject everything on any ineligible Portion | Partial success | Matches the Issue; the Manager retries after the dialog prunes ineligible selections. |
| Picker loading (Q6) | Unpaginated candidates, browser search | Server-paginated picker | Portion catalogs are small; `Selecionar todas` stays unambiguous. Accepted deviation from `architecture.md` §18 ("paginate unbounded collections"): the list is bounded by the establishment's Portion catalog. |
| Republishing (Q16/Q17) | `ProductSalesConfigurationSourcesRepository.findManyByProductIds` loads raw facts for all affected products in a few batched queries; pure `ProductSalesConfigurationStrategy` builds configurations; each use case computes its affected ids and adds events | Keep the helper use case (accepted deviation); per-use-case loaders | Removes the use-case-as-helper deviation and the per-Portion N+1; a large but behavior-preserving change across 15 use cases, guarded by AC-18/AC-19. A multi-link of up to 500 Portions still republishes inside one serializable transaction; a conflict surviving the retry returns the generic 409 with nothing written (AC-07). |
| Tab state (Q5) | Local page/search state | URL search contract | Matches detail-tab precedent; refresh resets to page 1. |
| Price model (Q33A–Q38A) | Nullable `accompaniment_price` on `product_accompaniments` (individual links) and `global_accompaniments` (one shared price); `products.accompaniment_price` kept as a default that only prefills; a row referencing a global keeps its own price null | Keep the product-owned price (read-only in the row Edit); copy the global price onto every global row; drop the product price | Per-link pricing is what the user requires; the global stays uniform with one source of truth; the default keeps registration and Resale-proposal rules unchanged. Cost: a migration and a second price source in every reader. |
| Legacy data (Q36A) | Backfill by SQL copy from each link's product; nulls stay null | NOT NULL with 0 | No sale price changes and unpriced legacy links stay inactive as today. |
| Default price writes (Q38A) | Registration and first Link save while unset | Every Link/global Edit | Predictable starting price; accepted trade-off: no UI to change the default later (exclusion). |
| Shared link/global logic | Reuse the existing `GlobalAccompanimentRowsStrategy`; extract further pure decisions into Strategies only when two use cases need them | Calling `LinkProductAccompanimentUseCase` per Portion | Rules forbid using a use case as a helper; persistence orchestration stays in each use case. |

### packages/core

```text
packages/core/src/mrp/
├── domain/entities/
│   ├── product-accompaniment.ts                         [modify] + accompanimentPrice?: number (FR-21)
│   └── global-accompaniment.ts                          [modify] + accompanimentPrice?: number (FR-21)
├── domain/structures/
│   ├── product-accompaniment-{create,update}.ts         [modify] + accompanimentPrice (update accepts null to clear)
│   ├── global-accompaniment-{create,update}.ts          [modify] + accompanimentPrice
│   ├── accompaniment-portion-details.ts                 [create]
│   ├── accompaniment-portions-page.ts                   [create]
│   ├── accompaniment-portion-list-params.ts             [create]
│   ├── accompaniment-portion-candidate.ts               [create]
│   ├── link-accompaniment-portions-input.ts             [create]
│   ├── update-global-accompaniment-input.ts             [create]
│   ├── global-accompaniment-details.ts                  [create]
│   ├── product-sales-configuration-source.ts            [create] raw facts for one product (FR-17); includes the globals of its links (FR-21)
│   └── index.ts                                         [modify]
├── domain/strategies/
│   ├── product-sales-configuration-strategy.ts          [create] facts → ProductSalesConfiguration (FR-17); price from link or global (FR-21)
│   ├── {accompaniment-portion-details,global-accompaniment-details}-strategy.ts [create or modify] salePrice from link or global
│   ├── global-accompaniment-rows-strategy.ts            [modify only if needed] rows created for a global carry no price
│   └── index.ts                                         [modify]
├── interfaces/
│   ├── product-sales-configuration-sources-repository.ts [create] (FR-17)
│   ├── mrp-database.ts                                  [modify] + productSalesConfigurationSourcesRepository
│   ├── index.ts                                         [modify]
│   ├── product-accompaniments-repository.ts             [modify] price in create/update; the keep-mode capability also sets each row's price
│   ├── global-accompaniments-repository.ts              [modify only if its create/update types require it]
│   ├── products-repository.ts                           [modify only if a narrower Portion read is needed]
│   └── mrp-service.ts                                   [modify]
└── use-cases/
    ├── list-accompaniment-portions-use-case.ts          [create]
    ├── list-accompaniment-portion-candidates-use-case.ts [create]
    ├── link-accompaniment-portions-use-case.ts          [create]
    ├── get-global-accompaniment-use-case.ts             [create]
    ├── update-global-accompaniment-use-case.ts          [create]
    ├── remove-global-accompaniment-use-case.ts          [create]
    ├── {link-product-accompaniment, update-product-accompaniment, get-product-accompaniments,
    │    list-product-accompaniment-candidates}-use-case.ts [modify] per-link price, default price rules (FR-21)
    ├── get-affected-product-sales-configurations-use-case.ts [remove] (FR-17)
    ├── {change-product-categories, change-product-unit, link-product-accompaniment,
    │    update-product-accompaniment, remove-product-accompaniment, register-product-brand,
    │    update-product-brand, remove-product-brand, set-primary-product-brand,
    │    register-product-size, update-product-size, remove-product-size,
    │    save-product-resale-configuration, update-product-settings, remove-product}-use-case.ts [modify] (FR-17)
    ├── index.ts                                         [modify]
    └── tests/
        ├── <one test file per new use case>             [create]
        ├── <the 15 refactored use-case tests>           [modify] mock the sources repository; no assertion decrease
        └── get-affected-product-sales-configurations-use-case.test.ts [remove] its matrix moves to consumer tests
```

#### Domain

No entity, error class or event is added; `ProductAccompaniment` and `GlobalAccompaniment` gain an
optional `accompanimentPrice` (FR-21). Structures (one exported type per file).
`AccompanimentPortionDetails` deliberately reuses the existing `ProductAccompanimentDetails`
projection, which already carries the link `id` (an inherited, pre-existing deviation from
`core-package-rules.md` "Only entities have identity"): the row must stay assignable to the moved
Edit/Remove dialogs and the existing Portion-side `PATCH`/`DELETE` routes, which address the row by
that id. No new structure adds its own `id`.

```ts
// accompaniment-portion-details.ts [create] — reuses the existing row projection (its `id` is the link id)
export type AccompanimentPortionDetails = ProductAccompanimentDetails & {
  readonly portionProductId: string
  readonly portionProductName: string
}

// accompaniment-portions-page.ts [create]
export type AccompanimentPortionsPage = PaginationResponse<AccompanimentPortionDetails> & {
  readonly hasPortionProducts: boolean
}

// accompaniment-portion-list-params.ts [create]
export type AccompanimentPortionListParams = {
  readonly establishmentId: string
  readonly accompanimentProductId: string
  readonly search?: string
  readonly page: number
  readonly pageSize: number
}

// accompaniment-portion-candidate.ts [create]
export type AccompanimentPortionCandidate = {
  readonly productId: string
  readonly name: string
  readonly status: ProductStatus
}

// link-accompaniment-portions-input.ts [create]
export type LinkAccompanimentPortionsInput = {
  readonly portionProductIds?: readonly string[]
  readonly accompanimentTypeId: string
  readonly quantityPerPortion: number
  readonly accompanimentPrice?: number
  readonly isGlobal?: boolean
}

// update-global-accompaniment-input.ts [create]
export type UpdateGlobalAccompanimentInput = {
  readonly accompanimentTypeId: string
  readonly quantityPerPortion: number
  readonly accompanimentPrice?: number
}

// global-accompaniment-details.ts [create] — shared values are present only when isGlobal is true
export type GlobalAccompanimentDetails = {
  readonly accompanimentProductId: string
  readonly accompanimentProductName: string
  readonly isGlobal: boolean
  readonly unit: ProductUnit
  readonly salePrice: number | null
  readonly globalAccompanimentId?: string
  readonly accompanimentTypeId?: string
  readonly accompanimentTypeName?: string
  readonly quantityPerPortion?: number
  readonly brandId?: string
  readonly brandName?: string
  readonly unitCost?: number
  readonly estimatedCost?: number
}
```

Errors use existing shared classes:

| Case | Error | Message |
| --- | --- | --- |
| Route product unknown or foreign | `NotFoundError` | Produto não encontrado. |
| Route product lacks Accompaniment or has Portion (list, candidates, link, update/remove global) | `BadRequestError` | O produto não é um acompanhamento elegível para porções. |
| Route product lacks Accompaniment (get global) | `BadRequestError` | O produto não é um acompanhamento. |
| Inactive Accompaniment on Link or global Edit | `BadRequestError` | Ative o produto para vincular ou editar porções. |
| No Portion ids without `isGlobal: true`, or a global with no ids | `BadRequestError` | Selecione ao menos uma porção. |
| Portion ids with `isGlobal: true` on a non-global | `BadRequestError` | Não informe porções ao disponibilizar o acompanhamento para todas as porções. |
| `isGlobal: true` on a non-global when the establishment has no Portion product (Q21) | `BadRequestError` | Cadastre uma porção antes de disponibilizar este acompanhamento para todas as porções. |
| Unknown or foreign Portion id | `NotFoundError` | Porção não encontrada. |
| Portion already has the Accompaniment or is not a Portion | `ConflictError` | Uma ou mais porções selecionadas não estão mais disponíveis para este acompanhamento. |
| Global Accompaniment without `isGlobal: true` | `ConflictError` | Este acompanhamento é global. Ative “Disponível para todas as porções” para vinculá-lo às porções. |
| PATCH/DELETE global on a non-global | `NotFoundError` | Acompanhamento global não encontrado. |
| Operator write or candidate read | `AuthorizationError` | existing |
| Type, price, quantity, main brand | existing messages | existing |

#### Use cases

All use cases receive `MrpDatabase`, validate the actor before the transaction, load and check the
route product inside the actor's establishment, and run inside one `database.run` (serializable,
one retry; a remaining conflict becomes the existing generic `ConflictError`). Writes republish
every Portion whose sales configuration changed with exactly one
`mrp/product.sales-configuration-changed` event inside the same transaction, and a no-op change
publishes none, through the FR-17 mechanism below.

**Republishing refactor (FR-17).** `GetAffectedProductSalesConfigurationsUseCase` and
`publishAffectedProductSalesConfigurations` are removed. Each of the 15 existing callers and the
three new write use cases, inside its own `database.run`:

1. computes exactly the affected product ids it passes today: the route product first, then its
   explicit affected ids or the Portions owning rows of an accompaniment (via
   `productAccompanimentsRepository.findManyByAccompanimentProductId`), de-duplicated in that order;
2. reads the facts with `scope.productSalesConfigurationSourcesRepository.findManyByProductIds`;
3. builds configurations with `ProductSalesConfigurationStrategy` (pure; receives
   `AccompanimentPriceValidationStrategy` through its constructor with a default instance; applies
   the By-brand rule — brands, and their `updatedAt`, count only for By-brand products; skips unknown
   products as today; throws the same
   `NotFoundError('A configuração de acompanhamento não foi encontrada.')` when a link's
   accompaniment product, type or referenced global is missing; reads each accompaniment's `basePrice`
   from the link, or from the global for a row that references one, and counts the global's
   `updatedAt` among the facts of the rows that reference it);
4. keeps its existing configuration filter — Link and Update Product Accompaniment, and the three
   new Accompaniment-side write use cases, publish only configurations of products with the Portion
   category;
5. adds one `ProductSalesConfigurationChangedEvent` (`state: 'available'`) per configuration, and
   `RemoveProductUseCase` also adds its `deleted` event, via `scope.eventsRepository.add`.

Small repeated orchestration (steps 1, 2, 4 and 5) stays in each use case; the reusable decision is the
Strategy. Event names, payloads and the outbox contract are unchanged, so PDV consumers and the
Messaging layer need no change.

```ts
// product-sales-configuration-source.ts [create] — illustrative
export type ProductSalesConfigurationSource = {
  readonly product: Product
  readonly sizes: readonly ProductSize[]
  readonly links: readonly ProductAccompaniment[]
  readonly resaleConfigurations: readonly ResaleConfiguration[]
  readonly brands: readonly Brand[] // every brand of the product; the Strategy applies the By-brand rule
  readonly accompanimentProducts: readonly Product[] // targets of `links`
  readonly accompanimentTypes: readonly AccompanimentType[] // types of `links`
  readonly globals: readonly GlobalAccompaniment[] // globals referenced by `links` (FR-21)
}

// product-sales-configuration-sources-repository.ts [create]
export interface ProductSalesConfigurationSourcesRepository {
  findManyByProductIds(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly ProductSalesConfigurationSource[]> // only products of the establishment, in input order
}

// product-sales-configuration-strategy.ts [create] — input type named and exported from the same
// file as GlobalAccompanimentRowsStrategy does
export type ProductSalesConfigurationStrategyInput = {
  readonly establishmentId: string
  readonly sources: readonly ProductSalesConfigurationSource[]
}

export class ProductSalesConfigurationStrategy
  implements BusinessRuleStrategy<
    ProductSalesConfigurationStrategyInput,
    readonly ProductSalesConfiguration[]
  >
{
  constructor(
    private readonly accompanimentPriceValidation = new AccompanimentPriceValidationStrategy(),
  ) {}
}
```

| Use case | Profiles | Contract |
| --- | --- | --- |
| `ListAccompanimentPortionsUseCase` | Manager, Operator | Route product must be an Accompaniment without Portion. Normalizes `search` (trim, empty → undefined), `page` (default 1) and `pageSize` (default 10, 1–100, else `BadRequestError`). Reads the page of rows for the Accompaniment ordered by Portion name (case-insensitive) then link id; re-reads the last page when `page` exceeds `totalPages`. Builds each item with the existing row projection (type name, unit, the link's or global's price, `isGlobal`, `hasOtherPortionLinks`, main brand, cost) plus Portion id/name. `hasPortionProducts` is true when the establishment has any Portion product. |
| `ListAccompanimentPortionCandidatesUseCase` | Manager | Same route check. Returns every Portion product of the establishment (any status) without a row for this Accompaniment, ordered by name, as `{ productId, name, status }`, unpaginated. |
| `LinkAccompanimentPortionsUseCase` | Manager | Validates: Accompaniment active, has Accompaniment, lacks Portion; type in tenant; main brand when By brand; quantity > 0 with ≤ 3 decimals; price resolved from input or the default price and valid. Price handling (FR-21): **individual rows** receive the entered price as their own `accompanimentPrice` (required when the default is unset); **a global** stores it on the global record and rows keep none, and in mode (c) an omitted price keeps the global's own price; the product default is written only when it was unset and never replaces an existing price. Then: **(a) not global, `isGlobal` falsy:** ids required; every id must be a Portion of the tenant (unknown/foreign → 404) without a row (→ 409); adds all rows with one `addMany`. **(b) not global, `isGlobal: true`:** ids must be absent/empty (→ 400); creates the global, converts existing individual rows in place keeping ids, adds rows for every other Portion via `GlobalAccompanimentRowsStrategy`. **(c) global:** `isGlobal: true` required (→ 409); ids required, each must be an excluded Portion (→ 404/409); updates the global and every row when type/quantity differ, then adds one row per id referencing the global. In all modes only changed prices are written, existing individual links keep their prices (a), converted rows lose theirs (b), and affected Portions are republished. Mode (c) stays as API behavior with no Web entry point (Q26A/Q27B). Returns the created or converted rows as `AccompanimentPortionDetails[]`. |
| `GetGlobalAccompanimentUseCase` | Manager, Operator | Route product must have the Accompaniment category (legacy Portion+Accompaniment allowed → `isGlobal: false`). Returns `GlobalAccompanimentDetails`; shared values, brand and cost only when global. |
| `UpdateGlobalAccompanimentUseCase` | Manager | Route product must be an active, Accompaniment-only product with a global (→ 404). Validates type, quantity, price, main brand as Link. Updates the global record (type, quantity and its shared price; an omitted price keeps the stored one, and the global's `updated_at` advances on any change) and every row's type/quantity when they differ; republishes every Portion with a row only on change; never touches the product default. Works with zero rows. Returns `GlobalAccompanimentDetails`. |
| `RemoveGlobalAccompanimentUseCase` | Manager | Request adds `keepPortionLinks?: boolean` (default false). Route product must be an Accompaniment-only product with a global (→ 404); status is not checked. **Default:** captures the Portions with rows, removes every row of the global, then the global, and republishes the captured Portions. **`keepPortionLinks: true` (FR-19):** clears the global reference on every row of the global and gives each row the global's price with the dedicated repository capability (ids, type, quantity and `updatedAt` unchanged), then removes the global; publishes no sales-configuration event because the effective price, type and quantity of every Portion are unchanged. Never touches stock or the product price. Both modes work with zero rows. |

Existing Portion-side use cases keep their routes and request shapes; per-row Edit/Remove from this
tab call them with the row's Portion id and link id. Their price semantics change (FR-21):
(The omitted-price and `convertToGlobal` price rules are in FR-21.) `LinkProductAccompanimentUseCase` gives an individual link the entered price (or, when making it
global, stores it on the new global), writes the default only when unset and no longer saves the
price on the product otherwise; `UpdateProductAccompanimentUseCase` replaces the link's own price
(individual) or the global's price and every row's type/quantity (global), and republishes only the
edited Portion for an individual price change; `GetProductAccompanimentsUseCase` and
`ListProductAccompanimentCandidatesUseCase` project `salePrice` from the link or the global (the
candidate's proposal for an individual Accompaniment stays the default, then the Resale proposal).
`RemoveProductAccompanimentUseCase` is unchanged. If
implementation extracts shared pure logic from them into a Strategy, those use cases are modified
behavior-preservingly and join the mutation scope below.

#### Interfaces

```ts
// product-accompaniments-repository.ts [modify] — addition; name adjustable under the Rules
findPageByAccompanimentProductId(
  params: AccompanimentPortionListParams,
): Promise<PaginationResponse<ProductAccompaniment>> // ordered by Portion name (lower), then id; search on Portion name
// FR-19: dedicated capability (name adjustable, e.g. `replaceManyGlobalReferenceByGlobalAccompanimentId`)
// with its own domain changes type that clears `global_accompaniment_id` on every row of the global
// and leaves id, type, quantity and `updated_at` unchanged, so no sales-configuration fact changes

// FR-21: ProductAccompaniment/GlobalAccompaniment create/update structures carry `accompanimentPrice`.
// `replaceManyByAccompanimentProductId` (in-place conversion to a global) clears the rows' own price,
// the keep-mode capability sets each row's price from the global in the same UPDATE that clears the
// reference, and `replaceManyByGlobalAccompanimentId` (shared type/quantity) never carries a price.

// mrp-service.ts [modify] — additions (input derived like listProducts/listAccompanimentTypes)
listAccompanimentPortions(
  productId: string,
  input: Omit<AccompanimentPortionListParams, 'establishmentId' | 'accompanimentProductId'>,
): Promise<RestResponse<AccompanimentPortionsPage>>
listAccompanimentPortionCandidates(productId: string): Promise<RestResponse<AccompanimentPortionCandidate[]>>
linkAccompanimentPortions(
  productId: string,
  input: LinkAccompanimentPortionsInput,
): Promise<RestResponse<AccompanimentPortionDetails[]>>
getGlobalAccompaniment(productId: string): Promise<RestResponse<GlobalAccompanimentDetails>>
updateGlobalAccompaniment(
  productId: string,
  input: UpdateGlobalAccompanimentInput,
): Promise<RestResponse<GlobalAccompanimentDetails>>
removeGlobalAccompaniment(
  productId: string,
  options?: { keepPortionLinks?: boolean },
): Promise<RestResponse<void>> // sends ?keepPortionLinks=true only when set
```

Existing `ProductsRepository.findManyByCategory`, `findManyByIds`, `findById`, `replace`,
`ProductAccompanimentsRepository.addMany`, `findManyByAccompanimentProductId`,
`replaceManyByAccompanimentProductId`, `replaceManyByGlobalAccompanimentId`,
`removeByGlobalAccompanimentId` and `GlobalAccompanimentsRepository` methods cover the remaining
reads and writes; a narrower existence/count read may be added if `hasPortionProducts` would
otherwise load every Portion.

### packages/validation

```text
packages/validation/src/
├── mrp/list-accompaniment-portions-query-schema.ts      [create] search: trim().max(120).optional(); page: coerce int ≥1 default 1; pageSize: coerce int 1–100 default 10
├── mrp/link-accompaniment-portions-schema.ts            [create] strict; portionProductIds: z.array(z.uuid()).max(500) unique (refine), optional; accompanimentTypeId uuid; quantityPerPortion: accompanimentQuantitySchema; accompanimentPrice: accompanimentPriceSchema.optional(); isGlobal: boolean optional
├── mrp/update-global-accompaniment-schema.ts            [create] strict; accompanimentTypeId, quantityPerPortion, accompanimentPrice?
├── mrp/remove-global-accompaniment-query-schema.ts      [create] strict; keepPortionLinks: 'true' | 'false' → boolean, optional
├── web/accompaniment-portions-form-schema.ts            [create] form fields for the Link Portions dialog (syntax only)
└── index.ts                                             [modify]
```

Schemas validate syntax only and reuse the existing quantity/price primitives; eligibility,
exclusivity, mode and atomic rules stay in Core. Revision 5 adds no schema: `accompanimentPrice`
is already optional on the Link, Update and Update-global bodies, and its meaning (link price,
global price, default) is decided in Core.

### apps/server

#### REST

```text
apps/server/
├── rest-client/mrp/products.rest                                   [modify] 6 requests (+ the three Link modes and `DELETE …/global-accompaniment?keepPortionLinks=true`)
└── src/mrp/
    ├── rest/controllers/
    │   ├── list-accompaniment-portions.controller.ts               [create]
    │   ├── list-accompaniment-portion-candidates.controller.ts     [create]
    │   ├── link-accompaniment-portions.controller.ts               [create]
    │   ├── get-global-accompaniment.controller.ts                  [create]
    │   ├── update-global-accompaniment.controller.ts               [create]
    │   ├── remove-global-accompaniment.controller.ts               [create]
    │   └── tests/<one .controller.test.ts per new controller>      [create]
    ├── rest/dtos/
    │   ├── accompaniment-portion-response.dto.ts                   [create]
    │   ├── accompaniment-portions-page-response.dto.ts             [create]
    │   ├── accompaniment-portion-candidate-response.dto.ts         [create]
    │   ├── global-accompaniment-response.dto.ts                    [create]
    │   └── index.ts                                                [modify]
    ├── rest/schemas/product-schemas.ts                             [modify] re-export new schemas
    ├── fixtures/mrp-module-fixture.ts                              [modify only for new helpers]
    └── mrp.module.ts                                               [modify] register controllers
```

| Method and path | Auth | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `GET /products/:productId/portions` | Manager, Operator | query `search?`, `page?`, `pageSize?` | 200 `AccompanimentPortionsPage` | 400, 401, 404, 422 |
| `GET /products/:productId/portions/candidates` | Manager | — | 200 `AccompanimentPortionCandidate[]` | 400, 401, 403, 404 |
| `POST /products/:productId/portions` | Manager | `LinkAccompanimentPortionsInput` | 201 `AccompanimentPortionDetails[]` | 400, 401, 403, 404, 409, 422 |
| `GET /products/:productId/global-accompaniment` | Manager, Operator | — | 200 `GlobalAccompanimentDetails` | 400, 401, 404 |
| `PATCH /products/:productId/global-accompaniment` | Manager | `UpdateGlobalAccompanimentInput` | 200 `GlobalAccompanimentDetails` | 400, 401, 403, 404, 422 |
| `DELETE /products/:productId/global-accompaniment` | Manager | query `keepPortionLinks?` (`true`/`false`, default `false`) | 204 | 400, 401, 403, 404, 422 |

`ProfilesGuard` returns 403 for an authenticated profile outside `@RequiredProfiles`; the global
error handler maps a Core `AuthorizationError` to 401, as for existing MRP controllers. Each
controller's `@RequiredProfiles` matches its use case's profile check (Operator requests to
Manager-only routes are therefore 403 at the guard).

Controllers use `@MrpController()`, `@RequiredProfiles`, `@CurrentAccount()` as the actor,
`ParseUUIDPipe` for `:productId`, `ZodValidationPipe` with the shared schemas, one use case each
instantiated in the constructor with `MRP_REPOSITORIES.database`, `RequestBody` derived from the
use case, response DTOs with `static from` (nested DTOs for page items), and `@ApiResponse` for
every listed status. The `/portions/candidates` route must not be shadowed by another
`/portions/:param` route. Existing routes are unchanged, so deployed web builds stay compatible.

#### Database

```text
apps/server/src/
├── shared/database/drizzle/migrations/<generated>.sql + meta/*     [generate] pnpm --filter server db:migration:generate, then add the backfill statements below
├── shared/database/seed.ts (and the MRP seeder it calls)           [modify] seeded links and globals carry prices
└── mrp/
    ├── constants/mrp-repositories.ts                               [modify] Symbol token
    ├── database/mrp-database.module.ts                             [modify] register with useExisting
    └── database/drizzle/
        ├── models/{product-accompaniment,global-accompaniment}-model.ts [modify] + accompaniment_price numeric(18,2) null, check >= 0
        ├── mappers/drizzle-{product,global}-accompaniment-mapper.ts [modify] price <-> number
        ├── repositories/drizzle-global-accompaniments-repository.ts [modify] price in writes
        ├── repositories/drizzle-product-accompaniments-repository.ts [modify] paginated read by accompaniment; price in writes; keep-mode capability sets the price
        ├── repositories/drizzle-products-repository.ts             [modify] use the extracted helper
        ├── repositories/drizzle-product-sales-configuration-sources-repository.ts [create] (FR-17); also loads the globals of the links
        ├── repositories/drizzle-mrp-database.ts, repositories/index.ts [modify] build it over the transaction executor
        └── <mrp persistence helper for escapeLikePattern>          [create] location adjustable under the Database Rule
```

`DrizzleProductSalesConfigurationSourcesRepository` reads, for the given ids and establishment, the
products, sizes, accompaniment rows, resale configurations, every brand of those products, and the
rows' accompaniment products, types and referenced globals in a bounded number of batched queries (no
per-product loop), maps every record through the existing mappers, filters every query by `establishment_id`,
and returns sources in input order, omitting unknown or foreign ids. It is read-only (no seeder or
`removeAll` obligation) and is covered indirectly by controller tests.

`findPageByAccompanimentProductId` joins `product_accompaniments` (filtered by `establishment_id` and
`accompaniment_product_id`) with the Portion product row (same establishment) for
`ilike(name, %escapeLikePattern(search)%)` — the MRP-private `escapeLikePattern`
(`drizzle-products-repository.ts:355`) is extracted into one MRP persistence helper reused by both
repositories rather than copied — orders by `lower(products.name)` then
`product_accompaniments.id`, applies `limit/offset`, counts with the same filter, and maps rows
through `DrizzleProductAccompanimentMapper` into `PaginationResponse`. The page query and index set
are unchanged; only the two price columns below are added. Constraint violations keep translating
to `ConflictError`; the existing unique `(establishment_id, product_id, accompaniment_product_id)`
rejects concurrent duplicates and rolls back the whole transaction.

**Migration (FR-21, Q36A).** `product_accompaniments.accompaniment_price` and
`global_accompaniments.accompaniment_price` are `numeric(18, 2)`, nullable, each with a
`CHECK (… IS NULL OR … >= 0)` named like the existing `mrp_products_accompaniment_price_non_negative`;
`product_accompaniments` also gets `CHECK (global_accompaniment_id IS NULL OR accompaniment_price IS NULL)`
(`mrp_product_accompaniments_global_row_has_no_price`), safe because every conversion changes both columns
in one UPDATE.
The file is produced by `db:migration:generate` from the shared schema barrel (filename and
snapshot are generated, not hand-named); the same file then receives two data statements, after the
`ALTER TABLE`s:

```sql
UPDATE "product_accompaniments" AS pa SET "accompaniment_price" = p."accompaniment_price"
  FROM "products" AS p WHERE p."id" = pa."accompaniment_product_id" AND pa."global_accompaniment_id" IS NULL;--> statement-breakpoint
UPDATE "global_accompaniments" AS ga SET "accompaniment_price" = p."accompaniment_price"
  FROM "products" AS p WHERE p."id" = ga."accompaniment_product_id";
```

Rows that reference a global keep a null own price (the global's price applies); null product prices
leave null link/global prices. `updated_at` is left untouched by the backfill so sales-configuration
`updatedAt` does not change, and no event is published by the migration. `products.accompaniment_price`
and its constraint are unchanged (the default). The seed sets prices on seeded individual links and
the seeded global.

#### Provision (`documentation/rules/provision-layer-rules.md`)

`apps/server/src/shared/provision/pdv-order-registration/mrp-sales-catalog-provider.ts` [modify]:
`mapAccompaniment` takes `basePrice` and the configured-price check from the link's
`accompanimentPrice`, or from the global record for a row that references one (reading it through
`GlobalAccompanimentsRepository`), instead of `product.accompanimentPrice`; a null price keeps the
item inactive. It checks the global's `establishmentId` like it does the type's. Its returned shape and
the PDV Core use cases are unchanged. The adapter is `indirect` under `test-integrity.config.mjs`, so
it has no direct test: link, global and null prices are proven through the PDV controller suites that
consume the catalog (`list-order-catalog`, `preview-order`, `register-order` and the combo controller
suites that use `SalesCatalogProvider` through `combo-controller-test-helpers.ts`); the combo job
suite (`revalidate-combos-for-product-job.test.ts`) only needs its fixtures updated. Those suites and their fixtures (`mrp-module-fixture.ts`, `pdv-module-fixture.ts`,
`combo-controller-test-helpers.ts`) are modified to supply prices on links and globals instead of
only on the Accompaniment product, with no assertion decrease; MRP controller tests that assert event
`basePrice` (for example `update-product-size`, `remove-product`) get the same fixture change.

### apps/web

#### Routes

```text
apps/web/src/
├── constants/routes.ts                                   [modify] productDetailsPortions: '/products/$productId/portions' + productPortionsRoute(productId)
├── routes/_authenticated/products/$productId/portions.tsx [create] thin route rendering ProductPortionsSlot
└── routeTree.gen.ts                                      [generate] pnpm --filter web generate-routes
```

No `validateSearch` (Q5). Authentication comes from the `_authenticated` layout; the category guard
lives in the slot hook (redirect to `productStockRoute` once the product is loaded and is not an
Accompaniment without Portion), as in the Pricing and Recipe slots.

#### UI

```text
apps/web/src/ui/
├── shared/hooks/use-debounced-value.ts                   [move] from ui/pdv/hooks; update pdv use-effective-search import
├── shared/widgets/components/icon/{types/icon-name.ts, lucide-icon/icons.ts} [modify] + 'search-x'
└── mrp/
    ├── hooks/
    │   ├── mrp-query-keys.ts                             [modify] accompanimentPortions(productId, params), accompanimentPortionCandidates(productId), globalAccompaniment(productId) under products()
    │   ├── use-accompaniment-portions-query.ts           [create]
    │   ├── use-accompaniment-portion-candidates-query.ts [create]
    │   ├── use-global-accompaniment-query.ts             [create]
    │   ├── use-link-accompaniment-portions-action.ts     [create]
    │   ├── use-update-global-accompaniment-action.ts     [create]
    │   └── use-remove-global-accompaniment-action.ts     [create]
    └── widgets/
        ├── components/
        │   ├── product-details-tabs/{index.tsx [modify], tests/* [create]}
        │   ├── product-accompaniment-dialog/             [move + modify] from slots/product-accompaniments-slot (with its tests); Portion-named subtitle, page-level global mode
        │   ├── remove-global-accompaniment-dialog/       [move + modify] (with tests) Portion-named help; locked all-scope mode with page copy
        │   ├── remove-product-accompaniment-dialog/      [move + modify] (with tests) Portion-named description
        │   ├── global-badge/                             [move] from product-accompaniments-table/accompaniment-row when reused by the header
        │   └── <dialog field widgets reused by link-portions-dialog> [move] from product-accompaniment-dialog-fields (type, brand, price, quantity, cost estimate, global field and notices), each with exported Props and its tests
        ├── pages/product-details-page/product-details-header/
        │   ├── index.tsx                                 [modify]
        │   ├── use-product-details-header.ts             [create]
        │   ├── global-tag/index.tsx                      [create only if GlobalBadge does not match the handoff]
        │   └── tests/{product-details-header.test.tsx [modify] mock useProductDetailsHeader, use-product-details-header.test.ts [create]}
        └── slots/
            ├── product-accompaniments-slot/action-dialogs/index.tsx  [modify] imports of moved dialogs
            ├── product-stock-slot/tests/product-stock-slot.test.tsx  [modify] renders the real ProductDetailsPage: mock the header hook or the global query, no assertion decrease
            ├── product-settings-slot/category-dependency-dialog/{use-category-dependency-dialog.ts, index.tsx?, tests/*} [modify] FR-15
            └── product-portions-slot/                    [create]
                ├── index.tsx, use-product-portions-slot.ts, tests/*
                ├── portions-card/ (header, subtitles, page actions, search, inactive notice, pagination)
                ├── portions-table/portion-row/
                ├── portions-empty-state/ (no link, no Portion registered, Operator, search, global without rows)
                ├── portions-loading/, portions-error/
                ├── link-portions-dialog/ (+ portion-picker/; reuses the moved dialog's type, brand, price, quantity and cost fields; individual only, no global mode or switch)
                └── action-dialogs/
```

- **Slot state** (`use-product-portions-slot.ts`): product from `useProductStockQuery` (header,
  status, categories), category guard, `canManage` from `useAuthContext`, local `page`/`search`
  (debounced 300 ms with `useDebouncedValue`; search change → page 1; the rendered page follows
  the response page), portions query, global query, and the selected action
  (`link | edit-row | remove-row | edit-global | remove-global`). Loading, error/retry and
  refreshing states follow the Portion-side slot (`QueryRefreshStatus`).
- **Link dialog** (`link-portions-dialog`): individual Accompaniments only (Q27B). React Hook Form
  + `accompanimentPortionsFormSchema`; candidates query enabled while open; the price proposal comes
  from `useProductPricingQuery(productId)` (Resale proposal) and the prefill from the Accompaniment's
  default price; cost from the product stock facts. The picker is a labelled group (`role="group"`,
  `aria-labelledby`) of checkboxes with status badges, a fixed search input, a 246 px scroll area and
  a polite live count; `Selecionar todas` toggles over filtered results. Submit sends
  `portionProductIds` and `accompanimentPrice` (the price applies to each new link); it never sends
  `isGlobal`. The form has no switch field and no global mode. On 4xx it shows `role="alert"`,
  refetches candidates and removes selected ids no longer present; on success it closes and the slot
  refetches. A 409 is told apart by refetching `GET …/global-accompaniment`: when it now reports `isGlobal: true`
  (the Accompaniment became global elsewhere while the dialog was open) the server text is not
  shown: the dialog closes, the slot refetches the list and the global read
  (so the page shows the global view) and shows "Este acompanhamento agora é global. A lista foi
  atualizada." as a polite status message (`role="status"`) on the tab.
- **Price field (FR-21):** the shared price field widget takes its help text from its owner:
  Link dialog "Este preço vale para as porções selecionadas.", per-row Edit and the Portion-side
  Edit/Link of an individual item "Este preço vale só para este vínculo.", and every global or
  make-global dialog "Este preço vale para todas as porções." Per-row Edit prefills the link's own
  price; page Edit prefills the global's price; neither changes the product default.
- **Reuse boundary:** a widget used by a second owner (the three dialogs, the dialog field widgets
  and `GlobalBadge`) is promoted to its own `ui/mrp/widgets/components/...` directory with exported
  Props and its colocated tests; no owner deep-imports another widget's private subtree.
- **Edit/Remove reuse:** per-row actions pass the row's `portionProductId` and `ProductAccompanimentDetails`
  (the row) to the moved dialogs; page-level Edit passes the global details and submits through
  `useUpdateGlobalAccompanimentAction`; page-level removal uses the moved remove-global dialog in
  locked all-scope mode with `useRemoveGlobalAccompanimentAction`.
- **Tornar global / Tornar individual (FR-18/FR-19):** the card's page actions add `Tornar global`
  (individual, active product) and `Tornar individual` (global). `Tornar global` opens the moved
  Edit dialog in a make-global mode that submits through `useLinkAccompanimentPortionsAction` with
  `isGlobal: true` and no ids; `Tornar individual` opens a confirmation alert dialog (primary tone,
  `link` tile, no switch) that calls `useRemoveGlobalAccompanimentAction` with
  `keepPortionLinks: true`. Both close on success and the slot refetches; errors stay inline
  (`role="alert"`); focus returns to the trigger.
- **Header:** `useProductDetailsHeader` enables `useGlobalAccompanimentQuery` only when the product
  has the Accompaniment category; the tag renders inside the Accompaniment chip when `isGlobal`;
  loading or error renders no tag.
- **Tabs:** `TAB_CONFIG` gains `{ icon: 'ice-cream-cone', label: 'Porções', route:
  'productDetailsPortions', value: 'portions' }` after Accompaniments, visible when the product has
  Accompaniment and lacks Portion.
- **Cache:** new mutations invalidate `mrpQueryKeys.products()` (covers portions, candidates,
  global, stock and every Portion's accompaniments); existing Portion-side mutations already do.
- **Dependency dialog (FR-15):** the `accompaniment-user` action navigates to
  `productPortionsRoute(productId)` with the existing retry parameters, or to Products with
  `usedAsAccompanimentId` when the product's **saved** categories also include Portion. The saved
  categories decide because they also decide whether the `Porções` tab exists (FR-01); the
  attempted, unsaved category change is ignored. The dialog receives the saved categories (or an
  equivalent flag) from its owner.
- Copy for every state is in FR-04–FR-13 and the handoff; user-visible values use pt-BR labels.
- No telemetry is added.

#### REST

```text
apps/web/src/rest/services/mrp-service.ts                 [modify]
apps/web/tests/fixtures/mrp-module-fixture.ts             [modify] mocks for the six routes
apps/web/tests/mrp/product-portions-page.test.ts          [create]
apps/web/tests/mrp/product-settings-page.test.ts          [modify] FR-15
```

`MrpService` implements the six Core operations: `GET /products/${productId}/portions?search&page&pageSize`
(omitting empty values), `GET …/portions/candidates`, `POST …/portions`, `GET|PATCH|DELETE
…/global-accompaniment`. No service test files.

## 4. Verification Contract

| Acceptance | Checker and permitted boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| AC-01 | Web `product-details-tabs` and `product-portions-slot` tests; route suite `product-portions-page.test.ts`; MV-01 | Tab matrix by categories; redirect to Stock | `evaluation.md` |
| AC-02 | Core `get-global-accompaniment-use-case.test.ts`; `get-global-accompaniment` controller; Web header tests; route suite; MV-02 | Tag per tab; no request for non-Accompaniment; Manager/Operator reads | `evaluation.md` |
| AC-03 | Core `list-accompaniment-portions-use-case.test.ts`; `list-accompaniment-portions` controller (seeded distinguishable rows, two tenants); route suite query-string assertions | Order, pagination, last page, search, fields, `hasPortionProducts`, isolation | `evaluation.md` |
| AC-04 | Web slot/card/table tests (hook mocked); route suite; MV-01–MV-03 | Columns, each row's own price and formats, counts, subtitles, action matrix per kind/profile (no Link on a global) | `evaluation.md` |
| AC-05 | Core `list-accompaniment-portion-candidates-use-case.test.ts`; candidates controller; Web `link-portions-dialog`/picker tests; route suite; MV-01 | Eligibility, order, status, selection behavior, keyboard, live count | `evaluation.md` |
| AC-06 | Core `link-accompaniment-portions-use-case.test.ts`; `link-accompaniment-portions` controller asserting rows, per-link prices, default write and outbox events; route suite body; MV-01 | Shared rows with the entered price, existing links untouched, default only when unset, one event per Portion, 201 body | `evaluation.md` |
| AC-07 | Core Link test (no repository writes after rejection); controller tests with `failInsertInto`/`countRows` rollback helpers and 409/404/422 cases; Web dialog test; route suite | Nothing persisted on every rejection; dialog recovery | `evaluation.md` |
| AC-08 | Core Link and Update-global tests; controllers; Web dialog tests (default prefill, proposal, empty, invalid, zero); MV-01 | Price prefill/proposal/required/zero/cancel | `evaluation.md` |
| AC-09 | Core Link test (mode b) and Update-product-accompaniment test (`convertToGlobal`); controller (row ids preserved, row prices cleared, global price, `globalAccompanimentId`, new rows); Web `Tornar global` dialog test (warning copy conditional) and Link/Edit dialog tests (no switch); route suite; MV-01 | In-place conversion, single global price and full coverage; 400 for ids with `isGlobal: true` | `evaluation.md` |
| AC-10 | Core Link test (mode c); `link-accompaniment-portions` controller (single restored row, shared change applied, 409 cases); Web card/dialog/slot tests (no `Vincular porções` on a global with or without rows; a 409 "became global" closes the dialog, refetches and shows the status message); route suite; MV-02 | API restoration without a second item; no Web entry point; recovery message | `evaluation.md` |
| AC-11 | Core `update-global-accompaniment-use-case.test.ts` and `update-product-accompaniment-use-case.test.ts`; `update-global-accompaniment` controller; existing update controller (link price only); Web dialog tests; MV-01, MV-02 | Row Edit changes only that link; shared update with/without rows, no-op without events, 404 non-global, inactive 400 | `evaluation.md` |
| AC-20 | Web make-global dialog mode and card action-matrix tests; route suite (`POST` body without ids); Core/Server evidence of AC-09; Core Link test and `link-accompaniment-portions` controller asserting the Q21 400 with nothing written; MV-01 | Entry point, copy, disabled/hidden matrix, global result | `evaluation.md` |
| AC-21 | Core remove-global keep-mode tests; `remove-global-accompaniment` controller (`?keepPortionLinks=true`: row ids/type/quantity kept, global price copied to rows, reference cleared, global gone, later Portion gets no row, zero rows, inactive, 403/404/422, no outbox event); a combo controller read asserting a Combo referencing a converted row stays valid (it follows from the no-event and unchanged-effective-price assertions); Web confirmation tests; route suite query; MV-02 | Conversion in place without data or price loss | `evaluation.md` |
| AC-12 | Core `remove-global-accompaniment-use-case.test.ts`; `remove-global-accompaniment` controller (rows and global removed, balances unchanged, a Portion registered afterwards gets no row); existing remove controller; Web dialog tests; MV-01, MV-02 | Scope semantics and copy | `evaluation.md` |
| AC-13 | Web slot/card/empty-state/dialog tests per state; route suite (empty, no-Portion, search, global without rows without CTA, nothing to link, load error and retry); MV captures | Distinct copy/actions; recovery | `evaluation.md` |
| AC-14 | Core tests (AuthorizationError/NotFoundError, no writes); every new controller (Operator 403 or 200 as listed, foreign 404, unchanged rows); MV-03 | Authorization and tenant isolation | `evaluation.md` |
| AC-15 | Web tests (roles, `aria-*`, focus); MV-01 at 1560 × 1178 and 390 × 844; Visual Reviewer | Keyboard, announcements, no overflow, reference match | `evaluation.md` |
| AC-16 | Web `use-category-dependency-dialog` and dialog tests; `product-settings-page.test.ts`; MV-05 | Destination by product categories, retry parameters kept | `evaluation.md` |
| AC-22 | Web `product-accompaniment-dialog` tests; `apps/web/tests/mrp/product-accompaniments-page.test.ts` (edit global, link again: no `role="switch"`, notice text, request shapes with `isGlobal: true`); MV-02 | Portion-side global dialogs without switch; non-global switch intact | `evaluation.md` (list of replaced locked-switch assertions) |
| AC-23 | Core `update-product-accompaniment-use-case.test.ts`, `link-product-accompaniment-use-case.test.ts`, `link-accompaniment-portions-use-case.test.ts`, `update-global-accompaniment-use-case.test.ts`; update/link/update-global controllers asserting persisted prices, untouched default and outbox events; Web dialog tests (row price prefill and help copy); route suite; MV-01, MV-02, MV-04 | Row edits change one link; link writes new prices only; global edit changes the shared price | `evaluation.md` |
| AC-24 | Migration applied to a seeded database with legacy links, a global and an unpriced product (SQL assertions recorded); controller tests asserting event payload `basePrice`; PDV `list-order-catalog`, `preview-order` and `register-order` controller suites as the allowed consumer boundary of the catalog adapter (no direct provision test); Core consuming use-case tests of the Strategy; MV-04 | Backfill, null stays null, readers use link/global prices, event shape unchanged | `evaluation.md` |
| AC-17 | Existing PDV controller/job suites pass with fixtures updated to supply link/global prices; `list-order-catalog` asserts link, global and null prices; link-portions controller asserts per-Portion events; MV-04 | PDV sees each link's price; removed accompaniments disappear | `evaluation.md` |
| AC-18 | Core tests of the 15 refactored and 3 new use cases (mocking `productSalesConfigurationSourcesRepository`, asserting `eventsRepository.add` payloads); the removed helper test's matrix (unknown product skipped, foreign rows ignored, price validity → `basePrice`/`isActive`, latest `updatedAt`, resale brand names, missing accompaniment product/type → `NotFoundError`) moved into named consumer tests; controller tests asserting full outbox payloads for `update-product-size`, `update-product-accompaniment`, `save-product-resale-configuration`, `remove-product` and `link-accompaniment-portions` | Same ids, order and payload; `deleted` event; none on no-op/rollback; no assertion decrease | `evaluation.md` (moved-assertion map and before/after counts) |
| AC-19 | Scoped inspection that no MRP use case imports a sales-configuration helper use case; `pnpm --filter @scoops/core check:architecture`; Server PDV `revalidate-combos-for-product-job.test.ts`, order catalog and register-order suites | Helper removed; PDV suites passing with only price-fixture changes | `evaluation.md` |

Tests assert behavior at owning boundaries: Core use-case tests with `vitest-mock-extended`
(`mock<MrpDatabase>`, `mockDeep<MrpDatabaseRepositories>`) and fakers, no repository, Strategy,
DTO or service tests; Server controller tests through Supertest with real wiring and
Testcontainers via `MrpModuleFixture` and `mrp-controller-test-helpers.ts`; Web widget tests mocking
the owning hook plus hook tests for behavior-owning widget hooks (slot, Link dialog, picker, header,
dependency dialog), no query/action-hook or service tests; the mocked Playwright route suite for
method/path/query/body, states and recovery. Mocked route coverage is not evidence of real
authorization or persistence.

**Moved tests:** `check:test-integrity` diffs with `--no-renames`, so a moved test file appears as a
new file and is not compared with its base. Every test file moved with the dialogs, field widgets,
`GlobalBadge` or `useDebouncedValue` consumers must keep at least its base-branch test-case and
assertion counts (only import paths and Portion-named copy may change); Evaluation records the
before/after counts per moved file. **FR-20 exception:** in the moved `product-accompaniment-dialog`
tests and in `apps/web/tests/mrp/product-accompaniments-page.test.ts` (modified in place, compared
with its base by `check:test-integrity`), each locked-switch assertion is replaced one for one with a
notice assertion and a no-`role="switch"` assertion; every file still keeps at least its base
test-case and assertion counts, and Evaluation lists each replaced assertion.

**Mutation (Core):** targeted Stryker on the 6 new, 15 refactored and 2 price-modified use cases (AC-02, AC-03,
AC-05–AC-12, AC-14, AC-18, AC-23, AC-24):

```bash
pnpm --filter @scoops/core test:mutation --files \
  src/mrp/use-cases/list-accompaniment-portions-use-case.ts \
  src/mrp/use-cases/list-accompaniment-portion-candidates-use-case.ts \
  src/mrp/use-cases/link-accompaniment-portions-use-case.ts \
  src/mrp/use-cases/get-global-accompaniment-use-case.ts \
  src/mrp/use-cases/update-global-accompaniment-use-case.ts \
  src/mrp/use-cases/remove-global-accompaniment-use-case.ts \
  src/mrp/use-cases/change-product-categories-use-case.ts \
  src/mrp/use-cases/change-product-unit-use-case.ts \
  src/mrp/use-cases/link-product-accompaniment-use-case.ts \
  src/mrp/use-cases/update-product-accompaniment-use-case.ts \
  src/mrp/use-cases/get-product-accompaniments-use-case.ts \
  src/mrp/use-cases/list-product-accompaniment-candidates-use-case.ts \
  src/mrp/use-cases/remove-product-accompaniment-use-case.ts \
  src/mrp/use-cases/register-product-brand-use-case.ts \
  src/mrp/use-cases/update-product-brand-use-case.ts \
  src/mrp/use-cases/remove-product-brand-use-case.ts \
  src/mrp/use-cases/set-primary-product-brand-use-case.ts \
  src/mrp/use-cases/register-product-size-use-case.ts \
  src/mrp/use-cases/update-product-size-use-case.ts \
  src/mrp/use-cases/remove-product-size-use-case.ts \
  src/mrp/use-cases/save-product-resale-configuration-use-case.ts \
  src/mrp/use-cases/update-product-settings-use-case.ts \
  src/mrp/use-cases/remove-product-use-case.ts
```

Pass conditions: each new or changed file ≥ 70% (Core CI treats every refactored file as changed,
so any file previously below 70% needs strengthened behavior tests), the MRP module ≥ 70%, and
every unchanged eligible MRP use case preserves its target-branch score. Surviving or uncovered
mutants on mode selection, eligibility, atomic rejection, ordering/pagination normalization,
authorization, tenant, affected-id computation and event-publication branches require a
strengthened test or a recorded equivalent-mutant justification in Evaluation. The Strategy is not
a mutation target; its rules are killed through the consuming use-case tests.

**Manual validation** (Playwright CLI, real services; prerequisites per `AGENTS.md`: `docker compose
ps`, PostgreSQL, `pnpm --filter server dev`, `pnpm --filter web dev`, seed accounts present —
`pnpm --filter server db:seed` only with explicit approval when missing — then `pnpm --filter web
test:auth:setup`; artifacts under `apps/web/.playwright-cli/`; inspect console and failed requests
for every scenario):

| ID | ACs | Start | Steps and assertions | Viewports |
| --- | --- | --- | --- | --- |
| MV-01 | AC-01, AC-03–AC-09, AC-11–AC-13, AC-15, AC-20 | Manager, `/products/<Banana fatiada>/portions` (seeded individual Accompaniment) | 1) Tab order and default state vs `Nlypf`; search. 2) Link two Portions including an inactive one with a type, quantity and price; verify rows, price and outbox events in PostgreSQL. 3) Edit one row's quantity and, separately, its price: only that row changes, the other row keeps its price, the Portion's own table and PDV configuration agree; remove one row (balances unchanged). 4) Inactivate the product in Settings: notice, disabled Link/Edit, enabled Remove; reactivate. 5) Confirm no tab dialog has the switch; use `Tornar global`: warning shown; save; every Portion has a row, original row ids kept, header shows `Global`. 6) Repeat 2 and 5 by keyboard (Tab, Space, Esc) checking focus return and announcements. Capture and compare each referenced state. | 1560 × 1178, 390 × 844 |
| MV-02 | AC-02, AC-10–AC-13, AC-21, AC-22 | Manager, `/products/<Granola>/portions` (seeded global) | 1) Tag on Stock, Porções and Configurações. 2) Page `Editar`: global notice, no switch; change quantity and price; another Portion's table shows both. 3) Confirm the global page offers no `Vincular porções`; `Remover desta porção` on one row (off); restore it from that Portion's own Accompaniments tab (Link of a global candidate); one row returns. 4) Open Açaí tradicional's Accompaniments tab: Edit Granola and Link again a removed global show the notice and no switch; an individual row's Edit still has the switch. 5) Remove from all rows individually until none remain: global-without-rows state; page `Editar` still works. 5) `Tornar individual`: confirm; rows stay (same ids in PostgreSQL), tag gone, list individual; `Tornar global` again restores global. 6) Page `Remover de todas as porções`: locked dialog; global gone; a newly registered Portion does not receive it. Capture and compare. | 1560 × 1178, 390 × 844 |
| MV-03 | AC-04, AC-13, AC-14 | Operator, same tabs | List and tag visible; no actions, CTAs or Actions column; Operator empty copy where applicable; direct POST/PATCH/DELETE and candidates return 403 with no change. | 1560 × 1178, 390 × 844 |
| MV-04 | AC-17, AC-23, AC-24 | Operator, `Nova venda` | After the migration is applied to the seeded database, existing linked Portions still show their previous prices; two Portions linked to one Accompaniment at different prices in MV-01 offer it at their own link prices; a Portion linked in MV-01 offers Banana fatiada at its link price; a removed one no longer appears; register an order and confirm stock consumption; earlier orders unchanged. | 1560 × 1178 |
| MV-05 | AC-16 | Manager, `/products/<Banana fatiada>/settings` | Try to remove the Accompaniment category; follow the dependency action; final URL is `/products/<id>/portions?retry…`. | 1560 × 1178 |

States not reproducible with seed data (no Portion registered, more than 10 linked Portions,
nothing to link at scale, load errors) are captured with the Playwright CLI using `page.route`
mocks and recorded as visual-only evidence, never as server-backed proof. Cleanup: stop the
started dev processes; restore changed data by reseeding only with explicit approval. An
independent Visual Reviewer is required after current captures exist, covering every handoff
reference at its viewport.

| Command | Purpose and prerequisites |
| --- | --- |
| `pnpm --filter @scoops/core test` / `test:coverage` | Core use-case tests and coverage |
| `pnpm --filter @scoops/core check:code` / `check:types` / `check:architecture` | Core static gates |
| `pnpm --filter @scoops/validation check:code` / `check:types` / `check:architecture` | Validation schemas |
| `pnpm --filter server test` / `test:coverage` | Controller integration (Docker/Testcontainers) |
| `pnpm --filter server check:code` / `check:types` / `check:architecture` / `build` | Server gates |
| `pnpm --filter web generate-routes` | Route tree regeneration |
| `pnpm --filter web test` / `test:coverage` | Web widget and hook tests |
| `pnpm --filter web exec playwright test tests --workers=1` | Mocked route suite (CI form of `test:integration`) |
| `pnpm --filter web check:code` / `check:types` / `check:architecture` / `build` | Web gates |
| `pnpm check:test-integrity` / `pnpm check:complexity` | Test ownership and complexity baselines |
| `pnpm --filter server db:migration:generate` | Generates the price-column migration and snapshot from the shared schema; add the backfill SQL, review the diff |
| `pnpm --filter server db:migration:apply` | Applies it to the local `scoops-postgres` database (needs the user's approval; backfill is verified with SQL before/after) |
| `pnpm update:complexity-baseline` | Only to drop baseline entries of the removed helper file (`get-affected-product-sales-configurations-use-case.ts`, including its clone entry); review the diff. New and refactored files (Strategy, repository, 21 use cases) must pass `check:complexity` without new or worsened violations |

REST route/example parity: `apps/server/rest-client/mrp/products.rest` covers all six new routes
the three Link modes and both `DELETE …/global-accompaniment` modes (parity is not integration proof).

## 5. Documentation alignment and revision history

| Authority | Applies to | Alignment |
| --- | --- | --- |
| `documentation/prds/mrp.md` PRQ-01, PRQ-05, PRQ-08, PRQ-09, Journey G | Tab, Link Portions, global, per-link price, default price, Operator | Amended 2026-10-21 (Q27B Link on global; Q33A–Q38A per-link price) before revision 5 |
| `documentation/prds/mrp.md` PRQ-10 | States, accessibility, dependency destination | Amended 2026-10-20 (Q14A) before this Spec |
| [Issue #67](https://github.com/rafinel/scoops/issues/67) | Source | Updated 2026-10-20 with the absorbed dependency item (Q15B) and 2026-10-21 with the per-link price and the global Link removal |
| `documentation/features/mrp/global-accompaniments/spec.md`, `acompaniment-price/spec.md` | Reused global and price contracts | Contracts reused; the Portion-side locked-switch presentation is superseded by FR-20 (historical Specs not edited) |
| `documentation/architecture.md`, `documentation/modules.md` | MRP ownership, tenancy, atomic writes, events, backend authority | Confirmed |
| `documentation/design.md` + `design/onoreo.pen` | Tokens, tabs, chips, tables, dialogs, switch, pagination | Frames added 2026-10-20 (Q4); revision 5 deltas are in `design/handoff.md` pending a Pencil refresh (documented visual assumption) |
| `documentation/tooling.md` | Commands, mutation, Playwright CLI, coverage | Confirmed |
| `documentation/rules/database-layer-rules.md` | Migration generation, seeds | Migration generated from the shared schema; seed updated |
| `documentation/rules/provision-layer-rules.md` | PDV catalog adapter (`shared/provision`) | Adapter stays `indirect`: tested only through its consuming PDV suites |
| `documentation/rules/core-package-rules.md` | Use cases, strategies, structures | Confirmed after the FR-17 refactor, except the inherited `id` on the reused row projection (§3 Domain) and the four out-of-scope use-case-to-use-case dependencies listed in the exclusions (Q18) |
| `documentation/architecture.md` §18 | Pagination, N+1 | Unpaginated picker accepted (decision table); republishing N+1 removed by FR-17 |
| Rules: `code-conventions`, `use-case-testing`, `validation-package`, `rest-layer`, `controllers-testing`, `database-layer`, `messaging-layer`, `ui-layer`, `web-app-routing`, `widget-testing` | Respective layers | Confirmed |

| Revision | Date | Material change and reason |
| --- | --- | --- |
| 5 | 2026-10-21 | Global page loses `Vincular porções`; the Link dialog is individual-only and a "became global" 409 closes it with a status message (Q26A–Q29A; FR-04–FR-06, FR-09, FR-12, AC-04, AC-10, AC-13); FR-20 wording fixed. After the user reported that a row price edit changed every Portion, per-link/per-global sale price absorbed (Q30–Q38; FR-21, AC-23, AC-24; FR-03, FR-07, FR-08, FR-10, FR-17–FR-19; AC-06, AC-08, AC-09, AC-11, AC-17, AC-21): nullable price columns, migration with backfill, seed, PDV catalog adapter, default price rules. PRD, Issue #67 and handoff amended first; `.pen` frames pending. |
| 4 | 2026-10-20 | Q25 absorbed: Portion-side Edit of a global row and Link of a global candidate lose the locked switch (FR-20/AC-22), after the approved PRQ-08 amendment; `DyrWo` and `y7dXvq` updated. |
| 3 | 2026-10-20 | Q24: removed the `Disponível para todas as porções` switch from every dialog opened from the Porções tab (FR-05, FR-08–FR-10, FR-12, FR-16, FR-18; AC-09–AC-11, AC-15, AC-20), after the approved PRQ-08/Journey G amendment; design frames updated, `Ks7Gs` removed, two Porções-tab Edit frames added. |
| 2 | 2026-10-20 | Picker status copy `Ativo`/`Inativo`; Q23 hides `Tornar individual` for a global without rows. Added `Tornar global` (FR-18/AC-20) and `Tornar individual` (FR-19/AC-21) after Q19–Q22 and the approved PRQ-08 amendment; updated page actions, inactive matrix, locked help copy, DELETE query contract and design references. |
| 1 | 2026-10-20 | Initial contract from Issue #67, clarification Q1–Q18, the approved PRQ-10 amendment, the absorbed dependency navigation (FR-15) and the absorbed behavior-preserving republishing refactor (FR-17), with independent review corrections. |
