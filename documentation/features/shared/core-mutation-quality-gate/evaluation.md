---
feature: "shared/core-mutation-quality-gate"
spec: ./spec.md
spec_revision: 1
status: in_progress
updated_at: 2026-10-08
---

# Evaluation

Evaluation of Spec revision `1` against the integrated candidate at `87889899b40272f0d47024280e195ba7697b54bb`.

Current result: AC-01 through AC-04 pass. Core's complete baseline/candidate mutation matrix and score gate passed on the current head. The overall PR CI remains red from Core type-check, Web formatting/complexity, and Server complexity failures that were also present on the prior PR head; these are outside the two feedback corrections and keep final Spec conclusion pending.

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
| EV-06 | Other PR CI | [Core CI](https://github.com/rafinel/scoops/actions/runs/37799984746), [Web CI](https://github.com/rafinel/scoops/actions/runs/37799984712), and [Server CI](https://github.com/rafinel/scoops/actions/runs/37799984713), same head | Core type-check fails in existing MRP/PDV use-case tests; Web fails on a formatter violation plus complexity; Server's regular job passes, but the Server complexity job fails. The same failures were present at prior head `8f7f282abfc29cab63d85b40c8ef4f647e59f6d8`. | failed |

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
| Tooling and SDD | `documentation/tooling.md`, `documentation/sdd.md` | in progress | Tooling documents revision-specific baseline dependencies and the allowed mutation-tool overlay. Final PR checks outside this Spec remain failing as recorded in EV-06. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| FND-01 | Correctness | [PR #52 review thread](https://github.com/rafinel/scoops/pull/52#discussion_r4220000083) | AC-01, AC-02, AC-03 | resolved | A/M/D status is retained; missing A/M candidate evidence fails, and only actual D is exempt. |
| FND-02 | Correctness | [PR #52 review thread](https://github.com/rafinel/scoops/pull/52#discussion_r4220000098) | AC-04 | resolved | Workflow installs target dependencies from its frozen lockfile, adds only pinned Stryker packages, and overlays the mutation launcher/configs; it no longer copies candidate regular config or links candidate `node_modules`. EV-04 verifies target-side execution. |
| FND-03 | Spec review | Independent Spec review | AC-01–AC-04 | resolved | Corrected the validation command, bounded the allowed overlay, required target-SHA/install evidence, and clarified that Billing exclusion skips score thresholds but not changed-file evidence completeness. |
| FND-04 | Correctness | Independent implementation review | AC-01 | resolved | Missing A/M candidate evidence is checked before Billing threshold exclusion; tests verify missing Billing data fails while low Billing scores remain excluded. |
| FND-05 | CI quality | PR CI on prior and current heads | final PR check gate | active | Core test type errors, Web formatting/complexity, and Server complexity remain from the prior PR head and are unrelated to these review findings. They are recorded as a PR delivery blocker; no unrelated source paths were changed in this task. |

## Lessons learned

- In a cross-revision comparison, preserve the status and environment provenance of each side; a passing aggregate is not proof that the compared evidence is complete or revision-correct. No additional tooling rule identified beyond the alignment added to `documentation/tooling.md`.

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| CI-01 | Core CI — mutation baseline/candidate shards and score | `87889899b40272f0d47024280e195ba7697b54bb` | Mutation matrix and score passed; regular Core job failed on type errors in MRP/PDV test files. | [Run 37799984746](https://github.com/rafinel/scoops/actions/runs/37799984746) |
| CI-02 | Web CI | `87889899b40272f0d47024280e195ba7697b54bb` | Failed on an existing formatting violation and complexity gate. | [Run 37799984712](https://github.com/rafinel/scoops/actions/runs/37799984712) |
| CI-03 | Server CI | `87889899b40272f0d47024280e195ba7697b54bb` | Server code, architecture, types, integration, coverage, and build passed; Server complexity gate failed. | [Run 37799984713](https://github.com/rafinel/scoops/actions/runs/37799984713) |
| CI-04 | Validation CI | `87889899b40272f0d47024280e195ba7697b54bb` | Passed. | [Run 37799984715](https://github.com/rafinel/scoops/actions/runs/37799984715) |

## Continuation handoff

- **Branch/candidate:** `codex/core-mutation-quality-gate`, implementation commit `87889899b40272f0d47024280e195ba7697b54bb`, PR #52.
- **Progress:** Spec revision 1 is in progress; AC-01 through AC-04 pass, and both requested PR review threads are resolved.
- **Interrupted/uncommitted paths:** This Evaluation update is uncommitted; pre-existing `design/onoreo.pen` remains user-owned and untouched.
- **Unfinished criteria:** None for this Spec; final PR conclusion is pending while FND-05 remains active.
- **Blockers and stale evidence:** Overall Core, Web, and Server check groups remain failed on both prior and current PR heads; see EV-06 and FND-05.
- **Latest checkers:** EV-01 through EV-06; independent Spec and implementation reviews passed after the Billing clarification.
- **Next useful action:** Publish this current Evaluation and Spec traceability in the existing PR; route FND-05 separately before claiming overall PR readiness.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-08 | Drafted Spec from direct request and two open P1 review threads; independent Spec review corrected the validation command and bounded the baseline tooling overlay. |
| 2026-10-08 | Implemented status-aware comparison and target-owned baseline setup; independent review found and corrected Billing's missing-evidence bypass. |
| 2026-10-08 | Current-head Core mutation shards and score gate passed; target baseline provenance verified in job logs. Recorded unrelated prior/current CI failures and kept final conclusion in progress. |
