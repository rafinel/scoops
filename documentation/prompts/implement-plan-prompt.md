---
name: implement-plan
description: Orchestrate a feature Plan with sibling Builders, sensors, and a single Judge for the entire implementation in the current task.
---

# Implement a Plan

Read the Plan, Spec, Architecture, Rules, and `documentation/tooling.md`. Use
`documentation/rules/rules.md` to discover rules for the touched layers. The
Orchestrator maintains the Plan and the entire flow occurs in the current task.

Evidence is a living implementation ledger, not a one-time completion note. After
every implementation change—including Builder Fixes, post-Judge fixes, generated
artifacts, environment or seed changes, and added tests—the Orchestrator must update
the Plan and `evaluation.md` before claiming the phase or feature is complete. The
update must reconcile commands, test counts, affected findings, screenshots/browser
evidence, and the evaluated revision. Stale evidence must be marked historical or
replaced; never report completion using counts or findings from before the latest
diff.

Preserve the Confluence PRD link and every `jira_tickets` key from the Spec in
the Plan. Consult those records when integration is available, but do not
automatically change Jira or Confluence status, comments, or acceptance criteria.

For each phase:

1. confirm the Spec revision, dependencies, criteria, paths, and evidence;
2. mark the phase/task as `in_progress`/`implementing`;
3. create `Builder F<n>` for the main scope;
4. identify ready, independent tasks with no overlapping paths;
5. when real parallelism exists, create up to two sibling `Builder F<n>-T<m>` agents;
6. wait for Builders, inspect, and integrate the diff;
7. run the actual workspace validation commands documented in
   `documentation/tooling.md` (`lint`/`check:code`, `check-types`/`check:types`,
   and `test`); run integration or e2e when the phase requires it. Do not run
   `build` per phase or retry unless the change touches the bundler, exports,
   environment, Docker, workflows, or generated artifacts;
8. mark tasks `verified` only after applicable sensors pass;
9. do not create a Judge per phase; record the phase as `verified` after sensors
   and advance only when no sensor failure or blocking finding remains;
10. on failure, immediately record the finding in the Plan and `evaluation.md`,
    create Builder Fix, reopen affected tasks, and repeat only invalidated sensors.

For UI phases backed by Pencil, enforce this additional loop before marking the
phase verified:

1. Inspect the relevant Pencil nodes, reusable components, variables, and target
   viewport before coding.
2. Map each page and state to its exact Pencil node ID. Implement distinct
   compositions independently; share only structures that are actually shared
   by the design.
3. Validate every mapped route manually with Browser-use over CDP at the exact
   design viewport. Use the accessibility tree and DOM/layout inspection plus
   screenshots to compare the browser result with the Pencil node.
4. Iterate on material discrepancies and record route, node ID, viewport,
   evidence, and remaining findings in the Plan/evaluation. Manual UI validation
   must use Browser-use, not Playwright.

Visual parity is an exit condition, not optional polish. Do not mark a UI phase
or the implementation accepted while material Pencil-to-browser differences
remain unresolved.

Builders do not create subagents or edit the Plan. Judges do not edit files. The
Orchestrator records decisions, summarized evidence, findings, attempts, and
the next action in the Plan; formal assessments and final evidence belong in
`evaluation.md`, leaving only the summary and reference in the Spec. Phases do
not receive Judge verdicts.

After all phases are verified, run integrated sensors. When integration needs
additional assessment, first perform a preflight of the database, Auth, local
services, test credentials, and Browser-use CDP for manual UI flows. Then create
exactly one read-only
`Judge Implementation Final` to assess the entire implementation; `build` runs
only in the final Quality Gate. Then route to `conclude-spec`.

The final Judge is the only implementation-judgment unit. If it returns
`failed`, create Builder Fix, rerun invalidated sensors, and reuse the same Judge
to reassess the updated diff. Do not create a phase Judge, retry Judge,
separate completion Judge, or second Judge for the same implementation.

Do not create another implementation role or separate completion Judge, fork,
or new thread.
