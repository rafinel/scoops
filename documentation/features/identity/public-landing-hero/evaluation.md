---
feature: identity/public-landing-hero
spec: ./spec.md
spec_revision: 9
status: in_progress
updated_at: 2026-10-11
---

# Evaluation

Evaluation of Spec revision 5 against the uncommitted candidate on `main`, base `496a5e34`.

Current revision7 result: pricing section implemented and scoped final evidence passed; historical broader-regression discrepancies remain unresolved. Prior showcase source, runtime and visual checks passed; broader regression retains unresolved failures. Historical result for earlier revisions: connected-operation overview, hero, canonical dashboard relocation and acceptance scenarios passed. Full regression completed: 250 passed, 5 unchanged PDV expectation mismatches failed. Independent implementation and visual reviews reconciled; all failures classified as accepted non-blocking baseline discrepancies, with no scoped blocker. The user-rejected spotlight has been replaced by the requested animated mesh field. Current mesh evidence passed scoped code/types/build, six landing route cases and manual animation/pointer/pause/reduced-motion/touch/context-loss checks. Candidate ready for local delivery; publication was not requested. Unrelated server/core/design/Billing changes preserved.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-01 | EV-03/24, MV-01/10, EV-38: public route, loaded image, desktop/narrow layout | passed |
| AC-02 | EV-03/24, MV-01/10, EV-38: CTA destinations, mobile menu and keyboard focus | passed |
| AC-03 | EV-03, MV-01: relocated route auth/profile/error matrix; anonymous live redirect | passed |
| AC-04 | EV-03/07: login, confirmation, application shell, global search and transition consumers | passed |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-01 | tooling | `pnpm --filter web check:playwright` | Browser health: 1 test passed before implementation | passed |
| EV-02 | design | Pencil exports via shared WSL UNC | Desktop 1392×1280/mobile 366×1145 references and 2x order assets exported and inspected | passed |
| EV-03 | browser integration | Focused landing, dashboard, login, shell, access-denied and confirmation suites; transition suite; isolated Manager dashboard rerun | 17 of initial 18 passed; Manager cold render blank during concurrent coverage/HMR. Isolated Manager rerun passed after resource-heavy coverage completed, without source correction or reported page/console/request failure. Four transition cases passed. See FND-02 | passed |
| EV-04 | routes | `pnpm --filter web generate-routes` | Public `/` and authenticated `/dashboard` metadata regenerated | passed |
| EV-05 | types | `pnpm --filter web check:types` | Passed before and after integrated candidate | passed |
| EV-06 | architecture | `pnpm --filter web check:architecture` | No violations across 908 modules and 3078 dependencies | passed |
| EV-07 | unit/coverage | `pnpm --filter web test:coverage` | 217 files / 576 tests passed. Statements 57.08%, branches 52.31%, functions 56.62%, lines 59.01%, above configured floors. Log: `/tmp/scoops-hero-coverage.log` | passed |
| EV-08 | code | `pnpm --filter web check:code`; diagnostic follow-up `pnpm --filter web exec biome check src --max-diagnostics=100` | Failed: 3 formatting errors in unchanged PDV cart/PDV tests, 19 existing warnings. Log: `/tmp/scoops-hero-code-full.log`; FND-03 | failed |
| EV-09 | complexity | `pnpm --filter web check:complexity` | Failed: unchanged PDV `handleRegistrationResponse`, length 75 > 70 and Halstead difficulty 1277.4 > 800; FND-03 | failed |
| EV-10 | build | `pnpm --filter web build` | Production build succeeded twice, final run after focus correction. Log: `/tmp/scoops-hero-build-final.log` | passed |
| EV-11 | full browser regression | `pnpm --filter web test:integration` | 250 passed / 5 failed in 21.1 minutes, exit 1. All five failures independently classified as unchanged PDV expectation mismatches (FND-04); all hero/dashboard/default-navigation cases passed. Log `/tmp/scoops-hero-integration.log` | failed |
| EV-16 | scoped code | `pnpm --filter web exec biome check src/ui/identity/widgets/pages/landing-page src/constants/routes.ts src/routes/index.tsx src/routes/_authenticated/dashboard/index.tsx src/ui/shared/widgets/components/icon`; `git diff --check` | Scoped source and whitespace checks passed | passed |

Mocked transport proves UI routing and authorization composition, not persisted authentication. No seed/reset was performed.

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| MV-01 | Playwright CLI `scoops-hero`, live web 4000 and server 3336 after Docker/service health checks | AC-01/02/03 | Public hero at 1440×1000 and 390×844, loaded illustration, keyboard menu/CTA, correct destination URLs; inspect console/network | Fresh captures inspected. Login and onboarding headings rendered; anonymous `/dashboard` reached `/login?returnTo=%2Fdashboard`. Menu Enter/Escape restored focus. Only anonymous session-probe HTTP 401 observed after server startup; `/api/auth/get-session` returned 200. No other current console errors/hydration warnings observed. 320px/reduced-motion behavior additionally proved by focused route suite | passed |

Initial browser inspection before server startup produced connection-refused errors; browser was reopened after Nest bootstrap/health 200. Those startup errors are historical, not current runtime evidence. Authenticated role checks use mocked transport; no real Manager/Operator session was claimed.

## Visual evidence

Historical pre-refinement captures are in ignored `/home/petros/projects/scoops/test-results/landing-hero/`, outside Playwright's cleared output directory.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-12 | visual | Public hero desktop | 1440×1000, full page | [Desktop](design/ojCkG.png) | `test-results/landing-hero/desktop.png` | Two-line heading, white 244px CTA, order stage match; approved omission of future section links | stale |
| EV-13 | visual | Public hero mobile | 390×844, full page | [Mobile](design/aXi1r.png) | `test-results/landing-hero/mobile.png` | Three-line title, full-width CTA, compact order match; approximately 4px intrinsic height difference; functional menu replaces design placeholder | stale |
| EV-14 | visual | Mobile keyboard focus | 390×844 | Focus requirement and mobile reference | `test-results/landing-hero/mobile-focus.png` | White focus outline visible on purple | stale |
| EV-15 | visual | Mobile open menu | 390×844 | Responsive navigation contract | `test-results/landing-hero/mobile-menu.png` | Login/trial items readable, contained and operable | stale |

Unaffected destination screenshots: `login-destination.png`, `onboarding-destination.png`, `anonymous-dashboard-redirect.png` in the same directory.

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rules | code-conventions, ui-layer, web-app-routing, widget-testing | Scoped implementation conforms | Reused Anchor/Icon/button/menu primitives, public route plus authenticated dashboard ownership |
| Design | documentation/design.md, design/handoff.md | Landing-only surface/display tokens documented | Existing operational palette retained; decorative mesh follows motion/visibility preferences |
| PRDs | Identity and Billing | Existing behavior preserved | No product rule amendment or implementation-checkbox change |
| SDD | spec revision 1 | Independent Spec, implementation and visual reviewers completed | Final regression completed and failures classified; no publication requested |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| FND-01 | scoped visual defect | Independent implementation review | EV-14 | resolved | Landing focus rule moved after equal-specificity global rule; fresh white focus capture inspected by reviewer |
| FND-02 | transient validation failure | Focused Manager dashboard case during concurrent coverage/HMR | EV-03 | resolved | Two cold blank-page failures retained as history; isolated rerun passed after coverage completed. Complete regression subsequently passed the Manager and authenticated public-root cases |
| FND-04 | pre-existing integration expectation mismatches | Independent implementation review and full regression | EV-11 | accepted_non_blocking | Four desktop/narrow accompaniment grouping assertions expect names without prices although HEAD renders prices; one order-total assertion expects `Acrescimo do canal` although HEAD renders the channel name/percentage. `git diff --exit-code HEAD -- apps/web/src/ui/pdv apps/web/tests/pdv` passed. These five cases remain failed; source and tests are unchanged and outside the hero/routing scope |
| FND-03 | pre-existing global quality failures | EV-08/09 | Global code/complexity checks | accepted_non_blocking | Independent implementation reviewer confirmed the three unchanged PDV formatting files and unchanged PDV handler are outside this bounded contract and non-blocking. No thresholds weakened or unrelated files edited; scoped source, types, architecture, unit coverage and build passed |

