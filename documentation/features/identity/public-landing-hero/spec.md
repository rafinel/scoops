---
title: Public landing hero, connected overview and dashboard route
status: in_progress
revision: 10
source:
  type: direct-request
  ref: "Current chat: implement approved Scoops hero; use /dashboard for dashboard"
scope:
  - apps/web Identity public presentation and authenticated dashboard navigation
last_updated_at: 2026-10-11
---

# Public landing hero, connected overview and dashboard route

## 1. Context and scope

Implement the approved Pencil hero as the public home at `/`. The former English LandingPage is unused; `/` currently owns the protected dashboard. User explicitly requested `/dashboard` for that page. Compact delivery: static presentation and route relocation with existing authorization. The following connected-operation section is now included by the user’s next-section request. The user now authorized three NestJS-inspired showcase panels (Vendas, Produção, Resultados), automatic feature rotation and scroll stacking. The user additionally authorized the NestJS-inspired team section. The approved single-plan price section and manual FAQ section are now included. Other remaining landing sections, authentication changes and backend changes remain excluded.

## 2. Implementation Contract

| ID | Source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | Approved hero and implementation request | Public `/` displays the Portuguese hero, dark purple panel, Scoops identity, trial CTA and actual static order preview with illustrative-data caption. |
| FR-02 | Approved trial copy | Começar teste grátis / Testar grátis open existing onboarding; Entrar opens existing login. Mobile navigation offers these same available destinations. No dead Recursos/Preço links before their destinations exist. |
| FR-03 | User: use /dashboard | Dashboard moves to `/dashboard`, retaining Manager access, anonymous login redirect with returnTo, Operator redirect to New Sale and auth-unavailable boundary. Default application navigation points there; explicit safe return destinations remain honored. |
| FR-05 | User: next section; previously agreed Tudo conectado structure | Following the hero, match the supplied white four-column section: Do ingrediente ao último pedido, Organize → Produza → Venda → Acompanhe. Explain products/ingredients/recipes, production capacity/consumption, stock update at sale confirmation, and sales/attention indicators. Static illustrative presentation only; no live data/new flow/margin claim. |
| FR-04 | Approved responsive design | Desktop and narrow layouts preserve readable headings/CTA, visible focus and no horizontal overflow. Static preview is not an operative order form. |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01, FR-04 | Public responsive hero | Anonymous visitor | Opens `/` at 1440 and 390 px | Hero renders without protected app shell; illustrative image loads and page does not overflow | Root route integration and MV-01 screenshots |
| AC-02 | FR-02, FR-04 | CTA and navigation | Public home | Follows CTA/login or opens mobile menu using keyboard | Existing onboarding/login destination renders; menu closes with Escape and focus is visible | Route integration and MV-01 |
| AC-03 | FR-03 | Protected dashboard | Anonymous / Manager / Operator | Opens `/dashboard` | Login with returnTo / Dashboard / New Sale respectively; unavailable auth retains error boundary | Existing dashboard route suite updated |
| AC-04 | FR-03 | Application destinations | Login/onboarding/global search/sidebar | Default app navigation is selected | Canonical destination is `/dashboard`; existing role redirects remain | Consumer tests and existing route suites |
| AC-05 | FR-05, FR-04 | Connected operation overview | Public visitor | Scrolls below hero at desktop and 320/390px | Supplied section heading and Organize/Produza/Venda/Acompanhe stages render readably without overflow; content reflects existing MRP/PDV/Analytics capabilities, unchanged trial/navigation | Landing route assertion and fresh CLI desktop/narrow captures |

### Design Contract

See [handoff](design/handoff.md). Required reference captures are desktop 1392×1280 panel inside 1440-wide page and narrow 366×1145 panel inside 390-wide page. Content height remains intrinsic. At 320 px wrapping may add lines. Navigation only publishes existing destinations; mobile menu is functional. Existing brand icon may be extended through the shared Icon wrapper to match the cone.

## 3. Technical Contract

