---
title: Accompaniment type selector displays its ID
issue: https://github.com/rafinel/scoops/issues/55
prd: documentation/prds/mrp.md#prq-08--accompaniments-and-accompaniment-types
status: open
last_updated_at: 2026-10-13
---

# Bug Report: Accompaniment type selector displays its ID

## Diagnosis

### Observed Failure

Issue #55 reports that the Type field in a Portion's Link accompaniment dialog
displays the registered type's UUID instead of its name. The issue identifies Web
in all environments but supplies no build version. Repository inspection confirms
the selected-value rendering defect described below; a live browser reproduction
and the issue's environment-wide scope were not independently verified.

### Expected Behavior

MRP PRQ-08 requires Managers to select an establishment-scoped accompaniment type
when linking an Accompaniment product to a Portion. The Type selector must display
that type's registered name, as requested by the issue. The UI label rules in
`documentation/rules/ui-layer-rules.md` require readable selected labels in closed
select controls while retaining canonical values in form state and transport.

### Root Cause

In `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/index.tsx`,
the Type select receives `value={typeId || null}`, but its `SelectValue` has only a
placeholder. Names are rendered inside popup `SelectItem` children; the root
receives neither an `items` label mapping nor an `itemToStringLabel` resolver, and
the value component receives no explicit selected-name child. The adjacent
Accompaniment selector already supplies `selectedProduct?.name` explicitly.

`apps/web/src/ui/shadcn/select.tsx` delegates directly to Base UI's Select root and
value primitives. Inspection of the installed Base UI implementation in
`apps/web/node_modules/@base-ui/react/select/value/SelectValue.js` and
`apps/web/node_modules/@base-ui/react/internals/resolveValueLabel.js` confirms that,
without an explicit child or label mapping, the selected string value is rendered
as its own label. For this field, that string is the type ID. The placeholder
applies when no value is selected; it does not translate a selected ID.

The ID is intentional form state, not evidence of missing names in persistence.
`apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/use-product-accompaniment-dialog.ts`
loads type items, watches `accompanimentTypeId`, initializes that ID during editing,
and submits it unchanged for linking or updating. `use-accompaniment-types-query.ts`
under `apps/web/src/ui/mrp/hooks/` delegates to the MRP service. The service in
`apps/web/src/rest/services/mrp-service.ts` retrieves `/accompaniment-types` and
preserves the returned type names in its page mapping.

`apps/server/src/mrp/rest/controllers/list-accompaniment-types.controller.ts`
delegates to `packages/core/src/mrp/use-cases/list-accompaniment-types-use-case.ts`,
which authorizes the Manager and scopes the query to the actor's establishment.
`apps/server/src/mrp/database/drizzle/repositories/drizzle-accompaniment-types-repository.ts`
selects complete type records, and its mapper preserves `name`. These inspected
boundaries supply the label data; no transport or database change is indicated by
this diagnosis.

The existing dialog component test supplies distinct type ID and name values but
asserts only that the Type combobox exists. It never asserts its selected text,
leaving this rendering defect uncovered.

### Affected Areas

- `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/index.tsx` — missing selected-name rendering in the Type control.
- `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/use-product-accompaniment-dialog.ts` — owns the selected ID and loaded types from which its display name can be resolved.
- `apps/web/src/ui/shadcn/select.tsx` — forwards Base UI selected-label behavior without inferring labels from popup children.
- `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/tests/product-accompaniment-dialog.test.tsx` — lacks a selected-label assertion despite providing distinct ID/name fixtures.

### Regression Risk

The same dialog supports linking and editing, including a preselected type during
editing. Label resolution must preserve selection changes, resets on opening,
unselected placeholders, and query loading/error feedback. Types load asynchronously
and the dialog requests only the first 100; a selected edit value may temporarily
or persistently be absent from that page. Display behavior must account for that
without exposing a UUID as a friendly label or changing the selected relationship.
Changing the shared Select primitive would affect other controls and widen risk.

## Correction Boundary

Correct selected-type name presentation at the owning accompaniment dialog boundary,
including its linking and editing states, and close the existing selected-label
coverage gap. Keep type IDs as the form and mutation values. Preserve type-management
navigation, validation, quantity and cost behavior, Manager authorization,
establishment isolation, and link persistence. This correction does not change
product intent, REST contracts, the database schema, or the shared Select contract.