Independent implementation reviewer reported no remaining source findings after FND-01; visual reviewer inspected saved references and all four fresh hero captures and reported no relevant discrepancy.

## Lessons learned

Place surface-specific focus overrides after global rules when specificity is equal. Existing focus guidance was sufficient; correction does not require a new repository Rule.

## Continuation handoff

- **Candidate:** Uncommitted changes on `main`, base `496a5e34`; hero/route/test/docs/assets only are task-owned.
- **Progress:** Acceptance and independent reviews passed; EV-11 completed with 250 passed / 5 baseline failures.
- **Blockers:** No permission/input blocker. Global pre-existing failures retained as failed evidence and FND-03/04; no blocking scoped finding.
- **Next useful action:** No implementation work remains in this contract. Task-owned browser/web/server processes stopped after verification; shared Docker services retained. Review candidate or explicitly request publication. No commit, PR, Spec completion or PRD checkbox update requested.

## History

| Date | Event |
| --- | --- |
| 2026-10-10 | Rev1 approved scope; public `/` and explicit dashboard relocation; independent Spec review passed |
| 2026-10-10 | Hero and routes integrated; CTA class merging and focus cascade corrected; fresh captures and independent visual review passed |
| 2026-10-10 | Types, architecture, unit coverage and final build passed; global baseline failures recorded; complete browser regression started |
| 2026-10-10 | Full integration completed: 250 passed, 5 unchanged PDV failures independently classified non-blocking; local Evaluation ready, Spec remains in_progress pending any publication request |


## Pointer-light refinement evidence — 2026-10-10

User-requested visual-only extension within the existing FR-01/FR-04 contract.
`motion` 14.1.0 added to the Web manifest and pnpm lockfile. Unaffected route, coverage,
architecture and full-regression evidence above retained; the earlier visual captures
are historical references for layout, superseded for current surface appearance by
EV-20/21/22 below. No full-regression repetition was needed for this isolated decorative
change.

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-17 | code/types | Scoped Biome on landing surface/page/CSS; `pnpm --filter web check:types`; `git diff --check` | Passed; CSS reports only four existing reduced-motion `!important` warnings. Impeccable detector returned `[]` | stale |
| EV-18 | build | `pnpm --filter web build` | Passed with Motion dependency; `/tmp/scoops-hero-motion-build.log` | stale |
| EV-19 | browser | `pnpm --filter web test:integration tests/identity/landing-page.test.ts --reporter=line` | All 6 passed in 54.4s; `/tmp/scoops-hero-motion-browser-final.log`. Historical first attempt failed before tests because task-owned fallback dev server occupied 4001; stopped that server and reran successfully | stale |

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| MV-02 | Playwright CLI on healthy shared Web4000/Server3336; mouse left/right and exit; reduce preference before reload and during session; touch context390px; keyboard CTA and mobile menu | AC-01/02, FR-04 | Light follows mouse and fades, static reduced/touch surface, unchanged controls | Spring transform x196→1194.27, opacity0.9946→1 and exit<0.01; reduced CSS display none, transform remained frozen after pointer move and reload; touch display none/no overflow; keyboard and touch opened onboarding. Enter/Escape restored menu focus after awaiting menu closure (an initial immediate, unawaited focus read was premature). Only expected anonymous `/auth/session`401 and Motion development warning on explicitly enabling reduced motion observed; auth get-session200; no hydration error | stale |

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-20 | visual | Pointer left/right and idle | 1440×1000 fullpage | User NestJS screenshot; saved Pencil layout | `test-results/landing-hero/motion-left.png`, `motion-right.png`, `motion-desktop-idle.png` | Authorized darker purple gradient/light refinement, layout and readable contrast retained; independent visual review passed | stale |
| EV-21 | visual | Static touch and reduced motion | 390×844 touch;1440×1000 reduced | Existing mobile layout and fallback contract | `test-results/landing-hero/motion-mobile.png`, `motion-reduced.png` | Static ambient surface, decorative light hidden; no layout/overflow discrepancy | stale |
| EV-22 | visual | Mobile keyboard focus and open menu | 390×844 | Existing control/focus contract | `test-results/landing-hero/motion-focus.png`, `motion-menu.png` | Current surface captures preserve visible focus/menu | stale |

Independent implementation review found only the non-exported prop type, corrected
before delivery; no runtime logic changed after verification. Motion's installed spring
implementation cleans animations on unmount. Independent visual review inspected all
four pointer/idle/mobile captures and found no concrete defect. Task-created duplicate
Web/Server processes and the CLI browser were stopped; pre-existing shared services
were preserved. No seed/reset, commit or publication performed.


## Animated mesh correction evidence — 2026-10-10

The user rejected the spotlight approximation and identified the desired effect as
an animated mesh gradient. Previous pointer-light captures/checks are historical;
the current field is its replacement. Live reference inspection distinguished the
hero's evolving noise field and broad cursor influence from the footer's warp shader.
The implementation uses its own shader, existing purple tokens and new named
landing-ink token; no NestJS source/asset was copied.

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-23 | code/types/build | Scoped Biome; `pnpm --filter web check:types`; `pnpm --filter web build`; `git diff --check` | Passed on final mesh candidate. Logs `/tmp/scoops-hero-mesh-code-final.log`, `-types-final.log`, `-build-final.log` | passed |
| EV-24 | browser | `pnpm --filter web test:integration tests/identity/landing-page.test.ts --reporter=line` | 6 passed in 1.0m after scoped corrections; earlier mesh attempt also 6 passed. `/tmp/scoops-hero-mesh-browser-final.log` | passed |
| EV-25 | architecture | `pnpm --filter web check:architecture` | Passed 911 modules/3085 dependencies | passed |
| EV-27 | complexity | `pnpm --filter web check:complexity` | Exit1 retains the same two unchanged PDV errors (FND-03). Initial new renderer Halstead817.69 failure resolved by extracting geometry initialization; no current mesh threshold error | failed |
| EV-26 | visual | Fresh desktop/mobile, pointer/reduced and fallback screenshots with independent visual review | `test-results/landing-hero/mesh-desktop.png`, `mesh-mobile.png`, `mesh-left.png`, `mesh-right.png`, `mesh-reduced.png`, `mesh-fallback.png`, `mesh-mobile-menu.png`; all inspected and approved, authorized surface replacement, unchanged layout | passed_with_authorized_difference |


| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| MV-03 | Playwright CLI live Web4000/Server3336 with temporary GL draw/uniform instrumentation; fine mouse, offscreen spacer, reduced-motion toggle, touch390px, forced WEBGL_lose_context, keyboard/touch destinations | AC-01/02, FR-04 | Organic field evolves; broad pointer response; pause/resume when outside viewport; static reduced/touch field; readable fallback and usable controls | Continuous draw progression proved; mouse uniform x0.1444→0.8544 and exit influence0; offscreenPaused=true with resume; reducedStatic=true; touchStatic=true; overflow=false; keyboard/touch onboarding URLs/headings rendered; contextLossFallback=true. Temporary instrumentation belonged to CLI browser only | passed |

Historical attempts: initial code checks found nullable GL closure typing and canvas
aria-hidden/focus rules; corrected before current evidence. Initial manual preference
toggle showed continued drawing because installed Motion's reduced-motion hook did
not react live; replaced with explicit media-query change gating/cleanup, retest
passed. One subsequent manual timeout reused the previous reduced-motion browser
state; reset harness to no-preference and completed all checks. WebGL init/context
fallback gap from independent review corrected and verified through deliberate
context loss. The expected anonymous auth/session401 remains the only ordinary
console error; deliberate context-loss testing is classified as induced validation.

