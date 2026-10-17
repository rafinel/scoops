# Design System — Scoops

> Ice Cream · Açaí · Frozen Treats

Scoops Product Design Guide. Aligns tokens, components and screen patterns for consistency between modules (Auth, Inventory, Sales, BI, Billing).

Sources: Global CSS of the app, reference **Purple Stream** and screens drawn with Pencil.

---

## 1. Principles

- **Protagonist numbers.** Large, heavy metrics (700–800) in black on neutral backgrounds. Color is used to reinforce semantics (green = good, red = alert), not to decorate.
- **Cards with high radius and subtle shadow.** `border-radius: 16px`, light shadow to separate without competing. Zero visual noise.
- **Purple is the brand, not the background.** Purple appears in identity elements (logo, primary button, active tab, selected menu item). Main surfaces are white and light gray.
- **Sidebar as stable navigation.** Light background, icons + text, expandable groupings, active item in lilac pill.
- **Real-time calculations, immediate visual alerts.** Critical states (production limiter, sub-optimal stock) are communicated by background color and icon, not just by text.
- **Forms save when losing focus.** Product settings do not have a "Save" button. Each field saves inline. Buttons only exist in destructive or irreversible actions.
- **Lucide-only icons.** No other libraries or emojis.
- **Dialog icons always stay beside the title.** Every dialog uses a two-column header with its semantic icon tile to the left of the title and supporting description; never stack the icon above the copy.

---

## 2. Tokens

### Colors

**Primaries**
| Token | Hex | Usage |
|---|---|---|
| `$primary` | `#6D28F5` | Tag, primary button, active tab, selected item |
| `$primary-soft` | `#EDE9FE` | Active tab background, highlight badge, calculation preview |

**Surfaces and text**
| Token | Hex | Usage |
|---|---|---|
| `$bg-page` | `#F7F7F8` | Content area background (not sidebar/header) |
| `$bg-card` | `#FFFFFF` | Cards, header, sidebar, modals |
| `$bg-muted` | `#F9FAFB` | Table background header, suffix/prefix fields, neutral preview blocks |
| `$border` | `#E5E7EB` | Card borders, input, button outline |
| `$border-soft` | `#F3F4F6` | Row separators in table |
| `$text-primary` | `#111827` | Main text |
| `$text-secondary` | `#6B7280` | Labels, subtitles, supporting text |
| `$text-tertiary` | `#9CA3AF` | Placeholders, hints, decorative separators |

**Semantics — success**
| Token | Hex | Usage |
|---|---|---|
| `$success` | `#166534` | Text/icon on dark positive badges and statuses |
| `$success-soft` | `#DCFCE7` | "Active" status badge background |
| `$success-vivid` | `#059669` / `#10B981` | Leading positive numbers (margin, "stock allows", "product stock after production") |

**Semantics — attention**
| Token | Hex | Usage |
|---|---|---|
| `$warning` | `#92400E` | Label text on soft alert cards |
| `$warning-vivid` | `#B45309` | Featured values ​​on soft alert cards (e.g. limited "Maximum Producible") |
| `$warning-soft` | `#FEF3C7` | Attention badge/card background |

**Semantics — danger**
| Token | Hex | Usage |
|---|---|---|
| `$danger` | `#B91C1C` / `#991B1B` | Text and icons in error alerts |
| `$danger-vivid` | `#DC2626` | Full destructive button |
| `$danger-soft` | `#FEE2E2` | Destructive dialog icon |
| `$danger-bg` | `#FEF2F2` | Red line background in recipe table (insufficient stock) |

**Semantics — info**
| Token | Hex | Usage |
|---|---|---|
| `$info` | `#1E40AF` | Chip text category Ingredient, badge Manual Entry |
| `$info-soft` | `#DBEAFE` | Background thereof |

### Typography

**Family:** `Manrope`, with fallback `"Segoe UI", system-ui, sans-serif`.

