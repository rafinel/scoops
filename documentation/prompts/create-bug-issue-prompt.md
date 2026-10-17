---
description: Create a concise GitHub bug issue from an observed product or technical failure.
---

# Prompt: Create Bug Issue

## Goal

Turn an informal defect report into one concise GitHub bug issue that records the failure,
expected behavior, reproduction and context needed for diagnosis.

The issue is the intake and tracking artifact. Do not diagnose the root cause, create a Bug
Report, create or edit a Spec, implement a correction, create a branch, commit changes or open a
pull request.

## Input

- **Problem sketch:** what failed and where it was observed.
- **Context (optional):** reproduction steps, expected behavior, device or platform,
  build or version, screenshots, and a related Story/Task issue when one exists.

If required intake facts are missing, inspect repository documentation for established product
behavior and ask only for information that cannot be discovered safely. Do not invent a
reproduction, environment, result or product expectation. Keep intake questions limited to facts
needed to establish the defect, reproduce it, or complete the canonical issue template.

## Grilling protocol

Before drafting the issue, build a design tree of the decisions that determine whether the report
is a valid bug and what intake context is needed. Work the tree in rounds:

- The frontier is every decision whose prerequisites are already settled.
- Ask the whole frontier in one round, numbering each question and giving a recommended answer.
- Use this format for every round:

  ```yaml
  ❓ **Q1** - **<question title>**: <question body, including choices when useful>

  ➡️ <recommended answer>

  ---

  ❓ **Q2** - **<question title>**: <question body>

  ➡️ <recommended answer>
  ```

- Wait for the user's answers before recomputing the next frontier.
- Research repository facts directly; do not ask the user for facts that can be inspected. Keep
  decisions with the user.
- Challenge contradictions between the report and the existing product contract, record resolved
  decisions and do not silently assume severity, affected profiles, scope or reproducibility.
- When the frontier is empty, present the shared understanding and ask for explicit confirmation.
- Do not draft or publish the issue until the user confirms the shared understanding. The existing
  issue approval gate still applies after the draft is prepared.

## Required repository context

Before drafting the issue:

1. Read `AGENTS.md` and applicable nested instructions.
2. Read `documentation/rules.md`.
3. Read `documentation/modules.md` to identify the owning module.
4. Read the owning PRD under `documentation/prds/` when the failure concerns product behavior.
5. Inspect existing source or tests only when needed to identify the affected application or
   distinguish the observed failure from intended behavior. Deep technical diagnosis belongs to
   `create-bug-report`.

## Product contract

When an applicable PRD requirement exists:

- use its Outcome, Actors, Capabilities and Experience to determine expected behavior and module
  ownership; and
- use relevant User Journeys only to clarify the reported path.

A defect means delivered behavior differs from the existing contract. Do not amend the PRD from
this workflow. If the requested expectation changes intended behavior, stop and route it through
the PRD amendment and feature workflow instead of filing it as a bug. The canonical issue body has
no PRD-requirement field: do not add one or use a `PRQ-*` link as the originating Story/Task.

## GitHub metadata

Create the issue in the current repository using only existing GitHub metadata:

- add the `bug` label;
- add `web` and/or `server` only when the affected application is known;
- do not create labels;
- assign the owning module's PRD milestone when a relevant module requirement exists; and
- do not assign a milestone when ownership cannot be established from repository evidence.

When a milestone is assigned, include a clickable link to that milestone in the proposed draft's
metadata and completion response. The issue's GitHub milestone field must also be set; do not add
an extra milestone section to the canonical issue body.

## Issue title

Use this format:

```text
Fix <short observable failure>
```

Describe the symptom or violated behavior, not a presumed technical cause.

## Issue body

Write the issue body in English, using only this structure. If the user explicitly requests
another language, translate the headings and content while preserving the same sections and
fields.

```md
## 🐛 Incorrect Behavior

{What happens and where it happens.}

## 🔁 Steps to Reproduce

1. {Starting state or precondition.}
2. {Action.}
3. {Observed result.}

## ✅ Expected Behavior

{What should happen according to the applicable product contract or established behavior.}

## 📱 Environment

- **Device/Platform:** {known device or platform, otherwise Not provided}
- **Build/Version:** {known build or version, otherwise Not provided}

## 🔗 Origin

{Link to the originating Story/Task GitHub issue, when one exists.}
```

Include the Origin section only when a source Story/Task GitHub issue is known; otherwise omit the
section entirely. Its link must point to that issue, not to a PRD requirement or a requirement
field. Keep unknown Device/Platform and Build/Version values explicit as `Not provided`. Omit
reproduction steps only when the reporter cannot yet reproduce the failure; in that case write
`Not yet reproducible` under Steps to Reproduce.

## Approval gate

Before writing to GitHub:

1. Present the exact proposed title, body and labels, plus the milestone as a clickable link when
   assigned.
2. Ask the user to approve the complete draft or request changes.
3. Revise and present the complete draft again when requested.
4. Create or update the issue only after explicit approval of the current draft.

Approval authorizes only the issue submission.

## Completion

After creating or updating the issue, report:

- issue number and URL;
- title;
- labels and a clickable link to the assigned milestone, when applicable; and
- a one-sentence summary of the reported failure.

Recommend `create-bug-report` as the next diagnostic workflow, but do not invoke it unless the
user requests diagnosis.

## Constraints

- Create exactly one GitHub issue unless the user explicitly requests decomposition.
- Keep the issue factual, concise and understandable without implementation knowledge.
- Separate observed behavior from expected behavior.
- Do not include root-cause hypotheses, affected file lists, correction guidance, acceptance
  criteria, manual validations, implementation tasks or a delivery route.
