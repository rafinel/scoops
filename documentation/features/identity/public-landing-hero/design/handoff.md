# Public landing design handoff

## Saved Pencil references — revision1

| Reference | Surface | Dimensions | Validation |
| --- | --- | --- | --- |
| [Desktop](ojCkG.png) | Public home, default | 1440 page;1392×1280 panel | AC-01/02 MV-01 desktop |
| [Mobile](aXi1r.png) | Public home, default | 390 page;366×1145 panel | AC-01/02 MV-01 narrow |

| Element/source | Measured design | Repository mapping | Responsive/state guidance |
| --- | --- | --- | --- |
| Outer oSa1B/P1VGG |24desktop/12mobile padding | Tailwind spacing6/3 | White canvas |
| Panel ojCkG/aXi1r | #2E1065, radius16, intrinsic height | Named landing-deep token, rounded-xl | White foreground; lilac supporting text |
| Header I5B9b/hHXjV |96desktop/76mobile height;48desktop/20mobile horizontal padding | Header padding/height utilities | Available links only: login/onboarding; mobile menu keyboard operable |
| Title Ic2u3/j02eJa |Manrope500;80/34px;1.12/1.14line-height;−2.4/−1.2tracking | Named display sizes or scoped CSS | Desktop two lines; mobile title first phrase splits into two, final phrase fits at390 |
| Hero QJf3b/rsUOY |64desktop/40mobile top;64/20horizontal;48/20bottom;48/32gap | Existing spacing utilities | Intermediate widths interpolate type scale without clipping |
| Body EVLpJ/CUVyN |620desktop max width;18/16px;1.65line-height | Existing Manrope and accent tokens | Centered |
| CTA Wi03j/Ehm49 |244×56desktop; full-width×56mobile;12radius | Anchor and buttonVariants, cardwhite / primarytext | Visible light focus outline on purple |
| Trial caption |13px,12px gap | Caption utility | 14 dias grátis. Sem cadastrar cartão. |
| Stage hTZlS/Zw3kn |736desktop with24vertical/56horizontal padding;326mobile with12padding;primarybackground | Primary, radiusxl | Static picture; desktop624px image and mobile302px image |
| Order YyJDF/g3ia0 |Actual app order, illustrative data | PNG exported asset; no live PDV state | alt describes illustration; caption visible; no interactive image controls |

Approved scope deviations: Recursos and Preço links deferred until destinations exist. Mobile menu contains login and trial. The raster order illustration is not a functioning cart. At320px wrapping can add lines. No stacking scroll animation.

Original Pencil layout tool reported cached wrapper positions/clipping; fresh page screenshots confirmed correct visible order. Runtime comparisons use current screenshots and saved references, rather than cached positions.

## Authorized hero refinements — 2026-10-10

The user requested a Motion pointer backdrop inspired by the supplied NestJS screenshot. An initial cursor spotlight was rejected and replaced by an animated mesh gradient. Live reference inspection distinguished the hero's evolving noise field from the footer warp shader. Scoops uses its own procedural field, existing purple tokens, named landing-ink and grain; no NestJS source/assets copied.

Motion springs drive actual pointer displacement and local deformation of both noise layers. The user then requested clearer contours, so color-transition ranges were narrowed and grain reduced to0.018. Subsequent requests strengthened pointer displacement to1.6, local warp1.1 and localized glow0.5, with heading-area attenuation. Current spring: stiffness260/damping32/mass0.5. Pointer exit fades influence to zero. Field evolves at30fps only for fine pointers, ordinary motion preference, visible surface and active document. Reduced motion/touch receive static composition; unavailable/lost WebGL uses CSS fallback.

The user requested entrance animation, then more delay and finally opacity-zero starts. Current sequence coordinates navigation/title/copy/actions/order-preview at0.1/0.35/0.65/0.95/1.25s with0.6s transitions, total1.85s. Layout effect initializes all five targets at opacity0 before paint after the reduced-motion guard. Preview has a bounded clipped reveal. Reduced-motion users see content immediately; live preference reduction, focus entering the page, keyboard input and pointer activation complete the sequence. Cleanup stops animation and restores default opacity. Resize/pointer movement do not replay it. Markup defaults outside the animation lifecycle remain visible. Historical refinement evidence remains in Evaluation.

## Connected section brief — revision2

Source: user's previously agreed landing table, “Tudo conectado”, followed by “próxima seção” after hero implementation. Pencil MCP unavailable in this session; no new Pencil capture claimed. Inherit saved hero Manrope, primary/deep purple and white palette.

