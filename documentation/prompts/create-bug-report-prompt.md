---
description: Prompt for turning informal reports into clear, actionable, correction-oriented technical bug reports.
---

# Prompt: Create a Bug Report

## Goal

Turn an error sketch or informal report into a professional, clear, actionable,
technically focused Bug Report that the development team can consume without
additional interpretation.

The report must explain what is broken, indicate where and why it is probably
broken, and provide brief correction guidance without specifying implementation
as a Spec. The result is always one Markdown document containing only the Bug
Report. This prompt does not create a correction Spec; request that separately
with `documentation/prompts/create-spec-prompt.md`.

## Input

- **Problem sketch:** free-form description of the observed error (symptom).
- **Technical context (optional):** device/OS/browser, environment (local,
  staging, production), and affected feature or flow.

## Applicable rules

Before diagnosing the bug, read `documentation/rules/rules.md`, the general
code-conventions rules, and every rule for the layers involved. Use rules only
to validate technical boundaries and patterns; do not turn the report into an
implementation Spec.

## Execution guidelines

1. Analyze the report by separating observed behavior from expected behavior
   and removing ambiguity.
2. Diagnose probable causes using `documentation/architecture.md`, the relevant
   PRD, the source of truth for affected data, contracts, and cross-layer
   mappings. Locate real critical nodes in the code: feature entry point,
   state control, remote call, use case, and persistence/integration. Look for
   similar implementations and established validation, error, and loading patterns.
3. Map only these layers: `core` (Use Cases), `rest` (HTTP Controllers and
   Services), `database` (Repositories, Mappers, Types), `provision` (Providers
   and external integrations), `rpc` (Actions), `ui` (Widgets, Stores,
   Contexts), `ai` (Workflows, Tools), `queue` (Inngest Functions), `web`
   (Pages, Layouts), and `studio` (Pages, Layouts).
4. Include only brief technical guidance about where the correction should act.
   Do not detail phases, tasks, signatures, new files, or a structured
   implementation list. Do not use sections such as “What already exists” or
   “What should be created/modified/removed”; those belong to a Spec.
5. After structuring the report, create or update the appropriate Jira ticket
   and finish by reporting its identifier or URL. Do not save individual Bug
   Reports in `documentation/` or create `documentation/features/**/reports/`.

Do not create or edit a Spec, include a Spec in the Bug Report, or treat the
task as incomplete because no Spec exists. The only deliverable is the Bug Report.

## Required output template

Use the following as the Jira ticket content. The complete report belongs in
Jira; the repository must not receive an individual Bug Report file.

```md
---
title: {Short Descriptive Title}
prd: <link to the relevant PRD, if any>
issue: <link to the bug issue>
apps: {web|server|studio}
status: {open|closed}
last_updated_at: {YYYY-MM-DD}
---

# Bug Report: {Short Descriptive Title}

## Identified Problem

{Objective description of the incorrect observed behavior. Avoid technical assumptions here.}

## Causes

{Concise list of probable technical causes, such as missing validation, inconsistent state, broken contract, or mapping error.}

## Context and Analysis

### Core Layer (Use Cases)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### REST Layer (Controllers and Services)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### Database Layer (Repositories, Mappers, and Types)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### Provision Layer (Providers)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### RPC Layer (Actions)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### UI Layer (Widgets, Stores, and Contexts)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### AI Layer (Workflows and Tools)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### Queue Layer (Inngest Functions)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### Web Layer (Pages and Layouts)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

### Studio Layer (Pages and Layouts)
<!-- Include only when applicable -->
- **File:** `{relative/path/to/file}`
- **Diagnosis:** {Explain what is wrong at this point.}

## Correction Guidance

{Short paragraph or list indicating the probable correction layer(s) and relevant file(s), without implementation tasks.}
```

## Constraints

- Do not invent file paths, methods, or contracts without codebase evidence.
- Always cite the problematic file; separate facts from hypotheses.
- Do not propose corrections that violate cross-layer contracts in `documentation/rules/`.
- Use only the listed layers and omit layers that do not apply.
- Do not incorporate a correction Spec or Spec-planning sections.
