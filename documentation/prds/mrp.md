### 1. Overview

**MRP/Scoops Stock** is the operational area responsible for registering
products, organize brands, control balances, define recipes, register
productions and set up accompaniments.

The module connects the composition of products to available stock. From
a recipe and current balances, the manager can know how much he can produce,
which ingredients limit production and what is the operating cost of the recipe.

Quantities displayed in the current design use grams. The stock unit is
inherited by product-dependent data such as brands, recipes and sizes.

**Objective:** give the manager control and predictability over the cycle
`product → brand → recipe → production → stock`.

**Problem solved:** without an integrated vision, the lack of ingredients is only
perceived during production, causing delays and lost sales. It is also
difficult to understand how much a manufacturable product consumes and what its cost is
operational.

**Delivered value:** allows you to identify stock restrictions before production,
calculate COGS in real time, control brands and packaging, produce with low
atomic and keep products ready for sale at the POS.

**Users:** Manager manages products, brands, recipes, production and configurations.

**Multi-tenancy:** products, brands, recipes, productions and balances are isolated
by ice cream shop.

---

### 2. Requirements

#### REQ-01 Registration and Product Categories

- [ ] **Registration and Product Categories**

**Description:** The system must allow registering a product with one or more
categories, unit, stock control and status.

##### Business Rules

- **Name:** mandatory and unique within the ice cream shop.
- **Unit:** belongs to the product and is inherited by brands, recipes, sizes and
  dependent operations.
- **Available units:** the model can support `g`, `ml`, `kg`, `l` and `un`,
  but the examples and current design must use grams.
- **Control:** the product can use `Single stock` or `By brand`.
- **Default:** new products start with `Single stock`.
- **Categories:** `Ingredient`, `Manufacturable`, `Portion`, `Side dish` and
  `Resale`.
- **Portion and Resale:** are mutually exclusive.
- **Manufacturable:** enables recipe and production, but does not make the product salable
  alone.
- **Portion:** represents the fractional sale of a bulk stock and requires at least
  one less size to appear in the POS.
- **Accompaniment:** represents a product that can be linked to a Portion.
- **Resale:** represents sale in entire packaging.
- **Combinations:** Manufacturable + Portion is allowed; Manufacturable without Portion can
  be produced without appearing in the POS; Accompaniment + Portion or Resale is
  allowed.
- **Status:** inactive product remains registered, but does not appear in operations
  new ones.
- **Ideal stock:** optional; when completed, allows you to classify the stock
  as Normal or Low.
- **Internal notes:** free text visible only to authorized users
  by the Auth module.
- **Single-stock current unit cost:** an Ingredient product with `Single stock`
  can keep its current acquisition cost per base unit. The value is optional while
  registering the product, but must be defined before that product can be added to a
  recipe.
- **Cost maintenance:** the manager may define or replace the current unit cost during
  product registration, in product settings or while registering a positive stock entry.
  The latest explicitly informed value applies to future recipe and production
  calculations; it does not recalculate historical transactions or productions.
- **Cost validation:** a supplied current unit cost must be greater than or equal to zero.
  It does not use weighted-average costing in this version.
- **Negative stock:** products do not allow negative stock by default. Managers
  may enable the product-level `Allow negative stock` option; when enabled,
  write-offs may take that product's balance below zero.
- **Multi-tenancy:** no products from another ice cream shop can be displayed or
  used.

##### UI/UX rules

- **Registration modal:** must contain Name, Unit, Categories and Stock Control;
  when the product is an Ingredient with `Single stock`, it may also capture the
  current unit cost.
- **Categories:** must be selectable cards with checkbox and indication of
  dependencies.
- **Portion × Resale Exclusion:** when selecting one, the other must remain
  disabled with explanation.
- **Manufacturable:** when selected, the control must be locked in Stock
  single, if this is the current rule of the operating model.
- **Inline validation:** errors must appear next to the corresponding field.
- **Post-registration:** after creating, the system must open the dedicated page of
  product.
- **Unit:** Weight products design must display quantities in grams,
  without visually switching between grams and kilograms.

---

#### REQ-02 Brand Management and Main Brand

- [ ] **Brand Management and Main Brand**