Identity owns LandingPage; Analytics continues to own DashboardPage. Root route is public and does not mount AppLayout or auth guards. Dashboard remains a child of `_authenticated`, with the existing dashboard profile guard. `ROUTES.root` remains `/`; `ROUTES.app` becomes `/dashboard`. Regenerate route metadata with `pnpm --filter web generate-routes`. Existing safe returnTo values remain valid (including explicit `/`, now public). No persistence or API changes. Preserve unrelated worktree changes.

Reuse Anchor, buttonVariants, Icon and shadcn mobile menu primitives. Public order screenshots are exported from the approved Pencil nodes, contain only illustrative data and expose no fake buttons to assistive technology. Map approved marketing palette and display scale to named CSS tokens; document the landing-only purple-surface exception. The subsequently requested animated mesh uses a decorative WebGL field with Motion 14.1.0 pointer spring values that displace and deform the field on hover, no input interception, a 30fps cap, viewport/document visibility pausing and static fallbacks for reduced motion, touch/coarse pointers and WebGL failure. The subsequent hero entrance uses a single scoped Motion sequence lasting 1.85s, skips initial reduced motion, completes on live reduction or control interaction, starts all targets at opacity zero before paint, completes when focus enters the page, and retains visible markup defaults outside the animation lifecycle. It introduces no product interaction or scroll/stacking transition.

The connected section is a pure Identity marketing widget, using existing Manrope, primary/landing-deep/accent tokens and shared Icon. No new dependency or API. Keep the hero entrance scoped to its existing targets; the next section does not replay the entrance or add scroll stacking. Pencil MCP is unavailable in this session; use the user-supplied connected-section-reference.png for this section and saved hero references for continuity, without claiming a fresh Pencil capture.

## 4. Validation Contract

| Acceptance | Checker | Expected assertion |
| --- | --- | --- |
| AC-01, AC-02 | Public root Playwright route suite with shared fixtures | Visible hero, loaded image, destination URL/heading, menu keyboard behavior and narrow overflow |
| AC-03 | Analytics dashboard Playwright suite, mocked transport | Existing auth/profile/error cases at canonical new URL |
| AC-04 | Login, onboarding-confirmation, invitation and global-search existing consumers | Default application navigation uses canonical app route |
| AC-05 | Root route and CLI desktop/narrow inspection | Four stages in correct order, truthful production/confirmation/attention copy, no overflow at320/390, fresh section captures |

Run web generate-routes, check:playwright (before edits), code, architecture, types, complexity, coverage, complete integration suite and build. Mocked transport proves UI routing only, not server auth/persistence. No real-service mutation is introduced.

### MV-01 — Public hero

Start only web dev on port4000 if not already shared. Open `/` with Playwright CLI at 1440×1000 and390×844; inspect heading, white CTA and loaded image. Capture fresh full-page screenshots in ignored test-results and compare to saved references. Use Tab/Enter for a CTA, verify onboarding URL/heading, return to home, use mobile menu and Escape, then login link and verify URL/heading. Check console and failed requests, including image loading. Test320px and reduced motion; no required dynamic data/loading/error states exist in static hero. Stop task-owned browser and web process afterward. Do not reset accounts or databases.

## 5. Documentation alignment and revision history

Authorities: AGENTS.md; documentation/sdd.md, rules.md, design.md, architecture.md, modules.md and tooling.md. Rule Pack: code-conventions, ui-layer, web-app-routing, widget-testing. Existing Identity access and Billing trial behavior remain authoritative; no PRD business rule changes. Landing surface extension follows user-approved design.

| Revision | Date | Change |
| --- | --- | --- |
| 1 | 2026-10-10 | Approved hero implementation and explicit dashboard relocation |
| 2 | 2026-10-10 | User requested next connected-operation section; independent compatibility review passed |
| 3 | 2026-10-10 | Supplied reference replaces inferred purple panel with white four-column section |

Visual refinement within FR-01/FR-04, authorized by the user's later request: add a
purple animated mesh backdrop with Motion pointer smoothing inspired by the supplied NestJS screenshot.
No product, navigation or layout contract changed. Refresh affected visual/runtime
evidence and run scoped code/types/build plus the complete landing route suite;
reuse unaffected routing, coverage and full-regression baseline evidence.