Independent implementation reviewer verified fallback correction and live media-query
lifecycle; no open findings. Independent visual reviewer inspected all seven current
captures and found no concrete defects. Browser CLI closed after verification;
existing shared Web4000/Server3336 and Docker services preserved. No business behavior,
route destination, database data, PRD checkbox, commit or publication changed.


## Pointer deformation verification — 2026-10-10

The user requested visible mesh movement as the mouse crosses the hero. Both noise
layers now use pointer-deformed coordinates, smoothed by Motion. Influence fades
on exit. The earlier EV-26 captures remain layout history; EV-29 supersedes them
for current pointer appearance. Route/lifecycle code is unchanged.

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-28 | code/build | Scoped Biome on `surface/landing-mesh.ts`; `pnpm --filter web build`; `git diff --check` | Passed; production build log `/tmp/scoops-hero-mesh-pointer-build.log` | passed |
| EV-29 | visual | Fresh desktop, pointer left/right, reduced, fallback and touch captures | `test-results/landing-hero/pointer-mesh-desktop.png`, `pointer-mesh-left.png`, `pointer-mesh-right.png`, `pointer-mesh-reduced.png`, `pointer-mesh-fallback.png`, `pointer-mesh-mobile.png`, `pointer-mesh-mobile-menu.png`; left/right inspected and show clear field displacement with readable copy and unchanged layout | passed_with_authorized_difference |

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| MV-04 | Playwright CLI `scoops-mesh-pointer`, live shared services, temporary shader time frozen to 0 and sampled edge pixels | AC-01/02, FR-04 | Mouse moves the field independently of autonomous animation; preserved fallbacks, pause and controls | Mouse x0.1441→0.8544 produced maximum RGB byte change138; frozenTime=0. Exit influence0, offscreenPaused=true, reducedStatic=true, touchStatic=true, overflow=false, contextLossFallback=true. Keyboard/touch CTA rendered onboarding at `/onboarding`. Only expected anonymous auth/session401 and deliberately induced context loss observed | passed |

Independent implementation review found no issue in the bounded shader correction.
Independent visual review inspected fresh pointer-left/right and mobile captures:
clear field displacement, readable controls/copy, unchanged layout and no clipping.
Temporary uniform/pixel instrumentation exists only in the CLI browser. Task-owned
CLI browser closed; shared Web4000/Server3336 and Docker services retained. No
commit, publication or product behavior change.


## Mesh definition verification — 2026-10-10

User requested a more defined background. Narrowed shader color transitions and
reduced grain increase contour definition and purple/ink separation using the
existing tokens. Independent source review found no issue.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-30 | code/visual | Scoped Biome; fresh Playwright CLI desktop/pointer/mobile/reduced/fallback captures | Passed. `test-results/landing-hero/sharp-mesh-{desktop,left,right,mobile,mobile-menu,reduced,fallback}.png` supersede EV-29 for current appearance. Desktop-left and mobile inspected: stronger definition, readable copy and controls, unchanged layout | passed_with_authorized_difference |
| MV-05 | runtime | Frozen-time pointer deformation; offscreen pause; reduced-motion toggle; touch390px; context loss; keyboard/touch onboarding | Passed: maximum RGB change193, influence fades on exit, offscreen/reduced/touch pause, no overflow, context fallback visible, both CTA destinations `/onboarding`. Only expected anonymous auth/session401; auth get-session200 | passed |

Shader compiled and rendered in the live browser. No build or regression-suite
repetition needed for the three shader constants; route/lifecycle code unchanged.
Task-owned CLI browser closed; shared services preserved.


## Stronger mouse response verification — 2026-10-10

User clarified that the mouse effect itself should be more evident. Increased
pointer displacement/local warp and localized highlight; a faster overdamped
Motion spring follows the pointer. Static appearance is unchanged. Independent
source review found no issues.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-31 | code/visual | Scoped Biome on surface; fresh Playwright CLI captures | Passed. `test-results/landing-hero/strong-pointer-mesh-{desktop,left,right,mobile,mobile-menu,reduced,fallback}.png` supersede EV-30 for pointer appearance. Left/right inspected: pronounced displacement and reshaping; copy/controls remain readable and layout fixed | passed_with_authorized_difference |
| MV-06 | runtime | Frozen-time pointer harness, offscreen pause, reduced-motion toggle, touch, context loss, keyboard/touch CTA | Passed: maximum RGB change197 at time0, exit influence0, all pause/static checks passed, no overflow, fallback visible, both destinations `/onboarding`. Expected anonymous auth/session401; get-session200. Four GPU ReadPixels stall warnings caused by browser-only pixel instrumentation, absent from production code | passed |

Task-owned browser closed; shared services preserved. No route/product changes.


## Intense mouse response verification — 2026-10-10

User explicitly requested much more intensity. Displacement1.6, local warp1.1,
glow0.5 and spring260/32/0.5 replace the prior pointer values; source review
confirmed bounded mixing, overdamped spring and preserved guards.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-32 | code/visual | Scoped Biome; fresh CLI captures | Passed. `test-results/landing-hero/intense-pointer-mesh-{desktop,left,right,mobile,mobile-menu,reduced,fallback}.png` supersede EV-31. Left/right inspected: pronounced reshaping/displacement, stronger local highlight, readable text/controls | passed_with_authorized_difference |
| MV-07 | runtime | Frozen-time pointer, exit, offscreen, live reduced-motion toggle, touch, context loss, keyboard/touch CTA | Passed: RGB difference159 at time0, exit influence0, pause/static/fallback checks true, overflowfalse, destinations `/onboarding`. Expected anonymous session401; four ReadPixels warnings induced by temporary browser-only instrumentation | passed |

CLI browser closed; shared services preserved. Static composition and routes unchanged.


## Hero entrance verification — 2026-10-10

User requested an entrance on hero elements. Page-owned useAnimate coordinates
navigation, title, copy, CTA and clipped order preview over0.86s. Visible markup
defaults; reduced-motion skip/live completion; keyboard/pointer activation
completes immediately. Independent implementation review has no open findings.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-33 | code/types/build | Scoped Biome; web check:types; web build; diff whitespace | Passed. Logs `/tmp/scoops-hero-entrance-types.log`, `/tmp/scoops-hero-entrance-build.log` | passed |
| EV-34 | regression | Existing landing hook tests and six landing integration cases | 3 hook URL-ownership tests and6 browser cases passed; `/tmp/scoops-hero-entrance-unit.log`, `/tmp/scoops-hero-entrance-browser.log`. Hook tests prove URL ownership, not animation behavior | passed |
| EV-35 | visual | Fresh CLI mid-sequence, completed desktop, live reduced and narrow reduced states | `test-results/landing-hero/entrance-{desktop-progress,desktop-complete,live-reduced,mobile-reduced}.png`; desktop progress/completed and mobile inspected: readable composition, unchanged final layout and no clipping | passed_with_authorized_difference |
| MV-08 | runtime | CLI browser-only WAAPI pause instrumentation; play, resize, live reduced preference, keyboard CTA, mobile menu | Five target groups animated, sampled title opacity0.941873/translateY1.51477 before finalopacity1. No resize replay; live reduction completes; keyboard onboarding URL/heading rendered; mobile reduced opacity1/transformnone, menu focus restored, overflowfalse. Expected anonymous session401 only | passed |

Historical checks: detached hook tests initially failed because jsdom lacks
matchMedia; guarded absent mounted scope before preference lookup, tests passed.
An optional no-JavaScript probe timed out at the pre-existing route shell without
hero markup; this is not claimed as no-JavaScript product support. The entrance
adds no CSS/SSR hidden state. Final focused harness passed after dropping that
out-of-scope probe. Scoped guard correction has no mounted-route behavior change.

Task-owned CLI browsers closed; shared services preserved. No product behavior,
route destination, PRD delivery state, commit or publication changed.