**Description:** Products with stock by brand must allow brands to be registered,
control your balances and define the main brand used in automatic write-offs.

##### Business Rules

- **Application:** brands only exist on products with `By brand` control.
- **Fields:** Name, Package quantity, Value per package and Stock
  current.
- **Inherited unit:** the brand does not define its own unit; use the unit
  parent product.
- **Packaging quantity:** must be greater than zero and represents the quantity
  of base unit contained in a package.
- **Stock:** is stored in the product's base unit.
- **Input per package:** `quantity_of_packaging × quantity_of_packaging`.
- **Input by unit:** the manager can also inform directly the
  quantity in base unit.
- **Unit price:** calculated by
  `value_per_package ÷ quantity_of_package`.
- **Main brand:** as long as there are brands registered, there must be one
  main brand for automatic write-offs without explicit choice.
- **One active main:** the product maintains a single main brand at a time.
- **First brand:** when registering the first brand, it is defined
  automatically as main.
- **Exchange:** the new brand will only be used in future operations.
- **Exclusion of the main one:** if there are other brands, one of them must be defined
  as primary before deletion. If it is the latter, the deletion may occur with
  notice and the product is unavailable until it receives a new master brand.
- **Names:** There cannot be two brands with the same name on the product.
- **Exclusion:** brands are deleted after confirmation and notice of impacts.
- **Dependencies:** the exclusion must inform recipes, links and configurations
  which will be deleted together.
- **Cost of goods sold:** changes in brand value recalculate the COGS of
  recipes that use the corresponding main product or brand.

##### UI/UX rules

- **Brand table:** must display Brand, Packaging, Value/packaging, Price
  unit, Stock and Movements.
- **Main chip:** the main brand must display the `Main` chip.
- **Switch:** each brand must have a switch to define it as main.
- **Action menu:** must contain Edit brand, Set as main and Delete
  brand.
- **Exclusion:** must open confirmation dialog with the brand name and
  known impacts.
- **Empty state:** should display `Add first tag`.
- **Input:** the modal must allow switching between Packaging and Base Unit.
- **Preview:** when informing packaging, show the total converted into grams as
  supporting text.

---

#### REQ-03 Inventory Control and Adjustment

- [ ] **Inventory Control and Adjustment**

**Description:** The system must display the current balance, allow entries and write-offs
manuals and prevent any operation that results in negative stock unless the product's
negative-stock option is enabled.

##### Business Rules

- **Single stock:** the balance belongs directly to the product.
- **By brand:** total stock is the sum of brand balances.
- **Input:** adds positive quantity to the selected product or brand.
- **Single-stock input cost:** a positive entry for an Ingredient with `Single stock`
  may also define the current unit cost that applies from that operation onward.
- **Manual write-off:** removes a positive quantity from the selected product or brand.
- **Adjustment:** every manual change must be treated as entry or write-off.
- **Minimum balance:** no write-off can result in a balance less than zero unless
  the product's `Allow negative stock` option is enabled.
- **Validation:** mandatory quantity and greater than zero.
- **Unit:** adjustment quantity must use the base unit of the product.
- **Production:** increases Fabricable stock after lowering its
  ingredients.
- **Sales:** the POS is responsible for downloading products, accompaniments and
  Resales according to the POS PRD.
- **Main brand:** production and other automatic write-offs without explicit selection
  use the main brand.
- **Availability update:** entries and write-offs recalculate total stock,
  production situation and capacity.
- **Cost update:** changing a Single-stock Ingredient's current unit cost recalculates
  the COGS of dependent recipes without rewriting historical transactions or
  productions.
- **Stock transaction:** every committed stock change must create an immutable
  stock-transaction record in the same database transaction as the balance
  change.
- **Transaction types:** this version records manual `Entry` and manual
  `Write-off`. Production and Sales own their respective transaction records
  when those flows are implemented.
- **Initial stock:** a positive stock supplied while registering a product or
  brand is recorded as an `Entry`; zero creates no transaction.
- **Historical facts:** the record keeps the product, optional brand, unit,
  quantity, resulting balance, responsible-user identity and captured display
  name, and occurrence time needed to explain the committed change. Product,
  brand and author labels are snapshotted so a later configuration change or
  deletion does not rewrite history.