Revision2 — 2026-10-10: user requested the next previously agreed section.
Added FR-05/AC-05; public presentation only, existing domain rules unchanged.
For this bounded addition run scoped code/types, production build, complete landing
route suite and fresh desktop/narrow/keyboard/reduced-motion CLI evidence.
Unaffected hero/dashboard/full-regression evidence remains historical and valid.


Revision3 — 2026-10-10: user supplied the intended next-section screenshot.
White surface, heading/support above four horizontal steps and thin top rules
replace the purple vertical rail. Saved authoritative reference:
[Connected section](design/connected-section-reference.png). Narrow layout stacks
steps; preserve exact supplied copy and registration-triggered stock semantics.


## Authorized visual refinement — revision 4

The user requested scroll entrances for the connected-operation overview. Each
heading, support paragraph and stage reveals once on entering the viewport, from
opacity zero with a 20px rise over 0.6s. Desktop stages stagger by 0.12s (maximum
0.36s); narrow stages reveal independently without delay. Markup remains visible
without JavaScript or IntersectionObserver. Initial and live reduced motion reveal
all content immediately. Cleanup prevents queued observer callbacks from restarting
animations. This supersedes the static/no-animation wording for this section only;
hero motion, white reference layout, copy and product behavior remain unchanged.


## Authorized showcase expansion — revision 5

Source: user-supplied NestJS Observe/Devtools screenshots and explicit “Faça isso”
after explanation of8s rotating feature tabs and scroll-pinned panel stacking.
This supersedes earlier exclusions of stacking/remaining showcase panels only.
No PRD business rules or delivery checkboxes change.

FR-06: after the existing hero/connected overview, present three large rounded
showcase panels for Vendas, Produção and Resultados with three selectable features
each and a corresponding illustrative application preview. Preview data must be
explicitly illustrative; do not claim payments, net profit, realtime or fiscal
features. Estimated gross margin includes cost coverage.

FR-07: ordinary-motion desktop panels pin and overlap as the next rises; the
previous scales/tilts in perspective under scroll control. Each active visible
panel auto-advances its preview every8s with a synchronized progress bar. Manual
selection resets timing. Provide a pause/resume button. Pause offscreen, document
hidden, keyboard focus and reduced motion; switching focus must not replace focused
controls. Reduced motion/coarse pointers/narrow layouts use normal document flow
and no spatial stacking. Initial/live reduced motion disables autoplay and screen
transitions while retaining manual controls. Do not hijack scrolling.

AC-06: desktop scroll shows Vendas→Produção→Resultados overlapping; selected feature
updates preview and accessible selection; timer advances after8s, pause freezes
progress, manual choice resets it. Keyboard can select every feature and pause.
AC-07:320/390px layout readable without overflow; reduced motion has no stacking or
autoplay, manual selection works, live change completes/clears transforms and stops
timer; offscreen/hidden panels pause. Hero/connected composition stays intact.

Validation: scoped Biome/types/architecture/complexity/build; behavior-focused
landing route cases and CLI desktop/narrow/keyboard/autoplay/pause/reduced-motion
scenarios plus fresh captures. Reuse unaffected dashboard/auth regression and
coverage baseline evidence; new showcase behavior has no REST/auth/data boundary.
Saved NestJS references in design/nest-showcase-{stack,errors,logs}.png define the
composition; purple Scoops colors, native app-style illustrative previews, shared
controls, responsive flow and explicit pause are authorized adaptations.

Progress correction authorized by the user report: passive mouse hover and
mouse feature selection keep the8s countdown running. Keyboard-visible focus
pauses it while controls are being used; explicit pause and lifecycle gates remain.


## Authorized team section — revision6

User approved the proposed adaptation of the supplied NestJS course-card fan.
FR-08: after Resultados, show a dark landing-ink section with soft purple light,
three overlapping cards (Gerente, Operador, Histórico), oversized centered heading
“Sua equipe alinhada. Cada um com seu acesso.” and concise pt-BR supporting copy.
Use individual accounts and existing profile permissions from IdentityPRQ-02/04.
History describes administrative team changes available to Managers (PRQ-10),
not a universal operational action log. Any sample event is labelled illustrative.

