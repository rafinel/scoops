---
title: Fail-closed Core mutation comparison
status: in_progress
revision: 1
source:
  type: direct-request
  ref: https://github.com/rafinel/scoops/pull/52
scope:
  - Core package mutation score checker
  - Core package mutation baseline CI workflow
last_updated_at: 2026-10-08
---

# Fail-closed Core mutation comparison

## 1. Context and scope

**Objective:** Make the Core mutation quality gate compare complete, revision-correct evidence so incomplete candidate data or candidate-environment leakage cannot produce a misleading pass.

**Baseline and gap:** PR #52 compares target-branch and candidate mutation reports. The current checker treats any changed use-case with no candidate result like a deletion, and the baseline workflow can run with the candidate's dependencies and Vitest configuration.

**Depth:** Compact technical Spec. The change is limited to CI tooling and does not alter product behavior.

**Scope:** Preserve changed-file statuses when comparing candidate scores; exempt only actual deletions; fail closed when added or modified eligible files lack candidate results. Run baseline mutation tests using the target revision's source, workspace manifests, lockfile, regular Vitest configuration and dependencies, sharing only the pinned Stryker CLI/runner and the minimum candidate mutation configuration/launcher needed to execute the same eligible-file and shard contract.

**Exclusions:** Changes to mutation thresholds, module inclusion/exclusion, shard balancing, report content, product code, or ordinary package test behavior.

**Resolved decisions and accepted assumptions:** A missing candidate result for an added or modified eligible path is invalid evidence and fails the gate, including for temporarily excluded Billing files; Billing exclusion suppresses score thresholds, not evidence completeness. A path explicitly deleted by the change is exempt from candidate-score checks. The baseline may use the candidate's pinned Stryker CLI/runner plus `scripts/test-mutation.mjs`, `packages/core/stryker.config.mjs`, and `packages/core/vitest.mutation.config.mts` as the minimum mutation harness for the established eligible-file and shard contract. Baseline source files, test files and their discovery, package graph, lockfile, regular `packages/core/vitest.config.mts`, and installed non-Stryker dependencies remain target-owned. Candidate `node_modules` must not be copied or symlinked into the baseline worktree.

| Source requirement | Coverage | Boundary |
| --- | --- | --- |
| User request to resolve PR #52 feedback and the two open P1 review findings on fail-closed changed-file handling and baseline environment isolation | full | CI checker and baseline execution only; existing mutation policy and product behavior stay unchanged |

## 2. Implementation Contract

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | PR #52 review thread `discussion_r4220000083` | The comparison retains each eligible changed path's A/M/D status. Missing candidate scores for added or modified paths fail the gate, including temporarily excluded Billing paths; module exclusion skips score thresholds only. Only paths actually deleted by the change are exempt from candidate-score checks. Existing 70% changed/new-file and no-drop unchanged-file policies remain in force for included modules. |
| FR-02 | PR #52 review thread `discussion_r4220000098` | The target baseline is executed with source, test files and their discovery, workspace package manifests, lockfile, ordinary Vitest configuration, and installed non-Stryker dependencies from the target revision. Candidate tooling may provide only the pinned Stryker CLI/runner plus `scripts/test-mutation.mjs`, `packages/core/stryker.config.mjs`, and `packages/core/vitest.mutation.config.mts` to apply the established eligible-file and shard contract; it must not replace target-owned source/test selection, package graph, regular `packages/core/vitest.config.mts`, or dependencies. Candidate `node_modules` is never copied or symlinked into the baseline worktree. |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01 | Missing candidate evidence for added or modified eligible files fails closed | An A or M eligible path, including one in excluded Billing, has no candidate per-file score | The score checker compares the reports | The comparison fails and identifies the path as missing candidate evidence; Billing's score threshold remains excluded when data is present | Checker unit tests for included and excluded modules |
| AC-02 | FR-01 | Actual deletions remain exempt | A D eligible path has no candidate per-file score | The score checker compares the reports | The deletion is exempt and does not create a missing-candidate failure | Checker unit test |
| AC-03 | FR-01 | Existing score policy is preserved | Candidate and target contain complete reports | The score checker compares scores | Changed/new files still require 70%; unchanged files allow no drop; existing module policy is unchanged | Existing and focused score-checker tests |
| AC-04 | FR-02 | Baseline environment belongs to target revision | Target and candidate have different dependency/configuration state | CI runs target baseline and candidate measurements | Baseline uses target manifests, lockfile, source/test selection, ordinary Vitest config and installed non-Stryker dependencies, plus only the permitted pinned Stryker toolchain and minimum mutation harness | Workflow setup records target SHA and installs from the target worktree; inspection confirms no candidate dependency/config/node_modules overlay; successful PR mutation jobs |