- **Publication:** recording a stock transaction is local persistence and does
  not require publishing a domain event, broker message or outbox entry.
- **Multi-tenancy:** transactions are isolated by ice cream shop and can only be
  read with the same establishment authorization as their product.

##### UI/UX rules

- **Summary:** must display Current stock, Ideal stock and Situation.
- **Normal Situation:** when the total balance is greater than or equal to the ideal stock.
- **Low Situation:** when the total balance is less than the ideal stock.
- **No ideal stock:** display Normal situation without target comparison.
- **Actions:** Entry and Write-off must be close to the corresponding balance.
- **Single-stock entry cost:** the entry flow for an Ingredient with `Single stock`
  may capture the current unit cost and must show its base-unit suffix.
- **Insufficiency:** the confirmation button must be blocked when the
  amount exceeds balance.
- **Message:** inform available quantity and requested quantity.
- **Zero:** zero balance must be displayed as valid status, not as absence of
  registration.
- **Movement history:** the Stock tab must show committed transactions newest
  first, with type, brand and date-period filters and paginated results.
- **Author:** each history row must identify the responsible user by the display
  name captured when the transaction committed.
- **Author avatar:** show the responsible user's initials in a compact avatar.
  Choose its accessible semantic color pair deterministically from the captured
  author name so the same normalized name always receives the same color; color
  is supportive and never replaces the visible name.
- **History states:** loading, empty, filter-without-results and error/retry must
  be distinguishable without hiding the current balance.

---

#### REQ-04 Product Listing

- [ ] **Product List**

**Description:** The Products screen must allow consulting, filtering, ordering and
  open registered products.

##### Business Rules

- **Filters:** category, stock status and product status.
- **Combined filters:** different sections use AND; multiple categories use
  OR each other.
- **Search:** filters by name.
- **Order:** Name, Stock quantity, Number of brands, Categories and
  Unit.
- **Pagination:** the listing must be paginated.
- **KPIs:** summary cards are establishment-wide operational totals and must not change when search, filters, sorting, or pagination alter the product list.
- **Operational Cards:** can display Products, Brands, Low Stock and Products
  with limited production.
- **Value in stock:** should not appear as a KPI in this module; belongs to a
  financial view of costs, profits and movements.
- **Low stock:** uses comparison with ideal stock.
- **Empty state:** must differentiate absence of products from filters without
  results.

##### UI/UX rules

- **Table:** must occupy all available space below the filters.
- **Filters:** must remain in the position defined by the approved layout and not
  compete for horizontal space with the table.
- **Columns:** Name, Stock quantity, Number of brands, Categories and
  Unit, in addition to the necessary actions.
- **Low line:** can use alert background, red indicator and text
  explanatory.
- **Search:** must have an icon and contextual placeholder.
- **Clear:** must remove all active filters.
- **Empty status without products:** CTA `Register first product`.
- **Empty state with filters:** `No products found` message and CTA
  `Clear filters`.

---

#### REQ-05 Dedicated Page and Product Settings

- [ ] **Dedicated Page and Product Settings**

**Description:** Each product must have a dedicated page with tabs and sections
  conditionals by category.

##### Business Rules

- **Stock Tab:** always available.
- **Recipe Tab:** available for Manufacturable.
- **Accompaniments Tab:** available for Portion.
- **Prices Tab — Sizes:** available for Portion; business data is
  consumed by the POS.
- **Prices Tab — Resale:** available for Resale; business data is
  consumed by the POS.
- **Settings Tab:** always available.
- **Categories in use:** cannot be removed without resolving their
  dependencies.
- **Unit change:** affects brands, recipes, sizes, consumption and
  product-dependent operations.
- **Unit warning:** any unit change should display a dialog with
  impacts before confirmation.
- **Conversion:** there is no automatic conversion between g↔kg or ml↔l in this version.
- **Product deletion:** deletes the product and its dependent data after notice and
  confirmation, including brands, recipe, sizes, links and settings
  sale.
- **External dependencies:** products from other registrations remain intact,
  but links to the deleted product are removed.

##### UI/UX rules