FR-09: pointer hover, click and keyboard focus select a card, lifting it above
its neighbours with a short Motion transition. No autoplay or new operational
control/API. The selected card detail remains readable below the deck. Controls
use accessible names, selected state and visible focus. Narrow320/390px retains
recognizable fan composition and legible title/detail without horizontal overflow.
Initial/live reduced motion disables spatial card transitions, preserving selection.

AC-08: desktop shows the three-card fan with Gerente/Operador permissions and
administrative-history example, after the three showcases. Pointer and keyboard
selection update visible detail without changing routes or focused controls.
AC-09:320/390px readable/no overflow; initial/live reduced motion retains static
selection and visible focus. Existing hero/showcase/CTA behavior remains intact.

Validation for this bounded public presentation: scoped Biome/types, architecture,
complexity and production build; focused landing route suite plus fresh desktop
and320/390px CLI captures, keyboard and reduced preference checks. Preserve prior
coverage/routing and failed broader-regression evidence without repeating unrelated
suites; no auth, data, persistence or pricing boundary is changed.
Saved references: design/nest-team-fan-{1,2,3}.png. Purple palette, three relevant
Scoops cards, accurate team auditing, no course claims or extra CTA are adaptations.


## Authorized pricing presentation — revision7

User approved the supplied NestJS split composition, then a pale lavender surface,
white offer panel and animated purple illumination. This extends presentation
only; BillingPRQ-01/02 already authorize the offer, no commercial rule changes.

FR-10: after the team section, show a two-column desktop price section with dark
left heading “Um plano. Sua sorveteria inteira conectada.”, concise support and
“Começar teste grátis” to existing onboarding. White panel on the right presents
Scoops Completo, R$79,90/mês, impostos inclusos, all features and explicitly
unlimited users/products/orders/movements;14dias grátis sem cartão de crédito.
No annual toggle, extra plans, checkout, price API or inactive link. Narrow320/390px
stacks readable copy/panel and CTA without overflow. Panel stays fully within page.

FR-11: decorative purple light drifts gently behind the white panel on a pale
primary-soft/card surface using Motion. It cannot obscure text, intercept controls
or enter the accessible tree. No visible animation control (later user request removes it). Pause outsideviewport
or while document hidden; initial/live reduced motion preserves a static light
and stops movement without losing focus or hiding content. Clean up animation
and preference/visibility listeners. No unrelated hero/team/showcase change.

AC-10: visitor sees exact monthly79,90offer and truthful limits after team section;
pricing CTA renders existing onboarding destination. No immediate-signup activation
or automatic-charge-after-trial claim. Offer derives from BillingPRQ-01/02.
AC-11: ordinary desktop light animates with no pause button; keyboard
focus works,320/390px no overflow, initial/live reduced motion leaves static light
and fully readable offer. Decorative layers do not block CTA.

Validation: scoped Biome/types/architecture/complexity, final production build;
focused landing route suite with commercial-copy/CTA/narrow assertion, CLI fresh
desktop320/390screenshots, animation/pause/live reduction/keyboard checks. Retain
prior coverage/auth/routing evidence and record historical broad-regression failures
without rerunning unrelated suites. This addition has no data/auth boundary.

User refinement: remove pricing animation button; retain decorative light and
reduced-motion/offscreen/document visibility suspension. This supersedes manual
pause/resume requirements for pricing only.

User refinement: pricing title, support, CTA and offer panel reveal once on scroll
entry, starting at opacity0 with a short stagger and upward movement. Initial/live
reduced motion leaves them visible; keyboard focus/activation reveals immediately.
Re-entering the viewport does not replay; unsupported observer leaves content
visible. Background movement retains its existing independent lifecycle.


## FAQ amendment — revision8

User approved a Nest testimonials-inspired dark FAQ with purple luminous arc,
all questions visible and exactly one answer active. No automatic question
rotation, new business rule or backend change. Add only FAQ after pricing;
final CTA/footer remain outside this amendment.