Add a static primary-purple panel below the hero: large left headline “Tudo conectado. Do estoque ao resultado.” and concise support; right ordered operation rail: Estoque → Receitas e produção → Venda → Indicadores. Narrow widths stack headline and rail with20px horizontal padding. Existing shared icons and spacing/radius tokens; no new assets, live data, fake controls, entrance animation or stacking behavior.

Copy reflects MRP PRQ-03/06/07, PDV PRQ-03/08/09 and Analytics PRQ-02/03/05: production and sale updates occur on registration; gross margin is an estimate dependent on known costs. No net-profit, automatic-production or guaranteed-growth claims.


## Authoritative connected-section correction — revision3

The user supplied [this screenshot](connected-section-reference.png), superseding
the inferred purple-panel brief above. White/card surface and dark text. Two-line
heading “Do ingrediente ao último pedido.” left, short supporting text right.
Four equal desktop columns below, each with a thin top rule, purple line icon,
bold action label and short description: Organize, Produza, Venda, Acompanhe.
Exact supplied copy preserved. At narrow widths stack heading/support and steps.
No vertical connector rail, colored icon tiles or estimated-margin claim here.


### Authorized scroll entrance — revision 4

The white reference layout stays unchanged. Title, support and individual stages
reveal once on viewport entry (20% visibility,24px bottom inset): opacity0→1,
y20→0,0.6s decelerating ease. Desktop delays0/0.12s for title/support and
0/0.12/0.24/0.36s for stages. Narrow targets trigger individually without delay.
Reduced motion completes/skips entrances; default markup remains visible.


### Authorized showcase composition — revision 5

References: nest-showcase-stack.png, nest-showcase-errors.png and
nest-showcase-logs.png, copied from the user’s attachments. Live NestJS inspection
confirmed pinned overlapping panels with prior scale/tilt and8s feature rotation
plus click selection. Scoops adaptation uses3panels (Vendas, Produção, Resultados),
brand purple and near-black surfaces, neutral app-style illustrations, three
feature buttons, progress lines and explicit pause/resume. No new Pencil edit.

Desktop1440×1000:1392-wide panel, top40, height920; top hero title centered,
max1152px illustration stage inset in a translucent frame, dark3-column feature
footer. Desktop previews are960×540 internally, scaled to their available width.
Mobile320/390: intrinsic height,24px gaps and20px in-panel sides, no sticky/tilt;
three feature buttons stack below an intrinsic-height compact illustration. Below
600px stage width, the compact variant removes the decorative sidebar and uses
readable12–14px body text instead of scaling the entire desktop interface. Reference adaptation
adds accessible selection/focus/pause and reduced-motion flow.

All nine previews are native static application-style illustrations, not exports
of live authenticated views. Visible illustrative-data label and named figures
prevent fake live data claims; operational-looking controls have no interaction.
Estimated margin includes80% costcoverage in the example; no payment/netprofit
claim or PRD rule change. Existing hero and connected reference stay unchanged.

Final correction: changing the live reduced-motion preference remounts the
active preview with opacity1 and no transform, completing any active transition.
Margin caption reads “60% de margem sobre vendas cobertas”;80% is cost coverage.

Progress-bar correction: passive hover and pointer feature selection allow the
countdown to continue. Pause on keyboard-visible focus, explicit pause, hidden
document, offscreen/covered panel and reduced motion.


### Team fan — revision6

Authoritative supplied NestJS course references: nest-team-fan-1/2/3.png.
Adapt to three profile/history cards above oversized centered white heading,
landing-ink background and a localized purple light. Retain generous negative
space. Card hover/focus/selection lifts the active card above its neighbours;
no timed cycle. Separate selected detail remains readable on320/390px. Motion
reduces to static selection under initial/live reduced preference. No course
content, fake certifications, new CTA or operational permissions are introduced.

Final mobile adaptation: ordinary-motion96px cards with64px centre spacing retain
the leque without320px overflow. Reduced-motion narrow layout uses3separate grid
columns with8px gaps, whole labels and no spatial transitions. Separate selected
detail below the heading remains legible; button DOM is stable across preference
changes, and keyboard selection takes priority over passive mouse hover.


### Pricing split composition — revision7

Saved user reference nest-pricing-composition.png supplies generous split layout:
concise left copy/action and broad right panel. Later user approval supersedes its
dark/red palette: pale lavender primary-soft/card surface, dark text, white offer
panel and soft animated purple light behind it. Keep price and controls inside
the viewport, readable in320/390stacked layout. No syntax/code/course copy.
Left heading “Um plano. Sua sorveteria inteira conectada.” and trialCTA; panel
Scoops Completo,79,90/mês, impostos inclusos, truthful unlimited offer and14days
withoutcreditcard. Slow decorative Motion drift, manual pause/resume, offscreen/
hidden/reduced static fallback. Use existing tokens/controls and stable focus.