**Weights used:** 500, 600, 700, 800, 900.

**Scale**
| Usage | Size | Weight |
|---|---|---|
| Page Title / Product Name | 24 | 700 |
| Card/section title | 18 | 700 |
| Modal title | 20 | 800 |
| Large Metric Value | 22–34 | 700–800 |
| Standard body | 14 | 400–700 |
| Field label / subtitle | 13 | 600 (label) / 400 (subtitle) |
| Table header (uppercase) | 11 | 600, letter-spacing 0.5 |
| Hint/caption/breadcrumb | 12–13 | 500 |

"Scoops" logo is italic, weight 900, color `$primary`.

Tagline below the logo in uppercase, weight 800, letter-spacing 1.2–1.5, color `$text-secondary`.

### Radius

| Token | Value | Usage |
|---|---|---|
| `$radius-sm` | 6px | Small buttons in table (Edit, Remove, pagination) |
| `$radius-md` | 8–10px | Primary/outline buttons, pill tabs, inputs, tab badges |
| `$radius-lg` | 12px | Internal table cards, preview inputs, alert badges |
| `$radius-xl` | 16px | Main cards, modals |
| `$radius-full` | 999px | Chips, rounded badges, switch, circular icons |

### Shadows

| Usage | Value |
|---|---|
| Main Card | `0 1px 3px rgba(0,0,0,0.05)` |
| Active tab card | `0 1px 2px rgba(0,0,0,0.06)` |
| Primary button | `0 8px 20px rgba(109, 40, 217, 0.25)` |
| Destructive Button | `0 8px 20px rgba(220, 38, 38, 0.25)` |
| Modal/dialog | `0 20px 50px rgba(0,0,0,0.20)` |

### Spacing

Gap/padding scale: 4, 6, 8, 12, 14, 16, 20, 24, 32.

- Main card interior: 24.
- Gap between stacked sections: 20.
- Side content padding (within the Content area): 32.
- Vertical table row padding: 12–14.

---

## 3. Components

### Sidebar

**Structure:**
- Vertical frame, width 280px, fill height, `$bg-card`, right border `$border`.
- Padding 20px side, 28 top, 24 bottom, gap 28 between sections.

**Brand on top:**
- Mark square 40×40, `$primary`, radius 10, white `ice-cream-cone` icon 22px.
- "Scoops" text on the side (20/900, italics, `$primary`) + tagline below (9/800 uppercase, `$text-secondary`).

**Default item nav:**
- Horizontal frame, padding 10×14, gap 12, radius 10.
- Lucide 18×18 icon + 14/800 text `$text-primary`.

**Nav selected item:**
- Background `$primary-soft`, icon and text in `$primary` (weight 900 in text).
- If it is an expandable group: chevron on the right, size 16.

**Expandable group:**
- Header (default item) + Subnav when opened.
- Subnav with padding-left 26 and dot (ellipse 6×6) before each child item.
- Active child: point and text in `$primary`. Inactive child: `$text-tertiary` / `$text-secondary`.

**Footers:**
- `border-top 1px $border-soft` separator.
- User and Subscription Items (same pattern as nav items).

### Header

**Structure:**
- Horizontal frame, height 72, padding 16 top/bottom + 24 side.
- `$bg-card` with bottom border 1px `$border`.

**Search bar (left):**
- Horizontal frame, width ~320, padding 10×16, `$bg-card`, border 1px `$border`, radius 12.
- `search` icon 16px + placeholder 14/500 `$text-tertiary`.

**User card (right):**
- Horizontal frame, padding 8×14×8×8, gap 10, `$bg-card`, border 1px `$border`, radius 12.
- Circular avatar 32×32 (background `$success-soft`, text `$success` 13/900).
- Name 14/800 + 14px gray `chevron-down` icon.

### Back navigation

- Use the shared `BackLink` component for page-level return navigation.
- Resting treatment is compact, borderless, and transparent: a 16px purple `chevron-left`
  followed by a purple `Voltar` label or contextual `Voltar para …` label.