FR-12: title “Antes de começar, tire suas dúvidas.”, four visible questions:
card-free trial, monthly price/limits, team access, connected stock/production/sales.
First answer active by default; selecting a question replaces the answer with a
short fade. Desktop question list left/answer right; narrow answer immediately
below selected question. All questions remain visible, one answer only.
Use shared accessible buttons with expanded/control relationships, keyboard
Tab/Enter/Space and visible focus. No timed selection. Answers derive from
existing Billing/Identity/MRP/PDV requirements; no unsupported roadmap claims.

FR-13: inert, aria-hidden purple luminous arc on landing-ink background, animated
with a finite Motion arrival of at most4s (no new pause control). Initial/live reduced motion is static; offscreen/hidden suspension
and cleanup required. Default answer remains visible if animation cannot start.

AC-12: first answer shown; each of four questions is selectable by mouse/keyboard,
only one expanded/answer visible. R$79,90monthly taxes/all features/unlimited
limits,14daytrial without card, individual Gerente/Operador access and linked
stock/production/sales copy agree with existing PRDs.
AC-13: desktop/narrow320/390 no overflow, questions never vanish, active answer
follows selected question on mobile. Static reduced-motion presentation and
short response transition remain legible, keyboard focus intact.
Validation: scoped code/types, CLI selection/keyboard/reduced/lifecycle checks,
fresh desktop/narrow screenshots compared to supplied reference adaptation.
Prior contract evidence retained; broad-regression limitations remain explicit.


## Closing and footer amendment — revision9

User approved Nest-inspired closing and footer. FR14: centered oversized phrase
“Sua próxima venda pode ser mais organizada.” progressively illuminated with
scroll on desktop, animated sparse starfield on landing-ink, always-visible
support, trial CTA to existing onboarding and14daycard-free note. Stars are
deterministic, inert/aria-hidden, bounded animation with offscreen/hidden pause
and cleanup. Initial/live reduced motion and narrow keep full legible phrase
and static decoration. Visible default/fallback, controls never blocked.
FR15: footer brand/root, Preço anchor to existing price heading, Entrar to login.
User has no legal URLs yet and explicitly requests placeholders: Termos de uso
and Privacidade appear as noninteractive text with Em breve; no fake hrefs.
AC14: starfield visibly moves, scroll highlights phrase, support/CTA remain
visible and keyboard navigates to onboarding; narrow/reduced static remains
legible without overflow. AC15: footer destinations work and legal placeholders
are visibly pending without navigable URLs. No new legal content/routes/backend.
Validation: scopedBiome/types, focused route tests, CLI actualdesktop/narrow
screenshots, stellar lifecycle/reduced/scroll/keyboard and footer navigation.
Preserve historical regression limitations; no full-suite cleanliness claim.

User-authorized connected overview visual refinement: preserve original four
stage labels/copy/order and once-on-scroll entrance, improve layout/hierarchy.
Desktop uses a connected horizontal rail of four stages, tablet2columns/narrow
stacked, numbered sequence and soft brand icon treatment. No new product action
or business rule. Other sections and routes remain unchanged.

Connected-flow refinement: user requests removing01–04numbers and a directional
animated purple pulse along the three arrow connector tracks. Decoration only,
original copy/order/entrance preserved. Desktop rails animate while visible and
document active; narrow/reduced motion retains static readable presentation.
No additional interactive control, domain rule, route or dependency.


Showcase stack correction: prior cards must fade completely as the next card
enters, and restore when scrolling back. Apply covered/exit treatment only when
a successor exists, preserving the final Results card. Narrow and reduced-motion
layouts keep every panel opaque and readable. No content, domain or route change.


Revision10 — user explicitly approves including the existing legal pages after
the landing commit. This supersedes FR15/AC15 pending-label behavior: footer
Termos de uso and Privacidade open public /terms-of-use and /privacy-policy.
FR16/AC16: documents render directly for anonymous, Manager and Operator
visitors; identify version/date and Minuta para revisão, provide contact and
contents/fragment links, keyboard skip-to-main, reciprocal navigation and
responsive320/390px reading without overflow. Static draft presentation only;
no checkout acceptance, legal-finalization or data lifecycle implementation.
Prior business rules, commercial offer and module PRDs remain unchanged.