## Delayed entrance verification — 2026-10-10

User requested more delay between animations. Only start offsets changed to
0.1/0.35/0.65/0.95/1.25s, total1.85s. Independent source review: no findings.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-36 | code/visual | Scoped Biome; fresh CLI captures | Passed. `test-results/landing-hero/delayed-entrance-{desktop-progress,desktop-complete,live-reduced,mobile-reduced}.png` supersede EV-35 for pacing. Completed desktop inspected: final layout and readability preserved | passed_with_authorized_difference |
| MV-09 | runtime | Paused WAAPI sequence, completion, resize, live reduction, keyboard CTA and narrow menu | Passed. At150ms title still opacity0.35/translateY20 awaiting its350ms start; final opacity1. No resize replay, reduced/static true, focus restored, no overflow, CTA URL/heading `/onboarding`. Expected anonymous session401 only | passed |

No lifecycle/source contract change; previous types/build/regression retained.
Task-owned CLI browser closed; shared services preserved.


## Zero-opacity entrance verification — 2026-10-10

User explicitly requested opacity zero instead of partially visible starting
elements. All keyframes0→1; layout effect initializes opacity before paint after
reduced-motion guard. Focus capture completes entrance for first Tab. Independent
review finding about invisible keyboard focus resolved; no open source findings.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-37 | code/types/unit | Scoped Biome; check:types; three existing hook tests | Passed; `/tmp/scoops-hero-zero-entrance-types.log`, `/tmp/scoops-hero-zero-entrance-unit.log` | passed |
| EV-38 | visual | Fresh CLI current entrance/completed/reduced/narrow captures | `test-results/landing-hero/zero-entrance-{desktop-progress,desktop-complete,live-reduced,mobile-reduced}.png` supersede EV-36. Completed desktop inspected: final composition preserved | passed_with_authorized_difference |
| MV-10 | runtime | Browser-only native animation creation instrumentation, normal completion, resize, live reduction, first Tab, CTA and mobile menu | All five elements computed initialopacity0 and first native keyframe0; title progressed to0.583688 then final1. No resize replay; reduced/static true; mobile focus restored; overflowfalse; keyboard onboarding URL/heading rendered. First Tab focuses Scoops início and completes all opacity1. Expected anonymous session401 only | passed |

Two preliminary freeze harness attempts failed to pause Motion's playback
lifecycle; they were instrumentation failures, not claimed initial-opacity proof.
Final passive creation instrumentation verifies zero without modifying playback.
Task-owned CLI browsers closed; shared services preserved. No product/route changes.


## Connected section extension — revision2

User requested the next previously agreed landing section. Added FR-05/AC-05 to
the current contract; scope limited to static connected-operation presentation.
Existing evidence retained; new section evidence pending. Pencil MCP unavailable,
so no new Pencil inspection claimed.

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-05 | EV-42/43/44, MV-12: supplied four-stage reference, faithful copy, 1440/390/320px layout | passed |


## Connected overview integrated evidence — revision2

Independent PRD review confirmed MRP PRQ-03/06/07, PDV PRQ-03/08/09 and
Analytics PRQ-02/03/05 claims. Independent compatibility review passed after
AC-05 table/checker correction. Scoped implementation and visual reviews found
no blocking findings. Accidental handoff replacement during contract editing
was corrected: saved screenshot inventory, measured mappings and authorized
refinement history restored; new brief separate.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-39 | code/types/build | Scoped Biome; web check:types; production build; diff whitespace | Passed; `/tmp/scoops-connected-section-types.log`, `/tmp/scoops-connected-section-build.log`. Initial new-file formatting corrected with scoped Biome | passed |
| EV-40 | browser | Complete landing route suite | 7passed in50.5s, including new four-stage/copy and1440/390/320 case; `/tmp/scoops-connected-section-browser.log`. Uses mocked transport; no persisted integration claim | passed |
| EV-41 | visual | Fresh full desktop, section desktop and narrow captures | `test-results/landing-hero/connected-desktop.png`, `connected-desktop-section.png`, `connected-mobile-390.png`, `connected-mobile-320.png`; independent review confirms continuity, readable flow and no clipping. Reference is approved flow brief plus saved hero layout; no current Pencil capture | passed_with_authorized_difference |
| MV-11 | runtime | Live shared Web4000/Server3336 CLI, section scroll, four headings, reduced motion,390/320, keyboard menu/CTA | Ordered headings verified; no horizontal overflow; menu Enter/Escape restores focus; trial renders `/onboarding` and heading. Anonymous session401 expected; final round has no warnings. Earlier four GPU ReadPixels warnings coincided with screenshot capture | passed |

Minor source review landmark observation resolved by restoring original navigation
header outside the hero's main; new section remains a named region. Parent spacing
wrapper is a div. Final CLI capture/behavior round refreshed after this semantic
correction; no layout/style/route change and unaffected automated checks retained.
Task-owned browser closed; shared services/Docker preserved. Candidate is locally
ready for review; no commit, publication or PRD implementation checkbox changed.


## Supplied connected-section reference correction — revision3

The user supplied the intended section screenshot; it supersedes the inferred
rev2 purple/vertical composition. Reference saved as
`design/connected-section-reference.png`. White section, exact title/support/copy,
four columns and purple line icons now follow that reference. Earlier EV-41
captures are stale for section appearance. No domain behavior or margin claim.
Independent compatibility/source review passed without findings.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-42 | code/types/build | Scoped Biome; check:types; production build; diff whitespace | Passed. `/tmp/scoops-reference-connected-types.log`, `/tmp/scoops-reference-connected-build.log` | passed |
| EV-43 | browser | Complete landing route suite | 7 passed in55.2s; `/tmp/scoops-reference-connected-browser.log` | passed |
| EV-44 | visual | Fresh desktop section/full page and320/390px captures | `test-results/landing-hero/reference-connected-{desktop,desktop-section,mobile-390,mobile-320}.png`. Desktop and320px inspected against supplied screenshot: correct white/horizontal composition, exact copy and readable narrow stack | passed_with_authorized_difference |
| MV-12 | runtime | Live shared services, CLI section/heading order, narrow/reduced, keyboard menu/CTA | Organize/Produza/Venda/Acompanhe order, no overflow, menu focus restored, trial destination `/onboarding` and heading. Expected anonymous session401; screenshot-related GPU ReadPixels warnings | passed |

Shared Icon map/type extended for the reference’s line-chart and shopping-bag icons. Other
hero animation, routes and persisted data untouched. No Pencil operation claimed.


Independent visual comparison confirmed desktop/reference and320/390px matches,
with one small icon discrepancy: Venda initially used a clipboard. Corrected to
shared shopping-bag icon, refreshed CLI captures and scoped code/types checks.
No route/behavior changes after the seven-case suite. Reference remains the
user-supplied screenshot, not an inferred purple composition.

Final type validation passed (`/tmp/scoops-reference-connected-types-final.log`).
The refreshed desktop section was inspected after the shopping-bag correction;
the final CLI round had no warnings. Task-owned browser closed; shared application
and Docker services preserved. Candidate locally ready; no publication performed.


## Connected-section scroll entrance — revision 4

User-authorized visual motion preserves the supplied white reference and exact
copy. Six independently observed targets use scoped Motion entrances, once per
mount. Narrow targets have no stagger. Initial/live reduced motion, observer
fallback and cleanup retain visible defaults. Independent source review found a
queued observer callback race; disabled/preference guards corrected it, with no
remaining findings.

- Scoped Biome and web type check passed; `/tmp/scoops-connected-scroll-types.log`.
- Impeccable scoped detector returned no findings; `git diff --check` passed.
- Final Playwright CLI checks passed: desktop initially opacity0, scroll reveal,
  no replay,390px independent stage trigger, initial/live reduced motion,320px
  no overflow and keyboard menu focus. No page errors.
  `/tmp/scoops-connected-scroll-browser.log`.