## 3. Technical Contract

**Ownership and existing boundaries:** Repository tooling owns the change: `scripts/check-mutation-score.mjs`, its tests, and `.github/workflows/core-package-ci.yml`. `documentation/tooling.md` records the supported CI behavior. No Core production or product contract changes.

**Runtime and data flow:** GitHub Actions checks out and measures the target and candidate revisions, uploads separate shard reports, and passes both report sets to the existing score checker. The checker applies per-file and module policy to those reports.

**Public contracts:** No application APIs, package exports, domain events, or user-facing behavior change. The existing mutation report format and CI score thresholds remain compatible.

**Consequential constraints:** Missing/incomplete comparison evidence must not pass. Baseline dependencies and regular test configuration must come from the target revision. Only the minimum pinned mutation toolchain and mutation-specific configuration required to execute the baseline may be shared from the candidate.

**Persistence and generation:** No persistence, migration, or code generation changes.

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| Candidate result absent for changed path | Preserve Git A/M/D status and exempt only D | Treat every absent candidate result as deletion | Fail-closed behavior prevents incomplete reports from bypassing the new/changed-file floor. |
| Target mutation toolchain | Keep target's ordinary dependency/configuration environment and overlay only required pinned mutation tooling/harness | Copy candidate package/config files and `node_modules` into the target worktree | The target measurement must represent target code and dependencies; the candidate toolchain may be necessary to produce comparable reports. |

## 4. Validation Contract

| Acceptance | Checker and permitted boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| AC-01–AC-03 | Focused score-checker test suite and checker CLI on representative comparison inputs | A/M without candidate scores fails; D is exempt; thresholds and unchanged no-drop behavior remain | Evaluation.md |
| AC-04 | Workflow diff/setup inspection plus PR Core mutation workflow | Logs identify the checked-out target SHA and frozen target-lockfile install; baseline setup does not import candidate non-Stryker dependencies, regular test config, or `node_modules`; baseline and candidate shards complete and the report gate consumes both | Evaluation.md |

| Command | Purpose and prerequisites |
| --- | --- |
| `node --test scripts/tests/check-mutation-score.test.mjs` | Exercise score comparison edge cases using the repository's `node:test` test runner |
| `pnpm exec biome check scripts/check-mutation-score.mjs scripts/tests/check-mutation-score.test.mjs` | Check formatting and lint rules for changed JavaScript tooling |
| PR #52 Core CI | Verify target/candidate mutation execution and score gate on the integrated workflow |

## 5. Documentation alignment and revision history

| Authority | Applies to | Alignment |
| --- | --- | --- |
| `documentation/rules.md` and selected code/tooling rules | Tooling changes | Required rules selected and observed before implementation. |
| `documentation/tooling.md` | Mutation test and CI behavior | Updated to state revision-specific baseline dependencies/configuration and permitted shared mutation harness. |
| `documentation/sdd.md` | SDD workflow and artifact lifecycle | This direct-request technical change is traced by a compact Spec and Evaluation; no PRQ applies. |

| Revision | Date | Material change and reason |
| --- | --- | --- |
| 1 | 2026-10-08 | Initial contract for the two P1 mutation-gate corrections requested on PR #52. |
