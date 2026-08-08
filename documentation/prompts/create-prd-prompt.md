---
description: Prompt to research, interview and create PRDs complete with competitive analysis, target audience and interactive validation.
---

# Prompt: Create PRD

## Main Objective

Create a complete and deployable PRD from the text received by the command:

```bash
create-prd "<product or feature description>"
```

The PRD must be saved in:

```text
documentation/prds/<product-slug>.md
```

If an exit path is provided, use it:

```bash
create-prd "<text>" --output documentation/prds/my-prd.md
```

---

## Main Rule

Don't write the PRD right away.

First:

1. Research available materials.
2. Analyze related files, code, designs, and documents.
3. Conduct a rigorous user interview.
4. Resolve dependencies and contradictions.
5. Present a summary of understanding.
6. Wait for explicit confirmation.

Only after confirmation can the file be created or updated.

---

## Mandatory Skill: Grilling

Interview the user rigorously about all aspects of the product until
shared understanding is achieved.

For each question:

- ask only one question at a time;
- explain why the decision is necessary;
- present a recommendation;
- wait for the response before continuing;
- record the decision;
- identify dependencies with future decisions;
- challenge contradictions or risks.

Never ask multiple questions in the same message.

If information can be found in files, code, designs, tools
or internet, research before asking.

Decisions belong to the user. Don't make important decisions without
confirmation.

Do not perform PRD creation until the user confirms understanding is
correct.

---

## Command Input

The text received after `create-prd` represents the initial product context or
functionality.

Extract from it:

- problem;
- opportunity;
- module;
- audiences mentioned;
- functionalities;
- restrictions;
- referenced materials;
- decisions already taken.

If the text is empty or insufficient, ask an initial question requesting
context.

---

## Environmental Research

Before the interview:

1. Read the related PRDs.
2. Read project documentation and rules.
3. Inspect relevant code.
4. Inspect designs and prototypes.
5. Identify existing entities, flows and rules.
6. Look for contradictions between documentation, design and implementation.
7. Differentiate between facts found, confirmed decisions, hypotheses and decisions
   pending.

Don't ask the user something that can be discovered in the environment.

---

## Mandatory Market Research

Do up-to-date research on the internet about the competitive scenario.

Analysis:

- direct competitors;
- indirect competitors;
- manual alternatives;
- target audience;
- value proposition;
- relevant features;
- public prices, when available;
- strengths;
- limitations;
- market gaps;
- opportunities for differentiation.

Use official and primary sources as a priority.

Don't invent information. All factual information about competitors must contain
a source in Markdown.

Differentiate facts from inferences using expressions such as:

- `According to the source...`
- `The official page informs...`
- `Source-based inference...`
- `Not publicly identified...`

Research should guide recommendations, but not replace user decisions.

---

## Decision Tree

Investigate, one decision at a time:

1. Problem and opportunity.
2. Product objective.
3. Main target audience.
4. Secondary audiences.
5. Non-audience.
6. Jobs to Be Done.
7. Value proposition.
8. Competitive differentiation.
9. Scope of the first version.
10. Mandatory features.
11. Business rules.
12. Entities and relationships.
13. Main flows.
14. Empty states and errors.
15. Permissions and responsibilities.
16. Integrations and dependencies.
17. Data and snapshots.
18. Exclusions and side effects.
19. Success criteria.
20. UI/UX requirements.
21. Responsiveness and accessibility.
22. Non-functional requirements.
23. Out of scope.
24. Discarded decisions.

Do not ask questions about items already resolved in the materials or by the user.

---

## Question Format

Use exactly this format:

```text
Question [number] — [topic]

Context:
[Explain why this decision is necessary.]

My recommendation:
[Present an objective, justified recommendation.]

Question:
[Ask only one question.]
```

---

## Mandatory Confirmation

When all relevant decisions are resolved, present a summary
with:

- problem;
- objective;
- target audience;
- value proposition;
- competitive scenario;
- differentials;
- scope;
- critical rules;
- main flows;
- out of scope;
- remaining risks and hypotheses.

