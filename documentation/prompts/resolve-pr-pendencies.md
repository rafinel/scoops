---
name: resolve-pr-pendencies
description: Resolve CI checks and review conversations until the PR is mergeable.
---

# Resolve PR Pending Items

Work in the current session and always target the latest `HEAD`.

Use the PR, Spec, Confluence PRD, and associated Jira tickets as traceability
context. GitHub Issues and milestones are not part of this flow. Consult
Confluence/Jira when needed, but do not change status or content without explicit
instruction.

1. Inspect mergeable status, checks, and unresolved conversations.
2. Classify each pending item as a deterministic failure, test, build,
   environment, review feedback, or Spec/Architecture conflict.
3. Reproduce locally using the real scripts documented in
   `documentation/tooling.md`: `pnpm lint`, `pnpm check-types`, `pnpm test`, and
   `pnpm build`, plus integration/e2e when applicable.
4. Fix the cause within the smallest safe scope; do not disable rules or add
   exclusions to hide regressions.
5. Apply `format`, rerun invalidated sensors, and review the diff.
6. Reply to or resolve conversations only after the fix exists on the branch.
7. Push and wait again for the Quality Gate, tests, and build of the new `HEAD`.

A product, Contract, architecture, or security change must update normative
sources before proceeding. Finish only with green checks, resolved blocking
conversations, and a mergeable PR.