- **Header:** should display name, unit, status, category chips and actions
  Edit and Remove.
- **Breadcrumb:** `Stock > Products > [Product name]`.
- **Tabs:** should only appear when enabled by the category.
- **Settings:** must contain Basic Information, Stock Control,
  Categories, Internal Observations and Danger Zone.
- **Unit:** the dialogue must explain that the unit is shared by brands,
  recipes, sizes and movements.
- **Deletion:** the destructive dialog must list what will be deleted.
- **Saving:** simple fields can save when losing focus, as per standard
  module design.

---

#### REQ-06 Manufacturable Product Recipes

- [ ] **Manufacturable Product Recipes**

**Description:** A recipe must define the ingredients needed to produce
  a reference quantity of a Manufacturable product.

##### Business Rules

- **One recipe:** each Manufacturable has a single recipe in this version.
- **Reference income:** the manager defines the base quantity of the recipe,
  always in the unit of the manufacturable product.
- **Recipe creation:** a Manufacturable starts without a persisted recipe. The manager
  creates its empty recipe by explicitly saving a positive reference yield; opening the
  Recipe tab must not write data implicitly.
- **Empty recipe lifecycle:** ingredients cannot be added until the positive reference
  yield has been saved. Removing the last ingredient retains the recipe and its reference
  yield so the manager can add another ingredient without recreating the recipe.
- **Eligible ingredient:** only products with the Ingredient category can
  enter the recipe.
- **Accompaniment:** cannot be used as a recipe ingredient.
- **Line fields:** product ingredient, quantity and inherited unit.
- **Unit:** the quantity of the ingredient uses the same stock unit as the
  ingredient; the current design presents values ​​in grams.
- **Brand:** when the ingredient is stocked by brand, the recipe uses the brand
  main force in force at the time of production.
- **Brand displayed:** the table must identify which main brand will be used.
- **No main brand:** production is blocked until a main brand
  be defined.
- **Quantity:** each quantity must be greater than zero.
- **Duplicate combinations:** the same ingredient combination cannot appear twice.
- **COGS:** ingredient cost is calculated using the current unit price.
- **Single-stock COGS:** an Ingredient with `Single stock` uses the product's current
  unit cost and cannot be added to a recipe while that cost is undefined.
- **Total COGS:** sum of the costs of all lines for income
  reference.
- **Unit cost:** for Manufacturable, it is calculated by
  `Total COGS ÷ Reference Yield`.
- **Producible maximum:** is the lowest limit calculated among all ingredients.
- **Update:** changes in recipe, brand or stock entry recalculate
  COGS and production capacity.
- **Ingredient removal:** only removes the line from the recipe.

##### UI/UX rules

- **Header:** must display the editable positive reference yield and Produce action.
- **Table:** must display Input, Source/Brand, Quantity, Cost, % of COGS,
  Stock and Movements.
- **Units:** the design must use grams in quantities and projections.
- **Source:** display chip of the main brand when stock is by brand.
- **Sufficient stock:** show current balance and estimated capacity.
- **Limiting input:** highlight the line with alert icon and background.
- **Insufficient input:** the line itself must show necessary, available and
  missing; do not rely on a separate list.
- **Add:** `Add ingredient` button must insert or open the new
  line configuration.
- **Delete:** must require confirmation and inform that CMV and capacity will be
  recalculated.
- **Empty state:** keep the reference-yield control visible, guide the manager to save a
  positive yield and add the first ingredient, and disable ingredient creation until the
  yield is persisted.

---

#### REQ-07 Production Record

- [ ] **Production Record**

**Description:** The manager must record the production of a Manufacturable,
  consuming the ingredients and adding the produced product to stock.

##### Business Rules

- **Access:** Produce action is available to the manager in the recipe or
  Manufacturable product. Operators cannot read, preview or register production in
  this version.
- **Modes:** the manager can inform production by Batch or by Quantity.
- **Switch:** the change between modes is made by a switch.
- **Lot:** exactly represents the reference yield of the recipe.
- **Quantity:** must be informed in the product unit; the current design uses
  grams.
- **Synchronization:** changing batches updates the quantity and changing quantity
  updates batches when there is equivalence.