- Fresh captures: `test-results/landing-hero/scroll-connected-desktop.png`,
  `scroll-connected-mobile-390.png`, `scroll-connected-mobile-320-reduced.png`.
  Desktop and320px inspected: reference composition/copy preserved.
- Anonymous session401 is expected. Existing mesh GPU ReadPixels warnings and
  Motion reduced-motion notice are environment/library diagnostics.
- JavaScript-disabled live dev probe returned an empty app body, so it does not
  establish no-JavaScript application support. Animation source introduces no
  hidden default inline styles; visibility fallback is scoped to the component.

No new committed tests or broad suites for this reversible visual refinement;
previous seven landing cases remain evidence for unchanged routes/copy only.
Task browser closed after validation; shared services retained. No publication.


## Showcase expansion — revision 5

User authorized NestJS-inspired three panels,8s rotations and scroll stacking.
New AC-06/07 pending; prior hero/connected/routing proofs retained for unchanged
claims. Source preview/code/CLI proofs refresh after integration. Shared services
and unrelated work preserved. No publication requested.


### Integrated showcase evidence — revision 5

Independent compatibility and source reviews passed. The visual review identified
unreadable scaled mobile previews and an ambiguous margin caption; both were
corrected and independently cleared against fresh320/390px and desktop captures.
Mobile previews now use intrinsic-height compact layouts with readable text.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-45 | code | Scoped Biome, types, production build, architecture and whitespace | Passed; `/tmp/scoops-showcase-types.log`, `/tmp/scoops-showcase-build-final.log`, `/tmp/scoops-showcase-architecture-final.log`. Complexity has only two unchanged PDV baseline errors, no new showcase threshold errors | passed_with_baseline |
| EV-46 | browser | Playwright CLI preflight and focused landing suite | Preflight passed; final expanded suite10/10 passed in1.7m, `/tmp/scoops-showcase-final-landing.log`. Previously failing landing CTA passes unchanged in isolation | passed |
| EV-47 | visual | Final desktop, overlapping panel and320/390px captures | `test-results/landing-hero/showcase-{sales-desktop,sales-combo,stacking,production-desktop,results-desktop,mobile-390,mobile-320}.png`; main inspection and independent review confirm reference-inspired overlap, legible narrow previews and truthful margin coverage caption | passed_with_authorized_difference |
| MV-13 | runtime | Live shared Web4000, keyboard, perspective, live reduced motion and narrow flow | `/tmp/scoops-showcase-cli.log`: keyboard passed, visible scale/tilt, live reduction reset,320/390 without overflow, no page errors. Anonymous session401 expected; final round0warnings | passed |
| MV-14 | lifecycle | Focus, hidden/offscreen pause and reduced preference during transition | `/tmp/scoops-showcase-lifecycle.log`: white2px focus outline; progress frozen when offscreen and under synthetic document visibilitychange; active transition reset to opacity1/identity with reduced motion. Synthetic visibility probe is not OS background-tab proof | passed |

Static application-style previews are illustrative, not authenticated integrations.
No API, business rule, route or pricing change is introduced by this expansion.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-48 | unit/coverage | Final web coverage suite |217files/576tests passed. Statements54.99%, branches51.05%, functions55.15%, lines56.86%; repository floors preserved. `/tmp/scoops-showcase-coverage-final.log` | passed |

The first default-worker full regression was intentionally interrupted and replaced
by a4-worker run. The parallel run exhibited unrelated missing-heading/loading
failures as well as a landing navigation failure; these are not counted as passed.
Resource pressure/HMR are hypotheses only. Focused final reruns and classification
remain pending. Historical250/5 regression evidence belongs to earlier revisions.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-49 | regression | Full4-worker browser run |223passed,23failed,13did not run in13.9m; `/tmp/scoops-showcase-regression-parallel.log`. Five PDV expectation mismatches match historical baseline. Eighteen additional missing-heading/loading failures remain unclassified; do not claim a clean full regression | failed |

Final landing run passed all10cases against the final source, including keyboard
selection,8s rotation/pause/resume, reduced-motion persistence,320/390px flow and
original CTA/routes. The parallel-run landing navigation failure was not
reproduced unchanged with one worker. This resolves scoped landing evidence,
but does not classify all other broad regression failures as environmental.
Task-owned browser closed; shared application/Docker services preserved.
No commit, PR, deployment or PRD requirement-state change performed.

Final isolated comparison: notifications loading/empty/error/retry and login
default dashboard both passed unchanged with one worker (2/2,33.2s),
`/tmp/scoops-showcase-isolated-regression.log`. Together with the landing CTA,
three parallel failures did not reproduce. Cause remains unproven. Fifteen
additional failures remain unclassified alongside the five known PDV mismatches;
13 full-suite cases were not run. Full regression is not declared passed.
All23 failure contexts were preserved in `/tmp/scoops-showcase-parallel-failures`.


### Progress-bar correction — revision5 follow-up

User observed empty progress bars. Reproduced on the live public page: hovering
any part of the panel stopped the timer; mouse feature selection also focused
the control and stopped it. Removed hover pause and limited automatic focus
pause to `:focus-visible` keyboard focus. Explicit pause, reduced motion,
offscreen/document visibility and covered-panel lifecycle gates remain.

Scoped Biome and web types passed (`/tmp/scoops-progress-types.log`). CLI proof
(`/tmp/scoops-progress-cli.log`) confirms passive hover advances5→20% in1.2s,
mouse selection advances4→19% in1.2s, keyboard focus freezes and390px has no
overflow. Fresh desktop/mobile captures: `test-results/landing-hero/
showcase-progress-desktop.png` and `showcase-progress-mobile.png`. Inspected: active
white progress is visible and layout remains intact. Anonymous session401
expected; existing Motion reduced-preference notice. Final scoped verification:9 unaffected landing cases passed in the10-case run;
the strengthened autoplay case initially used an unsuitable sticky scroll setup.
Corrected setup positions the section at its static anchor. Final focused case
passed in59.7s (`/tmp/scoops-showcase-modality-browser.log`) without relaxing
assertions/timeouts. It covers hover advancement, pointer selection, same-button
Space pause/pointer resume, Tab pause and explicit pause/resume.
Final types passed (`/tmp/scoops-progress-types-final.log`); independent source
review cleared the same-button input-modality correction. Fresh final captures
were inspected after that correction; `/tmp/scoops-progress-cli-final.log` passed.
Task-owned browser and test servers closed; shared services retained.


## Team extension — revision6

User-approved fan reference extends the existing public landing after showcases.
Scope: public illustrative team/profile/admin-history content and local selection.
IdentityPRQ-02/04/05/07/08/10 copy reviewed independently; no product rules or
delivery checkboxes change. check:playwright preflight passed1case14.9s before
implementation (`/tmp/scoops-team-preflight.log`). AC-08/09 pending. Historical
broad regression failures remain recorded; no claim that it is clean.


### Integrated team evidence — revision6

Independent contract compatibility and implementation reviews passed. Two narrow
visual findings were corrected: ordinary-motion320px fan overflow and flat reduced
mobile cards obscuring adjacent names. Reduced mobile now uses three separate
columns; ordinary mobile retains the fan with smaller cards/spread. A final
padding correction keeps Operador/Histórico whole at320px. No clipping workaround.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-50 | code | Scoped Biome, types, architecture, complexity and production build | Biome/types/architecture passed; `/tmp/scoops-team-types.log`, `/tmp/scoops-team-architecture.log`. Complexity only2unchanged PDV baseline errors, no new section errors. Final production build passed after padding correction; `/tmp/scoops-team-build-final.log` | passed_with_baseline |
| EV-51 | browser | Expanded focused landing suite | Initial12case run10passed/2team failures (heading textContent concatenation and reduced-card click interception). Heading assertion corrected to honor line break; layout overlap fixed. Final2team cases passed26.8s, `/tmp/scoops-team-section-final-browser.log`; other10cases retained | passed |
| EV-52 | visual | Nest fan comparison atdesktop and320/390ordinary/reduced | `test-results/landing-hero/team-{desktop,history-desktop,mobile-390,mobile-320,mobile-390-motion,mobile-320-motion}.png`; final captures inspected; independent visual review cleared320px labels, all names whole and readable | passed_with_authorized_difference |
| MV-15 | runtime | Shared live public page selection/focus/reduced preference | `/tmp/scoops-team-cli-final.log`: hover/click/Tab selection, live reduction preserving focus and removing transform,320/390 no overflow; ordinary320 all3selections checked. No page errors. Expected anonymous session401 and Motion preference diagnostic | passed |

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-08 | EV-51/52, MV-15; independent PRD/source review | passed |
| AC-09 | EV-51/52, MV-15; fresh narrow captures | passed |