- Preserve the visible focus ring for keyboard users; hover must not introduce a filled button
  surface.

### Main Cards

**Standard structure:**
- `$bg-card`, radius 16, padding 24, gap 16–20 between inner sections.
- Subtle shadow (see tokens).

**Card header:**
- Title 18/700 + counter in gray (14/500) when applicable.
- Subtitle 13/400 `$text-secondary`.
- Main button (e.g. "Link Brand") aligned to the right.

### Dialogs

- Use the shared `DialogHeader` or `AlertDialogHeader` two-column layout: keep the
  semantic icon tile in the first column and the title with its supporting
  description in the second column. The description sits directly below the
  title.
- Keep icon tiles fixed-size and top-aligned with the title. Keep the copy group
  shrinkable so long titles and localized descriptions wrap without pushing the
  icon out of alignment.
- Dialog headers have 24px padding, a soft bottom separator, and enough right
  padding for the close control. The close control stays at the top-right,
  separate from the title and description.
- Do not override the header to a single-column or vertical layout when it has a
  semantic icon. Alert and destructive dialogs use the same header structure;
  preserve their existing semantic icon and color.

### Card metrics

Three variations:

**Neutral**
- Background `$bg-muted`, padding 20, radius 16.
- Label 11/600 uppercase `$text-secondary`, letter-spacing 0.5.
- Value 22–34/800 `$text-primary`.
- Optional 12/500 `$text-secondary` detail below.

**Positive (success)**
- `$bg-muted` background, same layout.
- Value in `$success-vivid`.

**Attention (limiter)**
- Background `$warning-soft`, label in `$warning`, value in `$warning-vivid`, detail in `$warning` 600.

### Primary button

**Default:**
- Padding 8×14, `$primary`, radius 10, gap 6, alignItems center.
- Optional 14×14 white icon on the left.
- Text 13/700 white.
- Translucent purple eyeshadow (see tokens).

**Usage:** main actions (Link Brand, Add Ingredient, Confirm Production, Save changes, Understood in blocking dialogs).

### Outline button

- Padding 10×20, `$bg-card`, border 1px `$border`, radius 10.
- Text 13/700 `$text-primary`.
- **Use:** Cancel in modals.

### Destructive button

**Full (irreversible action):**
- Padding 10×20, `$danger-vivid`, radius 10, `trash-2` icon white 14px + text 13/700 white.
- Translucent red eyeshadow.
- **Use:** "Remove product" button in the Danger Zone, final button in deletion confirmation dialogs.

**Outline (secondary):**
- `$bg-card`, 1px border `#FCA5A5`, `$danger` text 13/700, `trash-2` icon 14px.
- **Usage:** "Remove ingredient" in the left footer of the editing modal, "Remove" in the tables.

### Tabs in pill

**Container:**
- Horizontal frame, padding 4, gap 4, light gray background (`#F1F5F9`), radius 12.

**Inactive tab:**
- Padding 8×16, gap 8, default radius.
- Lucide icon 15×15 `$text-secondary` + label 14/600 `$text-secondary`.

**Active tab:**
- Background `$bg-card`, radius 8, subtle shadow.
- Icon and label in `$primary` (label 14/700).

### Category Chips

- Padding 4×10, radius 999, 1px border in highlight color + corresponding soft background.
- Text 12/600.

