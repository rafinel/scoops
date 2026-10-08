---
feature: "shared/core-mutation-quality-gate"
spec: ./spec.md
spec_revision: 1
status: completed
updated_at: 2026-10-08
---

# Evaluation

Evaluation of Spec revision `1` against implementation candidate `910e39b8745ddc64c7da75588fea3fe94d7259b3`.

Outcome: The fail-closed mutation comparison and target-owned baseline are implemented. AC-01 through AC-04 pass, the initial PR CI failures are resolved, and all applicable workflows passed on the implementation candidate recorded in EV-08. The Spec is complete; final closure-head checks are linked from PR #52.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-01 | EV-01, EV-02, EV-04 | passed |
| AC-02 | EV-01, EV-02, EV-04 | passed |
| AC-03 | EV-01, EV-02, EV-04 | passed |
| AC-04 | EV-04 | passed |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-01 | Tooling unit tests | `pnpm test:scripts` | 57 tests passed, including checker, mutation launcher, and report tests. | passed |
| EV-02 | Focused checker | `node --test scripts/tests/check-mutation-score.test.mjs` | 14 tests passed, including missing candidate A/M evidence, D exemption, Billing completeness, and Billing score exclusion. | passed |
| EV-03 | Workflow static validation | `pnpm exec biome check scripts/check-mutation-score.mjs scripts/tests/check-mutation-score.test.mjs`; PyYAML parse of `.github/workflows/core-package-ci.yml`; workflow mutation shell block `bash -n`; `git diff --check` | Biome clean; YAML and shell syntax valid; diff whitespace check clean. | passed |
| EV-04 | Core mutation CI | [Core CI run 37799984746](https://github.com/rafinel/scoops/actions/runs/37799984746), head `87889899b40272f0d47024280e195ba7697b54bb` | All four baseline shards, all four candidate shards, and the Mutation score job passed. Baseline logs show target SHA `0e5a79da37eac58280bcf345b5347be91f7c47db`, frozen target lockfile install, then Stryker 10.0.0 packages and mutation harness. | passed |
| EV-05 | Validation CI | [Validation CI run 37799984715](https://github.com/rafinel/scoops/actions/runs/37799984715), same head | Workflow passed. | passed |
| EV-06 | CI failure diagnosis | [PR checks at `0ce2bdf`](https://github.com/rafinel/scoops/commit/0ce2bdf92dcd01f179f64fe99cde179f668027aa/checks) | Core, Server, Validation, complexity, all eight mutation shards, and the mutation score gate passed. Web's 243 other browser tests passed; four delayed-transition cases queried `role=status` and removed artwork/card selectors after the UI changed to a top `role=progressbar` in `614c3f7d`. | resolved |
| EV-07 | Focused Web validation | `pnpm --filter web test:integration --workers=1 tests/shared/route-transition-feedback.test.tsx`; `pnpm --filter web check:types`; `pnpm exec biome check apps/web/tests/shared/route-transition-feedback.test.tsx`; `git diff --check` | 11 route-transition browser tests passed; Web types, Biome, and whitespace checks passed on candidate `910e39b8745ddc64c7da75588fea3fe94d7259b3`. | passed |
| EV-08 | Final PR CI gate | Candidate `910e39b8745ddc64c7da75588fea3fe94d7259b3`: [Core and mutation matrix](https://github.com/rafinel/scoops/actions/runs/37808649283), [Web](https://github.com/rafinel/scoops/actions/runs/37808649300), [Server](https://github.com/rafinel/scoops/actions/runs/37808649421), [Validation](https://github.com/rafinel/scoops/actions/runs/37808649468) | All applicable checks passed. Core regular CI, four target-baseline shards, four candidate shards, and the combined per-module mutation-score gate passed. Web's full 247-test browser suite passed. Server integration, coverage and build passed. Validation and all three package complexity gates passed. | passed |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |

## Visual evidence

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Repository rules | `documentation/rules.md`, `documentation/rules/code-conventions-rules.md` | passed | Selected before checker implementation. |
| Tooling and SDD | `documentation/tooling.md`, `documentation/sdd.md` | passed | Tooling documents revision-specific baseline dependencies and the allowed mutation-tool overlay. The final PR gate on the implementation candidate passes (EV-08). |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| FND-01 | Correctness | [PR #52 review thread](https://github.com/rafinel/scoops/pull/52#discussion_r4220000083) | AC-01, AC-02, AC-03 | resolved | A/M/D status is retained; missing A/M candidate evidence fails, and only actual D is exempt. |
| FND-02 | Correctness | [PR #52 review thread](https://github.com/rafinel/scoops/pull/52#discussion_r4220000098) | AC-04 | resolved | Workflow installs target dependencies from its frozen lockfile, adds only pinned Stryker packages, and overlays the mutation launcher/configs; it no longer copies candidate regular config or links candidate `node_modules`. EV-04 verifies target-side execution. |
| FND-03 | Spec review | Independent Spec review | AC-01–AC-04 | resolved | Corrected the validation command, bounded the allowed overlay, required target-SHA/install evidence, and clarified that Billing exclusion skips score thresholds but not changed-file evidence completeness. |
| FND-04 | Correctness | Independent implementation review | AC-01 | resolved | Missing A/M candidate evidence is checked before Billing threshold exclusion; tests verify missing Billing data fails while low Billing scores remain excluded. |
| FND-05 | CI quality | [PR checks at `8788989`](https://github.com/rafinel/scoops/commit/87889899b40272f0d47024280e195ba7697b54bb/checks) | final PR check gate | resolved | Fixed Core test typing errors, formatted the Web source, and regenerated the stale complexity snapshot using the official command. The refreshed snapshot captures warning-level functions already present on `origin/main`; independent review found no candidate-caused metric increase. All affected complexity workflows pass on `910e39b8`. |
| FND-06 | Test contract drift | [UI change `614c3f7d`](https://github.com/rafinel/scoops/commit/614c3f7df2f1150b1b8f36295f90426cc37247a5), EV-06 | Web browser CI | resolved | Updated route-transition integration assertions to query the current accessible progressbar and indicator and removed checks for the deleted loading card and animation. The focused suite and full Web CI pass. |

## Lessons learned

- In a cross-revision comparison, preserve the status and environment provenance of each side; a passing aggregate is not proof that the compared evidence is complete or revision-correct. No additional tooling rule identified beyond the alignment added to `documentation/tooling.md`.

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| CI-01 | Initial Core, Web, Server and Validation workflows | `87889899b40272f0d47024280e195ba7697b54bb` | Mutation gate and Validation passed; Core typecheck, Web formatting/complexity, and Server complexity exposed inherited CI failures. | [Core](https://github.com/rafinel/scoops/actions/runs/37799984746), [Web](https://github.com/rafinel/scoops/actions/runs/37799984712), [Server](https://github.com/rafinel/scoops/actions/runs/37799984713), [Validation](https://github.com/rafinel/scoops/actions/runs/37799984715) |
| CI-02 | Core, Web, Server, Validation and complexity checks | `910e39b8745ddc64c7da75588fea3fe94d7259b3` | All applicable checks passed, including the complete mutation matrix and score gate, all 247 Web browser tests, Server integration/coverage/build, and Validation. | [Core and mutation](https://github.com/rafinel/scoops/actions/runs/37808649283), [Web](https://github.com/rafinel/scoops/actions/runs/37808649300), [Server](https://github.com/rafinel/scoops/actions/runs/37808649421), [Validation](https://github.com/rafinel/scoops/actions/runs/37808649468) |

## Continuation handoff

- **Branch/candidate:** `codex/core-mutation-quality-gate`, implementation candidate `910e39b8745ddc64c7da75588fea3fe94d7259b3`, PR #52.
- **Progress:** Spec revision 1 is completed; AC-01 through AC-04 pass, both original PR review findings are resolved, and FND-05/FND-06 are resolved.
- **Interrupted/uncommitted paths:** Pre-existing `design/onoreo.pen` remains user-owned, untouched, and excluded from this delivery.
- **Unfinished criteria:** None.
- **Blockers and stale evidence:** None. The full implementation-candidate PR gate passes at `910e39b8745ddc64c7da75588fea3fe94d7259b3` (EV-08).
- **Latest checkers:** EV-01 through EV-08; independent Spec and implementation reviews passed. The implementation reviewer confirmed the refreshed complexity baseline matches `origin/main` with no candidate-caused metric increase.
- **Next useful action:** Review the final closure-head check results on PR #52 before merge.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-08 | Drafted Spec from direct request and two open P1 review threads; independent Spec review corrected the validation command and bounded the baseline tooling overlay. |
| 2026-10-08 | Implemented status-aware comparison and target-owned baseline setup; independent review found and corrected Billing's missing-evidence bypass. |
| 2026-10-08 | Current-head Core mutation shards and score gate passed; target baseline provenance verified in job logs. Recorded unrelated prior/current CI failures and kept final conclusion in progress. |
| 2026-10-08 | Corrected inherited Core/Web/Server CI failures and aligned route-transition browser assertions with the top progressbar; all applicable PR CI checks passed on `910e39b8745ddc64c7da75588fea3fe94d7259b3`. |
| 2026-10-08 | Closed Spec revision 1 after the implementation candidate passed all applicable CI gates; final closure-head checks are tracked on PR #52. |