- **Consumption:**
  `quantity_of_ingredient × (quantity_produced ÷ reference_yield)`.
- **Projection:** must calculate consumption, current stock and stock after production for
  each main ingredient or brand.
- **Insufficiency:** if any ingredient is insufficient, confirmation is blocked unless
  that ingredient product allows negative stock.
- **Low:** occurs in the ingredient product or in the main brand, depending on the
  stock control.
- **Input:** the quantity produced is added to the Fabricable stock.
- **Side dishes:** are not consumed in production.
- **Cost:** production cost can be calculated by COGS multiplied by
  number of lots; stock value and profit belong to the financial module.
- **Atomic:** ingredient write-off and Manufacture input must occur at
  same transaction.
- **Failure:** If any operation fails, no changes remain.
- **Negative stock:** never allow confirmation that generates a negative balance unless
  the affected product allows negative stock.

##### UI/UX rules

- **Modal:** must display product, yield and Lot/Quantity switch.
- **Batch:** show the batch field and, below it, the textual preview of the
  equivalent quantity, such as `Equivalent to 2,000 g`.
- **Quantity:** show input with suffix `g`.
- **Layout:** mode and input controls must be arranged side by side
  when there is space.
- **Shortcuts:** There may be `1 batch`, `2 batches` and `Maximum` options.
- **Projection table:** must display Input/Brand, Consumption, Current and After.
- **Insufficient line:** should turn red and show needed, available and
  missing from the table itself.
- **Button:** `Confirm production` must be disabled when there is a shortage.
- **Success:** close the modal, update stocks and confirm production.
- **Failed:** maintain the context, inform that no changes were applied and
  allow retry.

---

#### REQ-08 Accompaniments and Types of Accompaniment

- [ ] **Accompaniments and Types of Accompaniment**

**Description:** The manager must configure which Accompaniment products can be
  offered in each Portion.

##### Business Rules

- **Link:** a Portion may have zero or more accompaniments.
- **Multiple use:** a Side dish can be linked to multiple Portions.
- **Eligible product:** only the Accompaniment category can be linked.
- **Type:** each bond has a type, such as Coverage, Extra or Free.
- **Contextual type:** the type may vary between Portion products.
- **Type catalog:** accompaniment types are managed in a dedicated MRP page and
  are available to links within the same ice cream shop.
- **Type management:** the manager can list and create types; an unused type can
  be removed, while a type in use remains protected until its links are resolved.
- **Quantity per portion:** defines consumption in each unit sold.
- **Price:** is configured by the combination of product + size + accompaniment and
  belongs to the POS commercial flow.
- **Brand:** consumption uses the main brand of the accompaniment when stock
  It's by brand.
- **Removal:** deleting the link does not change current balances.
- **Type in use:** a type used in links cannot be deleted without the
  links are resolved.

##### UI/UX rules

- **Table:** must display Accompaniment, Type, Brand, Quantity per serving and
  Actions.
- **Link:** `Link accompaniment` button must open modal.
- **Modal:** Accompaniment, Type, Quantity per serving and preview fields
  cost; mark appears when applicable.
- **Main brand:** display the main brand used in the registration.
- **Price:** can be displayed by size, but the commercial configuration must
  remain consistent with the POS PRD.
- **Types:** the dropdown must offer a `Manage types` link that navigates to the
  dedicated `Accompaniment types` page.
- **Types page:** must display registered types, usage status and removal only
  for unused types, with a `New type` action that opens the creation modal.
- **Types pagination:** when registered types exceed one page, the types table
  must display the visible range and total count, with previous, next and
  numbered-page controls.
- **Type editing:** each row must provide an edit action that opens a modal with
  the current name prefilled; saving renames the type across its existing
  accompaniment links, while duplicate or invalid names preserve the entered
  context and display validation without closing the modal.
- **Type creation modal:** must contain the type name, supporting guidance,
  `Cancel` and `Add type`; successful creation closes the modal and refreshes
  the list, while validation errors preserve the entered context.
- **Sidebar:** `Accompaniment types` must appear as a top-level destination after
  `Products`; the page marks that item as active.
- **Optional monitoring:** no component should require the creation of a
  accompaniment to a Portion.