Mapping by category:
| Category | Icon | Background | Text/Border |
|---|---|---|---|
| Ingredient | `package-open` | `$category-ingredient-bg` (`#DBEAFE`) | `$category-ingredient` (`#1E40AF`) / `$category-ingredient-border` (`#93C5FD`) |
| Manufacturable | `chef-hat` | `$category-manufacturable-bg` (`#FFEDD5`) | `$category-manufacturable` (`#C2410C`) / `$category-manufacturable-border` (`#FDBA74`) |
| Portion | `ice-cream-bowl` | `$category-portion-bg` (`#EDE9FE`) | `$category-portion` (`#5B21B6`) / `$category-portion-border` (`#C4B5FD`) |
| Accompaniment | `candy` | `$category-accompaniment-bg` (`#FCE7F3`) | `$category-accompaniment` (`#BE185D`) / `$category-accompaniment-border` (`#F9A8D4`) |
| Resale | `shopping-bag` | `$category-resale-bg` (`#CCFBF1`) | `$category-resale` (`#0F766E`) / `$category-resale-border` (`#5EEAD4`) |

Category colors never reuse the status colors (success, warning and danger), so
red, green and amber keep their status meaning.

"Active" status chip: same default in `$success-soft` / `$success` / `#86EFAC`.

### Type badge (in movement table)

Chip pattern, slightly larger. Mapping:
| Type | Background | Text |
|---|---|---|
| Manual Entry | `$info-soft` | `$info` |
| Production | `$primary-soft` | `#5B21B6` |
| Sale | `$warning-soft` | `$warning` |
| Manual Download | `$danger-soft` | `$danger` |

### Default text input

- Horizontal frame, `$bg-card`, 1px border `$border`, radius 10.
- 12×14 internal padding.
- Text 14/700 `$text-primary`.
- Focus uses one continuous 2px `$ring` treatment at 20% opacity plus `$ring` border, owned by
  the input primitive or composite wrapper. Never stack a global outline over the component
  border/ring or introduce page-level focus-color overrides.

### Input with prefix/suffix

- Prefix/Suffix: padding 12×14, background `$bg-muted`, vertical separation border `$border`, radius only in the outer corners.
- Prefix/suffix text: 14/800 `$text-secondary`.
- Used for R$, kg, ml, un, g.
- Composite fields render one continuous focus border and soft ring around the complete control.
  Prefixes, suffixes, inline labels and native date segments must not create a second outline or
  colored internal divider; retain native segment highlighting only as the precise editing cue.

### Dropdown (select)

- Same base as the input.
- Value + icon `chevron-down` 14 `$text-secondary` right-aligned.
- When disabled (e.g. field locked in Edit): background `$bg-muted`, `lock` icon 14 `$text-tertiary` to the left of the value, text in `$text-secondary`.

### Textarea

- Input base, but vertical layout, padding 14, fixed height (ex: 104px).
- Internal text 14/500.

###Switch

- Frame 44×24, radius 999.
- On state: `$success-vivid` background, 18×18 white dot aligned to the right.
- Off state: background `$border`, dot aligned left.

### Switch as "field"

- Row horizontal, padding 12×14, gap 12, `$bg-card`, border 1px `$border`, radius 10.
- Switch on the left + label 14/700 `$text-primary` on the right.
- Used for "Active Product" and "Allow Negative Stock" Status.

### Table

**Header:**
- Horizontal frame, `$bg-muted` background, 12×16–20 padding.
- Each cell with text 11/600 uppercase `$text-secondary`, letter-spacing 0.5.

**Line:**
- Padding 14×16–20, alignItems center.
- `border-top 1px $border-soft` separator from the second line.

**Alert line (e.g. insufficient ingredient):**
- Background `$danger-bg`.
- `triangle-alert` icon 14 `$danger` + value text in `$danger`.
- Subtext (e.g. "Only 4,000 ml — limits production") in `$danger` 11/500.

**Table container:**
- Border 1px `$border-soft`, radius 12, clip.

### Inline actions (table)

Small buttons, padding 6×10, gap 4, radius 6, border 1px.

- **Input:** border + `arrow-down` icon + green text (`#10B981`).
- **Low:** border + `arrow-up` icon + orange text (`#F59E0B`).
- **Edit:** border `$border`, icon `pencil` + text `$text-secondary`.
- **Remove:** border `#FCA5A5`, icon `trash-2` + text `$danger`.
- **Plus:** `ellipsis` icon alone, same outline pattern.

