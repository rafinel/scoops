---
description: Research, interview, create and refine Scoops PRDs with product outcomes, actors, capability dependencies, user journeys and implementation-state traceability.
---

# Prompt: Create PRD

## Main Objective

Create or refine a complete product-authority PRD from the text received by the command:

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

Only after confirmation can the file be created or updated. When refining an existing PRD,
preserve unaffected product decisions and implementation checkboxes; migrate only the affected
requirements unless the user explicitly requests a complete document normalization.

---

## Mandatory Skill: Grilling

Interview the user relentlessly until shared understanding is achieved. Map the product as a
design tree: every decision branches into the decisions that depend on it.

Work the tree in rounds:

- The frontier is every decision whose prerequisites are already settled.
- Ask the whole frontier in one round, numbering each question and giving a recommendation.
- Format every round as:

  ```yaml
  ❓ **Q1** - **<question title>**: <question body, including choices when useful>

  ➡️ <recommended answer>

  ---

  ❓ **Q2** - **<question title>**: <question body>

  ➡️ <recommended answer>
  ```

- Wait for the user's answers before recomputing the next frontier.
- Research facts in files, code, designs, tools or the internet before asking about them. Perform
  repository research directly; do not delegate it to subagents.
- Keep decisions with the user; record decisions, dependencies and unresolved assumptions.
- Challenge contradictions, risks and scope creep.
- When the frontier is empty, present the shared understanding and ask for explicit confirmation.
- Do not create or update the PRD until the user confirms the shared understanding.

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
5. Identify existing entities, journeys, capabilities and rules.
6. Look for contradictions between documentation, design and implementation.
7. Differentiate between facts found, confirmed decisions, hypotheses and decisions
   pending.

Don't ask the user something that can be discovered in the environment.

---

## Conditional Market Research

Use up-to-date internet research when competitive positioning, pricing, alternatives or market
evidence materially affects the product decision. Do not force a competitive-analysis section
into every PRD.

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

Research should guide the Problem and Opportunity, Target Audience and Objectives sections, but
not replace user decisions. Preserve source links near factual market claims.

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
8. Competitive differentiation, when material.
9. Scope of the first version.
10. Mandatory requirements and their outcomes.
11. Actors, including autonomous System behavior.
12. Capabilities, constraints and invariants.
13. User-visible experience, states and recovery.
14. Consumed and provided product capabilities or authoritative facts.
15. Product dependency graph.
16. Entities and relationships when they affect product behavior.
17. User journeys.
18. Permissions and responsibilities.
19. Integrations and dependencies.
20. Data, history and snapshots.
21. Exclusions and side effects.
22. Success metrics.
23. Responsiveness and accessibility.
24. Non-functional product requirements.
25. Out of scope.
26. Discarded decisions.

Do not ask questions about items already resolved in the materials or by the user.

---

## Question Format

Use the YAML-style grilling format defined in `Mandatory Skill: Grilling`. Ask every currently
unblocked frontier question in the same round; do not ask one question per message.

---

## Mandatory Confirmation

When all relevant decisions are resolved, present a summary
with:

- problem;
- objective;
- target audience;
- value proposition;
- competitive scenario and differentiators, when material;
- scope;
- requirement outcomes, actors and critical capabilities;
- product dependencies and user journeys;
- out of scope;
- remaining risks and hypotheses.

Then ask this question:

```text
Is this understanding correct, and may I write the PRD?
```

Do not write the file until you receive explicit confirmation.

---

## PRD Mandatory Format

After confirmation, write the document in this structure:

### 1. Executive Summary

Include the product or module description, intended audience, core value and high-level product
operation. Keep this section concise and do not duplicate the detailed requirements.

### 2. Problem and Opportunity

Describe the current user or business problem, its impact, the opportunity being pursued and
the relevant differentiator. Include sourced market evidence only when it materially supports
the decision.

### 3. Target Audience

Include primary audience, secondary audiences, non-audience, context of use,
pains, needs and Jobs to Be Done.

Use the format:

```text
When [context], I want [action], so that [result].
```

### 4. Objectives and Success Metrics

Define a small set of product objectives and measurable success metrics. Metrics describe
product outcomes or operational quality; they are not implementation tests and do not replace
the Spec's `CA-*` acceptance criteria.

### 5. Requirements

Each requirement must follow this format:

#### REQ-01 — Requirement Name

- [ ] **Implemented**