- **Exclusion:** removal of the link requires confirmation.

---

#### REQ-09 Integrated Commercial Settings

- [ ] **Integrated Business Settings**

**Description:** The product page must present the necessary settings
  so that the POS uses sizes and Resales, without duplicating the sales logic.

##### Business Rules

- **Portion:** each size has a name, quantity in stock unit, price
  sales and status.
- **Mandatory:** every salable portion must be at least one size
  active.
- **Resale:** has sales price, packaging quantity and availability.
- **Resale by brand:** each brand may have its own price and availability.
- **Accompaniment:** the price is specific to product + size + accompaniment.
- **Update:** changes do not modify previous orders.
- **Responsibility:** calculation rules, cart, sales write-off and history
  of orders belong to the POS PRD.

##### UI/UX rules

- **Conditional tabs:** Prices — Sizes appear only for Portion; Prices —
  Resale appears only for Resale.
- **Sizes:** table must display Name, Quantity, Operating Cost, Price,
  Profit/Margin when the financial module is available and Movements.
- **Financial:** the total value in stock, profits and financial reports
  must be presented as MRP KPI.
- **Status:** sizes and brands must allow activation and deactivation without deleting
  settings automatically.
- **POS:** products without active commercial configuration do not appear in the POS.

---

#### REQ-10 Navigation, States and Confirmations

- [ ] **Navigation, Status and Confirmations**

**Description:** MRP must offer consistent navigation, clear statuses and
  commits for destructive or high-impact changes.

##### Business Rules

- **Main navigation:** Dashboard, Products, Accompaniment Types, POS, Order
  History and Price Modifiers.
- **No sub-buttons:** the main navigation should not create unnecessary sub-navigation.
- **Product:** opening the Details line or action takes you to the dedicated page.
- **Categories in use:** removal attempt must be blocked until resolved
  dependencies.
- **Exclusions:** products, brands, ingredients, accompaniments and sizes are
  deleted after notice and confirmation.
- **Danger zone:** must list what will be deleted before confirmation.
- **Authentication:** profiles, permissions and users belong to the Auth module.
- **Unit:** unit change requires warning dialog before saving.

##### UI/UX rules

- **Breadcrumb:** maintain the `Stock > Products > Product` context.
- **Loading states:** search, rescue, calculation and production must have
  visual feedback.
- **Empty state:** each table must guide the next action.
- **Unit Dialog:** inform that the unit is shared by brands,
  dependent recipes, sizes and operations.
- **Delete Dialog:** use clear destructive language, with Cancel and
  Remove.
- **Responsiveness:** tables, cards and modals cannot overlap or cut
  content on smaller screens.
- **Visual consistency:** use the components, tokens and icons defined in the guide
  of design.

---

### 3. User Flow

**Flow A - User consults Products**

1. The user accesses `Products`.
2. The system displays operational cards, filters, search and tables.
3. The user filters by category, stock or status.
4. The system applies combined filters and recalculates the cards.
5. User sorts by Name, Stock quantity, Number of brands,
   Categories or Unit.
6. The user opens `Details` of a product.
7. The system opens the dedicated page in the Stock tab.

**Flow B - User registers product**

1. The manager clicks on `New Product`.
2. The system displays Name, Unit, Categories and Inventory control; a Single-stock
   Ingredient may also receive its current unit cost.
3. The manager fills in the fields.
4. The system validates:
   - **Success:** creates the active product with zero balance and opens its page.
   - **Duplicate name:** informs that the name already exists.
   - **No unit:** requests a unit.
   - **No category:** requests at least one category.
5. The manager configures brands, recipe or prices after registration.

**Flow C - Manager manages brands**

1. The manager opens a product with `By Brand` control.
2. Click on `Link brand`.
3. Enters the name, packaging quantity, packaging value and initial stock.
4. The system calculates the unit price and updates the total stock.
5. The first mark automatically receives the `Main` chip.
6. To change the main one, the manager uses the new brand switch.
7. To delete, open the actions menu and confirm the dialog.
8. The system recalculates the dependent data.

**Flow D - Manager adjusts stock**