This is public illustrative presentation; cards do not change actual user access
or expose authenticated data. Existing pricing/routes/product rules remain intact.
Prior coverage and auth/routing proofs are reused for unchanged claims. No broad
regression rerun for this section; historical failure evidence remains unresolved.

Final team scope locally validated. Independent source and visual findings closed.
Final CLI regenerated all captures after the last CSS correction; desktop/fan and
320px ordinary/reduced inspected. Task browser and owned test servers closed;
shared Web4000/Server3336/Docker retained. Evaluation remains in_progress for
historical broad-regression discrepancies, not a pending team implementation.
No commit, publication or PRD delivery-checkbox change.


## Pricing extension — revision7

User approved pale lavender split section, white offer panel and animated purple
light. BillingPRQ-01/02 copy independently checked:79,90monthly taxesincluded,
14daystrialwithoutpaymentmethod, allfeatures andunlimited users/products/orders/
movements. Existing onboardingCTA only. Preflightcheck:playwright passed1case22.1s
(`/tmp/scoops-pricing-preflight.log`). AC-10/11 pending; prior broaderregression
failures remainhistorical andnot declaredclean.


### Integrated pricing evidence — revision7

Independent Billing copy, Spec compatibility, implementation and visual reviews
passed. The source review identified native disabling of the animation control
as a live reduced-preference focus regression. Confirmed in Chrome (focus moved
to BODY), corrected to aria-disabled with a guarded handler and stable DOM.
Final CLI verifies preserved control focus and ineffective keyboard activation
under reduced preference. Initial focus probe timed out because its name changed;
corrected to stable scoped button. Native-disabled loss was separately reproduced.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-53 | code | Scoped Biome/types/architecture/complexity/build | Biome, final types, architecture and production build passed: `/tmp/scoops-pricing-types-final.log`, `/tmp/scoops-pricing-architecture.log`, `/tmp/scoops-pricing-build.log`. Complexity reports only2unchanged PDV baseline errors, no new pricing threshold errors; `/tmp/scoops-pricing-complexity.log` | passed_with_baseline |
| EV-54 | browser | Complete focused landing suite |13/13passed in2.7m, `/tmp/scoops-pricing-browser.log`. Offer/order/tax/unlimited limits/trial and320/390layout/keyboard onboarding CTA covered. Existing hero CTA assertions scoped to hero region to preserve semantics with the second CTA | passed |
| EV-55 | visual | Fresh desktop and320/390price section captures | `test-results/landing-hero/pricing-desktop.png`, `pricing-mobile-390.png`, `pricing-mobile-320.png`; independent comparison cleared split hierarchy, pale lavender/white adaptation and readable price/limits. Final captures regenerated after focus correction; main inspected desktop and320 | passed_with_authorized_difference |
| MV-16 | runtime | Live public page animation, pause/resume, visibility, reduced preference, keyboard and narrow | `/tmp/scoops-pricing-cli-final.log`: light transform changes, manual pause freezes/current-position resume works, offscreen/synthetic document.hidden pause, live reduced static light preserves animation-control focus, guarded Enter leaves state unchanged,320/390 no overflow, CTA renders `/onboarding` and heading. No page errors | passed |

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-10 | EV-54/55, MV-16; BillingPRQ-01/02 review | passed |
| AC-11 | EV-53/54/55, MV-16; focus correction/source review | passed |

Expected anonymous session401 and Motion reduced-preference diagnostic remain
environment/library observations. Synthetic document visibility is UI-lifecycle
proof, not OS background-tab proof. No authenticated billing/checkout integration
is claimed. No commercial rule, auth, pricing API, payment or persistence change.
Existing coverage/auth/routing evidence retained for unchanged claims. Historical
broad-regression failures remain recorded; this scoped success is not a clean
full-regression claim. Task browser and owned test servers closed; shared Web4000/
Server3336/Docker preserved. No commit/PR/deployment or PRD checkbox change.


Pricing button removal — user-authorized refinement: removed pause/resume control,
unused local pause state/handler and its CSS. Decorative Motion and initial/live
reduced-motion, offscreen/document-hidden gates retained. Prior manual-pause
evidence is historical and superseded for pricing. Scoped Biome/types passed
(`/tmp/scoops-pricing-no-button-types.log`). Fresh CLI confirmed no price-section
button and320px no overflow; desktop/mobile captures inspected:
`test-results/landing-hero/pricing-no-button-desktop.png`,
`pricing-no-button-mobile.png`; `/tmp/scoops-pricing-no-button-cli.log`.
No broad suite repeated for this reversible scoped removal; prior pricing offer/
CTA proofs retained. Browser closed, shared services preserved.


Pricing motion visibility correction — user reported a static-looking background.
Fresh CLI reproduced running controls but only13.7px horizontal movement in1.8s.
Independent source review found no lifecycle fault; the diffuse light's small
excursion was visually imperceptible. Increased travel, scale/opacity variation,
purple gradient intensity and cadence (10/12s). Scoped Biome passed.

MV-17: fresh reload and CLI confirmed first light moves from x=-5.7 to-207.9px
and opacity0.603 to0.788 over2.2s. Offscreen pause and live reduced-motion
freeze passed;320px no overflow, CTA keyboard focus intact, no animation control
and no page errors. Anonymous auth/session401 is expected; existing WebGL
screenshot-driver warnings remain environment observations, no hydration warning.
Fresh captures `test-results/landing-hero/pricing-motion-start.png`,
`pricing-motion-end.png`, `pricing-motion-mobile.png` inspected: visibly changing
light around the card, legible stationary copy/card, narrow layout retained.
Previous commercial/CTA evidence retained; broad-regression limitations unchanged.


MV-18 — further user-requested motion visibility: increased displacement from220
to420px, cycles10/12s to7/9s, stronger primary light stops50%/24%, wider scale
and opacity ranges. Supporting copy uses landing-deep85% to retain contrast.
Scoped Biome passed. Final fresh CLI `/tmp/scoops-pricing-strong-motion-cli.log`
shows first light x=-4.5 to-403.6px and opacity0.501 to0.920 over2.2s. Offscreen
and live reduced-motion freeze, no animation button,320px no overflow, CTA
keyboard focus and no page errors passed. Anonymous session401 remains expected.
Desktop start/end captures were regenerated at `test-results/landing-hero/
pricing-motion-start.png`, `pricing-motion-end.png`; narrow static fallback at
`pricing-motion-mobile.png`. Independent visual review confirmed clearly visible
background change and stable legible title/CTA/card; final darker-copy captures
inspected by main after correction. Previous screenshots at these paths are
superseded. Commercial/CTA evidence and broad-regression limitations unchanged.
Task CLI browser closed; shared services preserved.