All text 12/600.

### Pagination

- Horizontal frame, justify space between.
- Info on the left: "Showing 1-5 of 47" (13/400 `$text-secondary`).
- Page buttons on the right, 32×32, radius 6, text 13/500.
- Active button: `$primary`, white text 13/700, translucent purple shadow.

### Modal

**Container:**
- `$bg-card`, radius 16, large shadow (see tokens).
- Typical widths: 440 (simple dialog), 520 (standard form), 640 (production with projection).

**Header:**
- Padding 24 on all sides, with 56px reserved on the right for the close action.
- The header uses a two-column layout: the 44×44 semantic icon tile stays on the left and spans the title/supporting-text block on the right. Keep the icon beside the title block in ordinary, blocking, and destructive dialogs; do not stack it above the copy.
- Use the existing semantic soft background and foreground pair (`$accent`/`$primary`, `$warning-soft`/`$warning`, `$danger-soft`/`$danger`, or `$success-soft`/`$success`) with a central Lucide icon at 20–22px.
- Title 18–20/800 + subtitle 13/400 `$text-secondary`; supporting context stays immediately below the title.
- Close 32×32 outline button with `x` 16 `$text-secondary` icon, isolated at the top-right.
- A 1px `$border-soft` separator closes the header before the body. The same structure applies to ordinary, blocking, and destructive dialogs.

**Body:**
- Padding 20 top + 24 side, gap 16.
- Form fields (labels 13/600 + inputs).
- Preview block in `$bg-muted` with `$border-soft` border, radius 12:3 side-by-side metrics justify-space-between.

**Footers:**
- Padding 16 top + 24 side + 24 bottom, gap 12.
- `justify-end` alignment (default) or `justify-space-between` (when there is a remove button on the left).
- Cancel (outline) + primary CTA on the right.

### Blocking dialog

Modal variation used to block destructive actions when there are dependencies.

- `triangle-alert` `$warning` icon in `$warning-soft` square.
- Title "Category X in use" + explanatory subtitle.
- List of dependencies in `$bg-muted` block, each item with `link` icon 14 + text 13/600.
- Single CTA: “I got it” (primary).

### Destructive confirmation dialog

- `triangle-alert` or `trash-2` `$danger` icon in `$danger-soft` square.
- Title "Remove X?" + subtitle "This action cannot be undone."
- Body with description of the impact and (optional) list of items in the `$bg-muted` block.
- Footer: Cancel (outline) + full destructive button.

### Calculation preview (metrics block)

Appears in the Add/Edit Ingredient, Add Size, Register Production modes.

- Horizontal frame, 16×20 padding, `$bg-muted`, `$border-soft` border, radius 12.
- Justify space between.
- Each metric: label 11/700 `$text-secondary` uppercase (letter-spacing 0.4) + value 18/800 `$text-primary` (or `$success-vivid` for positive values).

### Category card (Settings tab)

- Horizontal frame, padding 14×16, gap 10, radius 12.
- **Active state:** background in the soft color of the category + 2px border in solid color + icon and label in solid color.
- **Circular check** on the right, 20×20, radius 999, solid color background with 12px white `check` icon.
- **Inactive state:** `$bg-card`, 1px border `$border`, icon `$text-secondary`, label `$text-primary`.

### Danger Zone

- Card with `$bg-danger-bg` (`#FEF2F2`) + 1px border `#FCA5A5` + radius 16 + padding 24.
- Title 18/700 `$danger` + subtitle 13/400 `$danger`.
- Full destructive button on the right.

---

## 4. Screen Patterns

### Base layout

- **Sidebar** fixed to the left (280px).
- **Content** takes up the rest:
  - Header (72px) at the top.
  - ContentWrap with padding 8 top + 32 side + 32 bottom + gap 20 between elements.

### Product Page