1. The manager opens the Inventory tab.
2. Choose Entry or Low.
3. If there is a brand, choose the balance of the corresponding brand.
4. Select Packaging or Base Unit.
5. Enter the quantity and, for a Single-stock Ingredient, optionally replace the
   current unit cost.
6. The system displays the total in grams.
7. The system validates:
   - **Valid entry:** adds to the balance.
   - **Valid write-off:** subtracts from the balance.
   - **Write-off greater than balance:** blocks and informs the available quantity.
8. The system recalculates production status and capacity.

**Flow E - Manager assembles recipe**

1. The manager opens a Manufacturable product and accesses Recipe.
2. Sets and explicitly saves the positive reference yield in grams, creating the empty
   recipe without writing data merely by opening the tab.
3. Adds an Ingredient after the yield save succeeds.
4. Select the quantity; the unit is inherited.
5. If the ingredient is by brand, the system shows the main brand.
6. The system calculates cost, COGS percentage, balance and capacity.
7. The manager saves the line.
8. The system updates COGS and maximum producible quantity.

**Flow F - Manager records production**

1. The manager clicks `Produce`.
2. The system opens the modal with the Lot/Quantity switch.
3. The manager enters batches or quantity in grams.
4. The system shows the equivalent preview and projection table.
5. If any ingredient is insufficient, the line itself shows necessary,
   available and missing; confirm is blocked.
6. If there is sufficient balance, the user confirms.
7. The system downloads the ingredients and adds the product produced in the same
   transaction.
8. If successful, refresh the page and close the modal.
9. On failure, no changes remain.

**Flow G - Manager configures accompaniments**

1. The manager opens a Portion product.
2. Access Accompaniments and click on `Link accompaniment`.
3. Select product, type, quantity per serving and, when applicable, brand.
4. Configure the price per product + size + accompaniment in the commercial section.
5. The system displays the expected cost and saves the link.
6. Accompaniment is available at the POS only for active sizes
   configured.

**Flow H - Manager changes unit**

1. The manager goes to Settings and changes the unit.
2. The system opens a warning dialog.
3. The dialog tells you which dependent brands, recipes, sizes, and operations use
   the product unit.
4. The manager cancels or confirms.
5. If confirmed, the system saves the new unit according to the conversion rules
   in force and signals values that require review.

**Flow I - Manager removes product**

1. The manager clicks `Remove`.
2. The system lists brands, recipes, sizes, accompaniments and configurations that
   will be deleted.
3. The manager cancels or confirms.
4. Upon confirmation, the system deletes the product and its dependent data.
5. Products and brands from other registrations remain intact.

---

### 4. Out of Scope

- POS, cart, sales processing and order history.
- Price modifiers.
- Payment methods, cash, change and reconciliation.
- Total value in stock, profit, margin and financial reports.
- Physical inventory.
- Batches and validity.
- Losses and waste.
- Administrative stock-audit export, reconciliation and correction workflows.
- Automatic minimum stock notifications by email, SMS or push.
- Purchase orders and estimated arrival.
- Brands shared between products.
- Multiple recipes for the same manufacturable product.
- Automatic conversion between g↔kg or ml↔l.
- Multi-store and multiple operational units.
- Authentication, users, profiles and permissions.
- Billing, plans and subscriptions.
- Management dashboard and BI.
- Automatic composition of cups, lids, spoons and disposables.
- Monitoring of resale products.
- Type `Base` as accompaniment; the Portion is already the basis of the order.

#### Discarded during definition

- **Stock value in MRP:** removed; costs, profits and movements
  Financial data belongs to a financial view.
- **Physical stock, batches and expiration date:** removed from the scope of this version.
- **Administrative stock audit:** export, reconciliation and correction remain
  outside this version; the module maintains
  only the operational data necessary to produce.
- **Portion not sized:** discarded; every salable Portion needs at least
  one size.
- **Mandatory monitoring:** discarded; a Portion may be sold without
  accompaniment.
- **Permanent fixed brand on the recipe:** replaced by the current main brand
  for automatic write-offs by brand.
- **Global accompaniment price:** replaced by price per product +
  size + accompaniment.
- **Mixed visual unit:** current design maintains weight amounts in
  grams.