MV-19 — pricing scroll entrance: per-element opacity-zero reveal and20px rise,
0.7s duration,0.16s desktop stagger, independent narrow entries. Read-only source
review cleared lifecycle/ownership. Scoped Biome and web types passed
(`/tmp/scoops-pricing-entrance-types.log`). Fresh CLI
`/tmp/scoops-pricing-entrance-cli.log` confirms four initial opacity0 targets;
intermediate title0.811/body0.061/CTA0/panel0; all reach1, no scroll replay,
keyboard focus reveals, initial/live reduced motion keeps content visible,320px
no overflow, no page errors. Initial validation probe needed to wait for mounted
targets and reset browser scroll history. Keyboard probe exposed the shared
button transition-all fading its restored opacity; scoped CTA transition now
excludes opacity/transform, and corrected full probe passed.
Fresh `test-results/landing-hero/pricing-entrance-desktop.png` and
`pricing-entrance-mobile.png` inspected: previous layout and readability retained.
Expected anonymous session401 remains unchanged; no clean broad-regression claim.
Task browser closed, shared services preserved.


MV-20 — blank showcase preview repair: reproduced user's blank Vendas/Produção
frames at1833px. Native JSX previews were mounted and sized; the Motion wrapper
remained opacity0. Replaced hidden initial state with initialfalse and explicit
opacity0→1/y10→0 keyframes, preserving visible default markup if playback does
not start. Reduced motion remains opacity1/y0. Independent source review cleared
the bounded change. Scoped Biome and web types passed
(`/tmp/scoops-showcase-repair-types.log`). Fresh reload confirmed all three wrappers
opacity1; `test-results/landing-hero/showcase-repaired-desktop.png` inspected
against the user blank screenshot, showing both app-style previews restored.
Fresh390px keyboard selection of Combos automáticos, live reduced-motion change
and ordinary selection of Estoque conectado retained all3visible wrappers; no
overflow/page errors: `/tmp/scoops-showcase-repair-cli.log`. Fresh mobile figure
`showcase-repaired-mobile.png` inspected: complete readable combo illustration.
Expected anonymous session401 and previously recorded driver warnings remain
environment observations. No new clean broad-regression claim. Browser closed,
shared services preserved.


### FAQ evidence — revision8

PRD audit supports copy: BillingPRQ-01/02, IdentityPRQ-01/02/04/05, MRPPRQ-07
and PDVPRQ-03/04/08. Trial starts with email confirmation, fixed individual
Gerente/Operador profiles, stock updates on registered production/sale; no payment
confirmation, custom permissions, store limits or backend change introduced.
Independent Spec compatibility and integrated implementation reviews cleared
FR12/13 scope, controls, single answer, lifecycle and cleanup.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-56 | code | FAQ integration and focused checks | Scoped Biome clean; types `/tmp/scoops-faq-types.log` and architecture `/tmp/scoops-faq-architecture.log` passed | passed |
| EV-57 | browser | Four question selections/keyboard/single answer and390/320 placement |2/2focused route tests passed43.7s, `/tmp/scoops-faq-browser.log`. Real owning controller with mocked transport; no server-backed auth claim | passed |
| EV-58 | visual | Supplied Nest composition adapted to purple/manual FAQ | Fresh `test-results/landing-hero/faq-desktop.png`, `faq-mobile-390.png`, `faq-mobile-320.png` inspected by main/independent reviewer: readable content, all questions retained, answer right/after selected, visible focus, no clipping. Initial arc was outside desktop; corrected to600px at top32/right0 and regenerated captures | passed_with_authorized_difference |
| MV-21 | runtime | Arc arrival and question selection | `/tmp/scoops-faq-cli.log`: transforms/opacity change, offscreen pause, live reduction static, keyboard selection, single answer,390/320no overflow and no page errors | passed |
| MV-22 | runtime | Finite arc lifecycle | `/tmp/scoops-faq-finite-cli.log`: finishes at4s, remains static and does not replay after viewport return | passed |

AC12/13 passed with EV56/57/58 and MV21/22. Decorative arc's document-hidden
listener/gate and cleanup verified in source review; no OS background-tab proof
is claimed. Expected anonymous session401, WebGL screenshot-driver warnings and
Motion reduced-preference diagnostic remain environment/library observations.
No hydration/page errors. No new API/payment/persistence/auth behavior, no PRD
checkbox changes, no commit/PR/deployment. Prior unmodified coverage/contracts
retained, historical full-regression limitations remain recorded. Task CLI and
focused suite processes closed; shared web/server/Docker services preserved.


### Closing and footer evidence — revision9

Independent Spec audit cleared FR14/15. Integrated review identified narrow
star playback contrary to static contract; gate now requires desktop fine pointer
as well as viewport/document eligibility. Final review cleared correction and
cleanup, deterministic decorative content, complete heading announcement, trial
destination and noninteractive pending legal labels. User explicitly requested
placeholders after confirming no legal URLs. No new legal route/content.

| ID | Layer | Scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-59 | code | Closing/footer scoped integration | Biome12files clean; webtypes `/tmp/scoops-closing-types.log` and architecture `/tmp/scoops-closing-architecture.log` passed | passed |
| EV-60 | browser | TrialCTA, narrow readable/static stars, footer destinations/placeholders and header navigation | Initial3focused cases passed1m `/tmp/scoops-closing-browser.log`; after desktop-motion gate correction final2closing cases passed26.8s `/tmp/scoops-closing-browser-final.log`, including ordinary-motion390/320static-stars assertion. Header Entrar assertion now scopes navigation to disambiguate footer link | passed |
| EV-61 | visual | Nest starfield adaptation and footer | Fresh `test-results/landing-hero/closing-desktop.png`, `closing-mobile-390.png`, `closing-mobile-320.png`, `footer-desktop.png`, `footer-mobile-390.png`, `footer-mobile-320.png` inspected by main/independent reviewer: centered hierarchy, sparse stars, readable CTA/trial, narrow full-white phrase and pending legal labels, no clipping | passed_with_authorized_difference |
| MV-23 | runtime | Stars/scroll/highlight/lifecycle/keyboard | Final `/tmp/scoops-closing-cli.log`: word highlight changes from mostly0 to first5fullylit; star layer transform/opacity changes; offscreen and syntheticdocument-hidden pause, live reduced static,390/320nooverflow, keyboardCTA reaches onboarding heading. No page errors | passed |

AC14/15 passed against EV59/60/61 and MV23. A reduced-motion freeze probe
initially sampled before browser preference/animation settling; verified paused
controls then reran with600ms preference settling and fresh page. Source star
circle changed from undefined radius-full token to50% geometry. Final visual
captures refreshed after corrections. Expected anonymous session401, WebGL
ReadPixels warnings and Motion reduced-preference diagnostic remain unchanged;
no hydration/page errors. Synthetic hidden check proves UI lifecycle, not OS
background-tab behavior. Static public UI/mock transport coverage does not claim
real authenticated server integration. Historical broad-regression limitations
retained; no full-suite cleanliness claim. Task browsers/focused suite processes
closed; shared dev servers/Docker preserved. No commit/PR/deployment or PRD
checkbox edits.


Connected overview appearance refinement — bounded visual-only change.
Original copy, sequence, list semantics and entrance hook preserved. Open4stage
rail replaces large2×2frame on desktop; tablet2columns/narrow compact rows.
ScopedBiome4files clean and webtypes passed
(`/tmp/scoops-connected-polish-types-final.log`). Initial implementation used an
unregistered arrow-right Icon key and failed runtime/typechecks; corrected to
existing canonical arrow key before final evidence. Initial route run recorded
the same failure; corrected focused route case passed28.3s
(`/tmp/scoops-connected-polish-browser-final.log`).

Fresh CLI `/tmp/scoops-connected-polish-cli.log` verifies1440four stages at same
yposition,768two columns,390/320vertical ordered content and no overflow. Six
entrance targets startopacity0 and finish1, no replay, initial/live reduced
contentvisible, no page errors after correction. Fresh captures
`test-results/landing-hero/connected-refined-1440.png`, `connected-refined-768.png`,
`connected-refined-390.png`, `connected-refined-320.png` independently inspected:
clearer sequence/hierarchy, legible paragraphs and no clipping/overlap. Original
`connected-polish-before.png` retained as comparison. Keyboard Home path
exercised with noninteractive list; no focusable controls added. Expected anonymous
session401 and Motion reduced-preference diagnostic remain, initial Icon errors
classified fixed; no hydration error in final run. Historical regression limits
retained. No domain/route/PRD/backend change; neighboring sections preserved.
CLI browser/focused test processes closed, shared dev services retained.


