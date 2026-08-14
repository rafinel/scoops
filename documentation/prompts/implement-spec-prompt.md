---
name: implement-spec
description: Orchestrate the direct implementation of a small Spec with Builder Direct, sensors, and an Implementation Judge in the current task.
---

# Implement a Spec Directly

Use for a small, cohesive Spec with `open` status:

```text
Orchestrator → Builder Direct → sensors → Judge Implementation Direct
```

Treat `evaluation.md` as a living evidence ledger. Any implementation change after
the initial sensor run or Judge assessment—including fixes, generated artifacts,
environment or seed behavior, and added tests—requires an evidence reconciliation
before completion: rerun the affected sensors, update test counts and findings, and
record the current evaluated revision. Do not claim an accepted Spec while
`evaluation.md` still describes an earlier diff.

1. Read the Spec, Architecture, Rules, and `documentation/tooling.md`. Preserve
   the PRD link in Confluence and all `jira_tickets` keys; consult them when
   the integration is available, without changing their states automatically.
2. Freeze the revision and base commit.
3. Create `Builder Direct` as a subagent and send the Contract, observable
   outcome, paths, Rules, Architecture, and applicable MCPs.
4. Inspect the diff; the Builder does not update the Spec, Plan, or state.
5. Run the actual workspace validation commands described in
   `documentation/tooling.md` (`lint`/`check:code`, `check-types`/`check:types`,
   and `test`); run integration or e2e when applicable. Do not run `build` on every
   retry; reserve it for the final Quality Gate, except when the change touches
   the bundler, exports, environment, Docker, workflows, or generated artifacts.
6. Create a read-only `Judge Implementation` sibling of the Builder. Send the
   Spec, revision, diff, criteria, Rules, Architecture, and official evidence.
7. If `failed`, immediately record the finding in `evaluation.md`, create
   `Builder Fix QG-<n>`, rerun only invalidated sensors, and invoke a new Judge
   only when the diff or evidence changes. After three identical failures,
   escalate to the user.
8. If `accepted`, record the assessment and evidence in `evaluation.md`, reconcile
   the final diff, validation counts, findings and evaluated revision, then route to
   `conclude-spec`.

For UI Specs backed by Pencil, the Builder and Orchestrator must also:

- inspect the relevant Pencil nodes, reusable components, variables, and target
  viewport before implementation;
- record an exact page/state → Pencil node ID mapping;
- preserve intentionally different page compositions instead of collapsing them
  into a generic shared visual;
- validate every mapped route manually with Browser-use via CDP at the exact
  design viewport, using screenshots plus accessibility-tree and DOM/layout
  comparison;
- iterate until material discrepancies are resolved and record the route, node
  ID, viewport, evidence, and findings in `evaluation.md`.

Manual UI validation uses Browser-use, not Playwright. Visual parity with the
mapped Pencil nodes is a required acceptance criterion for the Spec.

Do not create another implementation role or separate completion Judge, fork,
or new task.
