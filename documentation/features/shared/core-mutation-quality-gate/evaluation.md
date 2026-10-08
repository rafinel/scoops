---
feature: "shared/core-mutation-quality-gate"
spec: ./spec.md
spec_revision: 1
status: in_progress
updated_at: 2026-10-08
---

# Evaluation

Evaluation of Spec revision `1` against the current implementation.

Current result: Checker and workflow corrections are integrated locally. AC-01 through AC-03 pass focused and repository script tests. AC-04's workflow structure passes static checks, but target-side installation and report generation still need confirmation in the revised PR run.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-01 | EV-01, EV-02 | passed |
| AC-02 | EV-01, EV-02 | passed |
| AC-03 | EV-01, EV-02 | passed |
| AC-04 | EV-03 static checks; await PR mutation workflow with target baseline install evidence | pending |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-01 | Tooling unit tests | `pnpm test:scripts` | 57 tests passed, including checker, mutation launcher, and report tests. | passed |
| EV-02 | Focused checker | `node --test scripts/tests/check-mutation-score.test.mjs` | 14 tests passed, including missing candidate A/M evidence, D exemption, Billing completeness, and Billing score exclusion. | passed |
| EV-03 | Workflow static validation | `pnpm exec biome check scripts/check-mutation-score.mjs scripts/tests/check-mutation-score.test.mjs`; PyYAML parse of `.github/workflows/core-package-ci.yml`; workflow mutation shell block `bash -n`; `git diff --check` | Biome clean; YAML and shell syntax valid; diff whitespace check clean. | passed |

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
| Tooling and SDD | `documentation/tooling.md`, `documentation/sdd.md` | in progress | Tooling documents revision-specific baseline dependencies and the allowed mutation-tool overlay. Runtime evidence remains pending. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| FND-01 | Correctness | [PR #52 review thread](https://github.com/rafinel/scoops/pull/52#discussion_r4220000083) | AC-01, AC-02, AC-03 | resolved | A/M/D status is retained; missing A/M candidate evidence fails, and only actual D is exempt. |
| FND-02 | Correctness | [PR #52 review thread](https://github.com/rafinel/scoops/pull/52#discussion_r4220000098) | AC-04 | resolved | Workflow installs target dependencies from its frozen lockfile, adds only pinned Stryker packages, and overlays the mutation launcher/configs; it no longer copies candidate regular config or links candidate `node_modules`. PR execution remains needed to verify the install and reports in CI. |
| FND-03 | Spec review | Independent Spec review | AC-01–AC-04 | resolved | Corrected the validation command, bounded the allowed overlay, required target-SHA/install evidence, and clarified that Billing exclusion skips score thresholds but not changed-file evidence completeness. |
| FND-04 | Correctness | Independent implementation review | AC-01 | resolved | Missing A/M candidate evidence is checked before Billing threshold exclusion; tests verify missing Billing data fails while low Billing scores remain excluded. |

## Lessons learned

- In a cross-revision comparison, preserve the status and environment provenance of each side; a passing aggregate is not proof that the compared evidence is complete or revision-correct. No additional tooling rule identified beyond the alignment added to `documentation/tooling.md`.

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

- **Branch/candidate:** `codex/core-mutation-quality-gate`, current PR head `8f7f282abfc29cab63d85b40c8ef4f647e59f6d8`.
- **Progress:** Spec revision 1 is open; checker and workflow changes are integrated locally. Local automated and static checks pass.
- **Interrupted/uncommitted paths:** `documentation/tooling.md` and this feature directory are task changes; pre-existing `design/onoreo.pen` is user-owned and untouched.
- **Unfinished criteria:** AC-04 runtime evidence in the revised PR CI run.
- **Blockers and stale evidence:** Existing PR CI evidence predates all corrections; target-side install and report artifacts remain unverified.
- **Latest checkers:** EV-01, EV-02 and EV-03 passed after the Billing correction; independent implementation review confirmed that correction.
- **Next useful action:** Commit and push the integrated candidate, then record current PR CI evidence.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-08 | Drafted Spec from direct request and two open P1 review threads; independent review corrected the validation command and bounded the baseline tooling overlay. |
| 2026-10-08 | Implemented status-aware comparison and target-owned baseline setup; independent review found and corrected Billing's missing-evidence bypass. Local script, Biome, YAML, shell, and diff checks pass. |