ContentWrap vertical order:
1. Breadcrumb ("Stock › Products › [Product Name]")
2. Product Header (card with name, unit, status, category chips, Edit/Remove buttons)
3. Tabs in pill (conditional by category)
4. Active tab content cards

### Tables inside cards

- Card title + counter + main button at the top.
- Table below.
- Filters (when applicable) between header and table.
- Pagination (when applicable) in the card footer.

### Empty states

Large centered button with explicit CTA (e.g. "Add first brand") when the list is empty.

### Alert states

- **Predictive (production):** red line + icon + explanatory subtext. Confirmation button blocked.
- **Informative (limiter):** metric card with warning background + highlighted value + explanatory detail.

---

## 5. Icons

**Single library:** [Lucide](https://lucide.dev). No emojis or other libs.

**Frequent icons:**
| Icon | Usage |
|---|---|
| `house` | Dashboard |
| `package` | Stock |
| `package-open` | Ingredient (category) |
| `tag` | Sales, Prices (tab) |
| `shopping-bag` | Resale (category) |
| `ice-cream-bowl` | Portion (category) |
| `candy` | Accompaniment (category) |
| `chef-hat` | Recipe (tab), Manufacturable (category) |
| `layers` | Side dishes (tab) |
| `settings` | Settings |
| `users` | Users |
| `credit-card` | Subscription |
| `search` | Search |
| `bell` / `circle-help` | Header (notifications, help) |
| `chevron-down` / `chevron-right` | Dropdowns, expandable groups |
| `plus` / `minus` | Add / stepper |
| `pencil` | Edit |
| `trash-2` | Remove |
| `arrow-down` / `arrow-up` | Entry / Download |
| `arrow-right` | Projection (X → Y) |
| `triangle-alert` | Critical Alerts |
| `info` | Information notes |
| `link` | Dependency item in blocking dialog |
| `check` | Confirmation in circular check |
| `lock` | Field disabled |
| `x` | Close, remove chip |
| `play` | Produce button |
| `calculator` | Calculation preview |
| `ellipsis` | More actions menu |
| `ice-cream-cone` | Brand mark |

---

## 6. Behavior and microinteractions

- **Real-time calculations:** when typing in any input that feeds a calculation (quantity of ingredient, price, size, batches to produce), the preview and metrics are updated immediately.
- **Input synchronization (Produce Modal):** batch stepper ↔ unit input in ml (or product unit). Editing one updates the other.
- **Atomic write-offs:** when confirming production or sale, all stock write-offs happen together. If either fails, none is applied.
- **Hard blocking on categories:** if the manager tries to unmark the category in use, the system displays a dialog listing the dependencies, without allowing removal.
- **Inline saving (Settings):** each field saves when losing focus. No "Save" button.
- **Availability toggle (Resale):** disabled brand does not appear in the POS. Price input is in tertiary gray.
- **Destructive confirmation:** any removal (product, brand, ingredient, accompaniment, size) goes through dialog.

---

## 7. Non-standard (do not use)

- Circular shapes for non-iconic items (avatars, subnav dots are exceptions).
- Emojis in any context.
- Icons outside of Lucide.
- Dialog headers with the semantic icon above, below, or detached from the title/supporting-description block; the icon always remains to its left.
- Thick borders (> 2px) on any element.
- Complex gradients (only soft colored shadows on primary and destructive buttons).
- Saturated background in calculation preview blocks (moved to neutral `$bg-muted`).
- "Base" color as type of accompaniment (manufacturable is already the basis of the order).
- Two different sources (only Manrope).
- Colors by type in the Type column of the linked accompaniments table (neutral text remains).
- Purple in number of override value in the monitoring table (it stays the same as the others — all in `$text-primary`).

## 8. Public landing presentation

The approved public landing uses a marketing surface distinct from the operational app:
`--landing-deep: #2E1065` for its opening panel, white text and controls, and existing
`--primary` / `--primary-soft` for the order illustration stage and supporting text.
Operational app surfaces retain the neutral treatment above. The landing uses Manrope
500 for display headings (80px desktop, 34px narrow, line-height 1.12–1.14, tracking
−0.03em), with intrinsic height and 24px desktop / 12px narrow outer margins. Its
order preview contains labeled illustrative data and is a static image. Controls
remain keyboard accessible; white focus outlines contrast against the deep-purple
surface. See the saved public-landing-hero design handoff for measured layout values.

The hero uses an animated mesh gradient inspired by the supplied NestJS reference:
near-black `--landing-ink: #08050D`, organic purple regions derived from existing
brand tokens, defined color transitions, and low-intensity procedural grain. A decorative WebGL field evolves at up
to 30fps; Motion springs smooth pointer-driven displacement and deformation of
the purple regions, with a localized highlight that makes the mouse response
clearer while remaining subdued behind the heading. The field returns smoothly when the
mouse leaves. The canvas
is inert, hidden from assistive technology, and cannot intercept controls. Pause
rendering outside the viewport or while the document is hidden. Touch/coarse
pointers and reduced-motion users receive a static frame, including live preference
changes; a CSS gradient remains available when WebGL initialization or context
fails. This marketing-only exception does not apply to operational app surfaces.


The public hero also has a single Motion entrance on mount: navigation, headline,
copy, actions and order preview arrive over 1.85s, starting at opacity zero,
with decelerating movement and a bounded reveal of the preview. The mounted
page initializes opacity before paint; markup has visible defaults without
the animation lifecycle. Reduced-motion users skip the entrance. Activating
reduced motion, focus entering the page, keyboard input or pointer activation
completes it immediately.
Resize and mouse movement do not replay the sequence.


The connected-operation overview follows the hero on the white/card surface,
using the supplied Nest enterprise-support section as a structural reference. Use dark
headings, muted supporting text and purple line icons. A centered 1152px content
width places the two-line headline left and supporting copy right, above one rounded
bordered grid with generous cell padding and shared thin dividers. The four stages
Organize, Produza, Venda, Acompanhe use two columns on desktop/tablet and one on narrow
screens. Preserve the existing copy without adding testimonials or support claims.
Narrow layouts stack the content with20px
horizontal padding. This presentation adds no controls. Its title, support and four stages reveal once
on viewport entry, with a 0.6s opacity-zero entrance and20px rise. Desktop stages
stagger by0.12s; narrow stages trigger independently without delay. Initial/live
reduced motion skips the entrance; server markup and observer fallbacks stay visible.


The public landing continues with three NestJS-inspired showcases: Vendas,
Produção and Resultados. Purple/landing-deep gradients and the dark landing-ink
panel are marketing-only surfaces. Large inset app-style illustrations use the
existing neutral operational tokens and visibly label data as illustrative.
Desktop fine-pointer viewports at least1024×700 pin successive panels40px from
the top; previous panels scale to0.88 and rotate7°/-2° as scrolling advances.
Normal document scrolling remains native. Narrow/coarse/reduced-motion users
receive normal flow, no pinning or perspective. Three selectable feature buttons
rotate previews every8s with a synchronized2px progress line and pause/resume
control. Suspend rotation while offscreen/covered, hidden or keyboard-focused;
reduced motion disables it. Use visible white focus outlines and inert covered
panels. Illustrations are decorative with named figure alternatives; their
visual app controls are inert. No live operational data is exposed.


The team section following the public showcases adapts the supplied NestJS course
fan: three overlapping Gerente, Operador and Histórico cards, centered oversized
white heading, landing-ink surface and soft localized primary-purple lighting.
Cards select on pointer hover/click and keyboard focus; the selected readable
description is separate from the deck. No timed rotation. Use shared Buttons,
Icons, visible white focus and existing radii/type tokens. Narrow320/390px must
retain a recognizable fan without tiny scaled type or horizontal overflow.
Initial/live reduced motion removes spatial transforms while retaining selection.
History examples are explicitly illustrative administrative changes of team access,
not a universal activity log. This exception is confined to the public landing.


The public landing price section follows the team section with a pale lavender
primary-soft/card surface, dark left copy/action and white right offer panel.
Use existing brand/text/radius/shadow tokens and large legible monthly price.
Two restrained purple radial light layers move slowly behind the panel using
Motion; decoration is inert and hidden from assistive technology. No visible animation control;
offscreen/document-hidden suspension and initial/live reduced-motion static light
are required. Narrow320/390stacked layouts keep panel/CTA within viewport. This
marketing exception introduces no billing API or checkout; offer copy follows
BillingPRQ-01/02 and trial links to existing onboarding.

Pricing title, support, trial CTA and offer panel reveal once on scroll: opacity
0→1,20px upward movement over0.7s, desktop stagger0.16s. Narrow elements trigger
individually without delay. Default markup and observer fallback stay visible;
initial/live reduced motion and focus/pointer activation complete the entrance.
Keep entrance controls separate from looping lights. The trial CTA transitions
colors/shadow only so its focus reveal does not inherit an opacity transition.

The public FAQ follows pricing with a white/card surface, large dark heading,
primary-purple crescent with a defined thin core, soft halo and four question Buttons. Muted body text and
neutral dividers support purple selected/hover states and visible purple focus.
The light FAQ separates pricing from the dark closing invitation. All questions stay
visible; exactly one answer is active, initially the first. Desktop uses questions
left/answer right; narrow puts the answer directly after the selected question.
Use expanded/control relationships and visible purple focus, manual selection only.
A short opacity response transition preserves visible initial content. The inert
arc sweeps into place with a finite rotational arrival≤4s, with no new pause control
or automatic answer rotation. Narrow layouts soften its core to protect the text;
initial/live reduced motion completes to a static arc, and offscreen/hidden motion is suspended.
Copy follows existing Billing/Identity/MRP/PDV requirements.

Public landing closing follows FAQ: sparse animated starfield on landing-ink,
large centered Manrope heading and permanently visible support/trialCTA/note.
Desktop words illuminate with scroll over a readable muted base; narrow and
initial/live reduced motion render white text and static stars. Stars are inert,
aria-hidden, deterministic and bounded, paused offscreen/hidden with cleanup.
Footer uses brand/root, price anchor, login and working Termos de uso/Privacidade
links to public `/terms-of-use` and `/privacy-policy` routes. Legal documents use a
white reading surface, Manrope, dark headings and muted prose with purple navigation
and focus treatment. A shared header, document-version/date metadata, table of
contents and reciprocal document links support reading. Desktop places the contents
beside the article; narrow screens stack them without horizontal overflow. Draft
documents prominently identify their review status and pending legal identity,
contact, supplier-location/transfer and retention information. Creating these pages
does not implement checkout acceptance, data disposal or provider integrations.

Connected overview visual refinement: a white editorial surface with purple second
heading line, four open horizontal stages≥1024px, soft56px brand icon tiles,
01–04sequence and a thin decorative rail/arrows. Tablet2columns and narrow
vertical icon/copy rows keep the original text and ordering. This supersedes
the large bordered2×2block composition; no new controls or product claim. Existing
once-on-entry opacity/rise and initial/live reduced-motion fallback remain.

Later connected-flow refinement removes stage numerals. The three desktop
connector rails show a directional purple light pulse toward their arrows.
Decoration is inert; offscreen/hidden playback suspension, static reduced-motion
and narrow layouts, listener/animation cleanup preserve accessibility and runtime
efficiency. This replaces the numbered treatment only, keeping prior typography,
icon tiles, ordering and entrance behavior.


Showcase stack exit correction: previous panels fade out over the existing
scroll transition and become fully invisible when covered. Reverse scrolling
restores their appearance. The final Results panel has no successor and remains
opaque; narrow and reduced-motion presentations retain all visible panels.