**Outcome:** state the user or business result delivered by the requirement.

**Actors:** name every meaningful initiating or autonomous actor. Use repository profile names
such as `Manager` and `Operator`. Use `System` only when execution is autonomous, such as a
schedule, event reaction or webhook workflow; do not list System merely because backend code
processes a user action.

**Consumes:** list required product capabilities or authoritative facts, with the owning
`REQ-*` or business module. Omit when the requirement is self-contained. Do not put files,
DTOs, endpoints, programming types or implementation sequencing here.

**Provides:** list durable product outcomes or authoritative facts that another requirement or
module consumes. Omit when there is no meaningful downstream consumer.

##### Capabilities

- Define observable product behavior, validation, limits, state transitions, authorization,
  consistency, atomicity, history and exceptions.
- Use specific numbers only when they are approved product decisions or authoritative facts;
  never invent a limit merely to make the requirement appear precise.

##### Experience

- Define visible information, interaction, feedback, loading/empty/error/success/recovery
  states, responsive behavior and accessibility.
- Omit this subsection for a purely system-executed requirement with no user-visible effect.
- Keep end-to-end step sequences in User Journeys instead of duplicating them here.

Use sequential requirements: `REQ-01`, `REQ-02`, `REQ-03`.

Use `[ ]` for every new or materially amended requirement. Only `conclude-spec` may change it
to `[x]`, after conclusion preflight confirms the complete current requirement is delivered and
before the delivery commit and final PR CI. `create-prd`, `create-spec` and `implement-spec` do
not mark requirements implemented. If a checked requirement is materially amended, return it to
`[ ]` before the revised Spec is authored.

Separate requirements with `---`.

### 6. Product Dependency Graph

Add a Mermaid graph when the PRD has meaningful requirement or cross-module dependencies. An
edge `A --> B` means B consumes a product capability or authoritative fact provided by A. Derive
intra-PRD edges from `Consumes`/`Provides`; show external business modules as named nodes when
their capability is material.

The graph describes product dependencies, not file dependencies, implementation priority,
foundation work, execution waves or parallel delivery. Those belong in the Spec and Plan. Omit
the graph when it would contain no meaningful relationship.

### 7. User Journeys

Use journeys identified by letters:

```text
Journey A — Journey name

1. The actor starts the action.
2. The system presents the state.
3. The actor makes a decision.
4. The system validates:
   - Success: expected behavior.
   - Failure: message and preserved state.
5. The journey ends.
```

Group by actor or product outcome when that improves clarity. A journey may cross several
`REQ-*` requirements. Include main and alternate journeys, errors, empty states and destructive
actions without reproducing every Capability or Experience bullet.

Do not add a separate User Stories section. `Outcome`, `Actors`, `Capabilities` and User Journeys
already preserve the useful parts of a user story without creating a duplicate requirement
system.

### 8. Out of Scope

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
- maintain testable product requirements without duplicating Spec acceptance criteria;
- separate Capabilities from Experience;
- identify Actors for every requirement;
- keep Consumes, Provides and the Product Dependency Graph consistent;
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

- every requirement has an explicit implementation checkbox, Outcome, Actors and Capabilities;
- Experience is present for every user-visible requirement and omitted only with a reason clear
  from the requirement;
- every Consumes/Provides reference names a real requirement or module and agrees with the
  Product Dependency Graph;
- User Journeys cover the meaningful actor outcomes without becoming a second requirement list;
- no PRD-level acceptance-criteria or user-stories section duplicates the Spec contract;
- the target audience is reflected in the product;
- market research influences positioning when it was material to the definition;
- there are no contradictions;
- there are no relevant decisions pending.

If there is a relevant decision pending, return to the interview and ask the complete current
frontier in the next round. Do not finalize the PRD until you reach shared understanding.

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
[RESEARCH] Market analysis completed or classified as not applicable ✅
[INTERVIEW] Shared understanding confirmed ✅
[PRD] Generated: documentation/prds/<file>.md ✅
```

---

## Prohibited Behaviors

- Create the PRD before user confirmation.
- Do not skip unresolved frontier questions or silently assume their answers.
- Ask facts that can be researched.
- Invent competitor or price data.
- Present inferences as facts.
- Ignore contradictions.
- Change confirmed decisions without warning.
- Create requirements without verifiable criteria.
- Save file outside `documentation/prds/` without explicit instruction.
