---
description: Source organization rules for the shared core domain package.
---

# Core Package Rules

These rules apply to TypeScript source files under `packages/core`.

## One exported type per file

Every declaration written with `export type` must live in its own source file.
The filename must describe that exported type using kebab-case.

Do not declare two or more exported types in the same file:

```ts
// legal-catalog.ts — invalid
export type LegalArea = {
  id: string
  name: string
}

export type LegalTopic = {
  id: string
  name: string
}
```

Create one file for each exported type instead:

```ts
// legal-area.ts
export type LegalArea = {
  id: string
  name: string
}
```

```ts
// legal-topic.ts
export type LegalTopic = {
  id: string
  name: string
}
```

Non-exported helper types may remain in the file where they are used. Barrel files named
`index.ts` must only re-export declarations and must not declare types of their own.

## Business rules belong to use cases

Every business rule in `packages/core` must be implemented exclusively inside a
use case class under the owning module's `use-cases` directory.

Entities and structures describe domain state and valid data shapes. They must not
implement business decisions through methods, exported functions, computed getters,
validators, policies, specifications, or rule objects.

Do not create `domain/rules`, `domain/policies`, or `domain/services` directories to
hold business rules. For example, whether a document package can be confirmed must
be checked by a `ConfirmDocumentPackage` use case class, not by a
`canConfirmDocumentPackage` function.

Use cases may coordinate entities, structures, interfaces, errors, and events while
enforcing the rules required by one application action. Keep one exported use case
class per file and use a verb-led name that describes the action.

## Contracts belong to interfaces directories

Every contract exposed by `packages/core` must live in an `interfaces` directory
under the module that owns it. Never create a directory named `providers` inside
`packages/core`.

This rule applies to provider, repository, gateway, storage, and other contracts
implemented outside the core. Their declaration names must continue to describe
their specific roles, such as `ClientLookupProvider`, `DocumentBatchRepository`, or
`FileStorageProvider`; `interfaces` is the name of the organizational directory,
not a required suffix for each contract.

Place a contract in `shared/interfaces` only when it is intentionally shared by
multiple modules. An `interfaces/index.ts` barrel must only re-export declarations.
Implementations and infrastructure-specific details must remain outside
`packages/core`.

Identity authentication follows the same separation:

- `AuthProvider` is the behavioral contract and belongs in
  `packages/core/src/identity/interfaces`;
- `AuthCredentials`, `AuthSession`, `AuthStateChange`,
  `AuthStateChangeListener`, and `AuthUser` are shared data structures and belong
  in `packages/core/src/identity/domain/structures`;
- Supabase implementations belong in an application provision layer, not in the
  core package.

Consumers must import auth data structures from the structures barrel and the
provider contract from the interfaces barrel. Do not place provider-specific
types or Supabase imports in `packages/core`.

## Only entities have identity

Only declarations inside an `entities` directory may own a local domain identity
field named `id`. A structure represents a value, state, configuration, or
relationship without an identity of its own and therefore normally must not
declare an `id` property.

If a domain concept needs an `id` so it can be referenced, edited, removed, or tracked
independently, model it as an entity instead of a structure. Do not remove a necessary
identity merely to keep the declaration in `structures`.

Structures may contain explicitly named references to entities, such as
`consultationId` or `legalAreaId`. External identity projections are the narrow
exception: `AuthUser` may expose the provider's subject `id` because it represents
an external authentication identity, not a core aggregate entity. No other
structure should add a bare `id` field without documenting the same external
identity rationale.