Connected arrow-trail refinement — removed stage numerals and added sequential
purple pulses on the three desktop rails. Scoped Biome (5 files) and web
TypeScript passed; focused connected-operation browser case passed (26.0s),
log `/tmp/scoops-connected-flow-browser.log`. Fresh Playwright CLI log
`/tmp/scoops-connected-flow-cli.log` confirms three pulse elements, changing
transform/opacity while visible, offscreen pause, static live reduced-motion
and 320px states, no numerals, no narrow overflow and no page errors.
Fresh captures `test-results/landing-hero/connected-flow-desktop-start.png`,
`connected-flow-desktop-end.png`, `connected-flow-reduced.png` and
`connected-flow-mobile.png`; desktop and mobile visually inspected: clear
arrow alignment, purple trail visible, copy and compact mobile rows preserved.
Document-visibility suspension and unmount cleanup independently reviewed;
no actionable issues. Expected anonymous auth/session 401, pre-existing WebGL
ReadPixels warnings and reduced-motion diagnostic remain; no new runtime error.
Original entrance behavior and noninteractive semantics unchanged. Historical
broader regression limitations remain; no full-suite claim, domain changes or
delivery action. Task CLI browser closed, shared development services retained.


Showcase exit correction: reproduced previous panels remaining opacity1 while
inert, exposing their upper edges behind Results. Added successor-only opacity
fade over existing anchor progress0.65–0.85 and covered visibility/inert/aria-hidden.
Reverse scroll restores the previous panel; Results has no successor and stays
opaque. Scoped Biome and TypeScript passed; two existing focused showcase
browser cases passed (keyboard selection and narrow/reduced presentation),
log `/tmp/scoops-showcase-exit-browser.log`. Independent source review found
no actionable issues. Fresh CLI `/tmp/scoops-showcase-exit-cli.log` confirms
production opacity1→0.45→0, previous panels fully hidden behind Results,
reverse restoration, last-panel exemption, keyboard feature selection, all
panels visible in reduced/narrow modes, no mobile overflow or page errors.
Initial CLI reduced-motion assertion sampled too early (350ms); inspected
settled DOM and reran with800ms preference/layout settling, all assertions passed.
Fresh captures `test-results/landing-hero/showcase-exit-before.png`,
`showcase-exit-desktop.png`, `showcase-exit-reduced.png` and
`showcase-exit-mobile.png`; desktop/mobile inspected: no preceding-card residue,
readable final preview, intact manual selection and focus treatment. Expected
anonymous session401 and existing WebGL/reduced-motion diagnostics remain.
Historical broader regression limitations retained; no full-suite claim.
No business, route, dependency or PRD checkbox change. Task browser closed;
shared development services preserved.


Commit scope audit: approved price amendment published separately. Landing,
/dashboard relocation, Motion dependency, scoped tests and design/evaluation
artifacts belong to this delivery. Inherited server/core PDV/seed changes,
Pencil document/export assets, the unrelated coverage peer lock normalization,
and later draft legal-page work are excluded and preserved locally. The index
retains the requested noninteractive legal placeholders and its corresponding
route metadata/test/design description; the working tree preserves later legal
links/pages unchanged. Current scoped Biome passed (78 files), production build
passed, types/showcase/connected focused evidence reused. Fresh complexity
check found landing pricing-entrance length and showcase-hook volume failures;
these require correction before publication. Legal renderer and unchanged PDV
complexity failures are outside the delivery. Historical EV49 regression
limitations (223 passed,23 failed,13 not run) remain; no full-suite cleanliness
claim. Spec remains in_progress; commit/push does not close delivery or mark PRD
requirements Implemented.


Final commit candidate: corrected both landing complexity findings with
behavior-preserving pricing visibility helper and showcase stacking hook.
Scoped Biome and TypeScript passed; full complexity still fails only the
inherited legal renderer and two unchanged PDV functions. Exact staged
checkout `/tmp/scoops-landing-candidate-p2bpn4tr` passed TypeScript and fresh
CLI scroll/opacity/reverse/final-panel, keyboard, desktop/mobile and reduced
checks. Pricing entrance initializes four targets at0, completes all at1;
footer retains three links and two visible Em breve placeholders. Fresh
`test-results/landing-hero/commit-showcase-desktop.png`,
`commit-showcase-mobile.png`, `commit-pricing-desktop.png`,
`commit-pricing-mobile.png`, `commit-footer-desktop.png`,
`commit-footer-mobile.png` inspected; no prior-card residue or narrow overflow.
CLI logs `/tmp/scoops-commit-showcase-cli.log` and
`/tmp/scoops-commit-pricing-footer-final-cli.log`.
Initial exact-candidate browser run:2passed/1failed; first cold page had only
toast region and no rendered landing. Isolated showcase/pricing rerun passed
2cases in26.8s without source correction; logs
`/tmp/scoops-landing-candidate-browser.log` and `-browser-final.log`.
Footer/narrow cases passed in first run. Fresh full-working-tree production
build passed (`/tmp/scoops-commit-build.log`); exact staged route metadata
and placeholder variants additionally checked through types, browser and CLI.
No real authenticated integration claim or full-regression cleanliness claim.
Commit hooks remain enabled. Excluded working changes and Specin_progress
state preserved; no PRD implemented-checkbox closure.


Revision10 legal inclusion — user explicitly approves including the previously
excluded draft legal pages, superseding the placeholder-only commit disposition.
FR15/AC15 footer links and FR16/AC16 public documents verified. Terms of Use
and Privacy Policy retain supplied draft text/provider values, version/date and
Minuta para revisão. Public leaf routes and regenerated tree, shared document
renderer, responsible/contact widget, reciprocal navigation and footer links
are included; server/core PDV, seed, Pencil/export assets and unrelated lock
normalization remain excluded. Extracted responsible widget preserves DOM/text
and fixes legal renderer complexity (Halstead813.02→532.7).

Validation: `pnpm --filter web generate-routes` passed; scoped Biome15files
passed (`/tmp/scoops-legal-code.log`); web types passed
(`/tmp/scoops-legal-refactor-types.log`); production build passed
(`/tmp/scoops-legal-build.log`). `pnpm --filter web test:integration
tests/identity/legal-pages.test.ts` passed9cases in2.0m
(`/tmp/scoops-legal-pages-browser.log`); focused landing-footer case also passed
1case in24.6s (`/tmp/scoops-legal-browser.log`). The initial grep selected only
that footer case; corrected separate legal suite supplies the nine-case evidence.
Full complexity remains failed only for two pre-existing unchanged PDV functions
(`/tmp/scoops-legal-refactor-complexity.log`); no scoped failure or threshold change.

Fresh CLI `/tmp/scoops-legal-cli.log` verifies direct public pages, draft labels,
skip-to-main focus, keyboard fragments/reload, footer/cross-document navigation,
390/320px without overflow and no page errors. Fresh captures
`test-results/landing-hero/legal-terms-desktop.png`, `legal-privacy-desktop.png`,
`legal-terms-390.png`, `legal-terms-320.png`, `legal-privacy-390.png` and
`legal-privacy-320.png`; desktop and320px inspected: clear reading hierarchy,
visible draft notice, wrapping header and prose. Independent implementation
review found no material findings. Expected anonymous session401 and existing
landing WebGL warnings remain; no new hydration/runtime error. Mocked profile
tests prove public route composition, not real authenticated server integration.
No full-regression or legal-sufficiency claim; draft status preserved.
Task CLI browser closed; shared development services retained. Commit/push
requested, Spec remains in_progress; no PRD delivery-checkbox edits.