Final pricing refinement: decorative10/12s loops preserve position through pause,
resume after returning to view and suspend under document-hidden/reduced motion.
Control uses aria-disabled and guarded activation under reduced preference to
preserve keyboard focus; static lighting remains. Desktop1440split and320/390
stacked captures were inspected against the approved lighter adaptation.

User refinement: pricing pause/resume button removed; automatic lifecycle and
reduced-motion fallback retained. Prior button captures are historical.

Pricing motion visibility correction: the previous 40–48px drift over16/18s
was running but visually too subtle across the broad light surface. The lights
now travel up to220px horizontally and100px vertically over10/12s, with scale
and opacity variation and stronger token-derived purple illumination. Content
remains stationary. Fresh desktop start/end and320px captures inspected.

Further user-authorized visibility increase: final lights travel up to420px
horizontally/180px vertically over7/9s, with scale0.75–1.3 and opacity0.35–1.
Primary-derived radial stops now50%/24%; darker landing-deep85% supporting copy
preserves readability while stronger light moves behind it. This supersedes the
previous10/12s tuning; the light palette, stationary content and static fallback remain.

Pricing scroll entrance: title, support, CTA, panel start transparent on the mounted
page and rise20px over0.7s. Desktop order staggers0.16s; narrow elements reveal
independently. Runs once. Reduced motion, focus and pointer activation reveal
immediately; infinite light controls remain independent.

Showcase preview visibility repair: previews use visible initial markup and explicit
Motion opacity/translation keyframes for selection changes. Do not leave the
app illustration dependent on a hidden initial state that can fail to settle.
Reduced motion leaves full opacity and no translation.

FAQ composition — revision8: saved nest-faq-composition.png supplies dark surface,
large left typography and luminous crescent on right. Approved adaptation uses
Scoops purple, all four questions continuously visible, manually selected answer
right on desktop and below selected question on narrow. First selected by default,
no testimonial/avatar/quote/pagination copy. Animated arc is decorative; initial/live
reduced motion and offscreen/hidden suspension apply. No final CTA/footer yet.

Final FAQ measured layout: desktop max1152px two columns,80px gap,64px heading,
96×64padding;320/390 single column with20px sidepadding and34px heading. Arc600px
position top32/right0 makes the reference curve visible without covering answer
copy; mobile520px arc offset beyond upperright. Final screenshots independently
reviewed for both composition and approved responsive changes.

Closing revision9 reference nest-closing-starfield.png: black/landing-ink sparse
animated stars, large centered phrase illuminating with scroll. Scoops heading
and trial CTA/support adapted; stars white/lilac deterministic decorative. Footer
uses existing live root/price/login destinations; legal names are Em breve
noninteractive placeholders expressly requested by user.

Final closing:80px desktop Manrope phrase,34px narrow, dark centered surface with
54small deterministic stars in3Motionlayers,8/10/12s drift/twinkle. White controls
and trial note always visible; desktop readable gray base illuminates word by
word with scroll, narrow/coarse/reduced static white. Suspend decorative motion
outside view/hidden/reduced/narrow. Footer white/card surface, purple logo, working
price/login anchors and pending legal text. Final desktop390/320captures cleared
by independent visual review.

Connected overview user-authorized appearance refinement: saved
connected-before-refinement.png is the original large bordered2×2grid. Final
white surface uses original heading with solid primary accent secondline, four
open columns≥1024px connected by thin rail/arrows, numbered stages and56px
soft brand icon tiles. Tablet2columns; narrow compact56pxicon/text rows, subtle
bottom separators. Originalcopy/order and entrance behavior preserved. Fresh
1440/768/390/320captures inspected by main and independent reviewer.


Connected arrow trails: stage numbers removed at user request. Three desktop
rails carry sequential purple pulses toward the arrows (1.6s travel, 1.8s
phase spacing, 5.4s cycle). Motion runs only while visible on desktop and the
document is active, respects reduced motion and stops on unmount. Existing
entrance hook, copy, tokens and responsive layouts preserved. Current visual
evidence: `test-results/landing-hero/connected-flow-desktop-end.png` and
`connected-flow-mobile.png`.


Showcase exit fix: panels with successors fade completely over existing scroll
progress0.65–0.85 and are hidden/inert when covered; scrolling back restores them.
Results stays opaque because it has no successor. Narrow/reduced presentations
retain all content. Fresh `test-results/landing-hero/showcase-exit-desktop.png`
confirms the previous production panel no longer remains behind the last card.