Then just ask this question:

```text
Is this understanding correct, and may I write the PRD?
```

Do not write the file until you receive explicit confirmation.

---

## PRD Mandatory Format

After confirmation, write the document in this structure:

### 1. Overview

Include product description, objective, problem solved and value delivered.

### 2. Target audience

Include primary audience, secondary audiences, non-audience, context of use,
pains, needs and Jobs to Be Done.

Use the format:

```text
When [context], I want [action], so that [result].
```

### 3. Competitive Scenario Analysis

Include market summary, direct and indirect competitors, manual alternatives,
competitive matrix, opportunities, recommended differentiators, sources and
distinction between facts and inferences.

Use the table:

| Solution | Public | Value proposition | Features | Public price | Limitations |
|---|---|---|---|---|---|

Don't fill cells with assumptions. Use `Not publicly identified` when
necessary.

### 4. Requirements

Each requirement must follow this format:

#### REQ-01 Requirement Name

- [ ] **Requirement Name**

**Description:** describe the expected behavior.

##### Business Rules

- **Rule:** mandatory behavior.
- **Validation:** condition and result.
- **Exception:** alternative behavior.
- **Dependency:** related module or entity.

##### UI/UX rules

- **Interface:** presentation of the functionality.
- **Feedback:** success, error and loading states.
- **Empty state:** behavior without data.
- **Action blocked:** reason and correction.
- **Responsiveness:** behavior on smaller screens.
- **Accessibility:** relevant requirements.

Use sequential requirements: `REQ-01`, `REQ-02`, `REQ-03`.

Use `[ ]` by default. Use `[x]` only when the implementation has been
checked.

Separate requirements with `---`.

### 5. User Flow

Use streams identified by letters:

```text
Flow A - Flow name

1. The user starts the action.
2. The system presents the state.
3. The user makes a decision.
4. The system validates:
   - Success: expected behavior.
   - Failure: message and preserved state.
5. The flow ends.
```

Include main flows, alternate flows, errors, empty states and destructive actions.

### 6. Out of Scope

List features explicitly excluded from the release.

#### Discarded during definition

Record considered and rejected decisions:

- **Alternative:** reason for rejection.
- **Previous rule:** rule that replaced it.

If nothing has been discarded, write:

- **Unidentified:** no alternative was formally ruled out during the
  definition.

---

## Quality Rules

The PRD must:

- be written in clear English;
- use normative language;
- maintain testable requirements;
- separate business rules from UI/UX;
- preserve confirmed decisions;
- point out dependencies;
- avoid duplication;
- maintain consistent nomenclature;
- do not invent facts;
- include sources in market statements;
- differentiate facts from inferences;
- record discarded decisions;
- do not include features outside the scope.

Before saving, validate:

- all requirements have a description, business rules and UI/UX;
- the flows cover the requirements;
- the target audience is reflected in the product;
- competitive analysis influences positioning;
- there are no contradictions;
- there are no relevant decisions pending.

If there is a relevant decision pending, come back to the interview and ask a question
at a time. Do not finalize the PRD until you reach shared understanding.

---

## File Execution

After generating the PRD:

1. Create the output directory if necessary.
2. Generate a human-readable slug for the file name.
3. Save to `documentation/prds/`.
4. If the file already exists, inform that it will be updated before overwriting it.
5. Verify that the file was created.
6. Display the final path and a summary of the generated content.

Final format:

```text
[RESEARCH] Environment analyzed ✅
[RESEARCH] Competitive analysis completed ✅
[INTERVIEW] Shared understanding confirmed ✅
[PRD] Generated: documentation/prds/<file>.md ✅
```

---

## Prohibited Behaviors

- Create the PRD before user confirmation.
- Ask multiple questions in the same message.
- Ask facts that can be researched.
- Invent competitor or price data.
- Present inferences as facts.
- Ignore contradictions.
- Change confirmed decisions without warning.
- Create requirements without verifiable criteria.
- Save file outside `documentation/prds/` without explicit instruction.
