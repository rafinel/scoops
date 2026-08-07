---
description: Source organization rules for the shared core domain package.
---

# Core Package Rules

These rules apply to TypeScript source files under `packages/core`.

## Internal imports use core aliases

Imports between files inside `packages/core/src` must use the package aliases
declared in `packages/core/tsconfig.json`:

- `#identity/*` for Identity module declarations;
- `#shared/*` for shared declarations;
- the equivalent module alias for every other core module.

Do not use relative imports such as `../domain/entities/user` or
`./user-repository` inside the core. Include the `.ts` extension in alias imports:

```ts
import type { Entity } from '#shared/domain/entities/entity.ts'
import type { UserProfile } from '#identity/domain/structures/user-profile.ts'
```

Barrel files must also re-export through aliases. This keeps imports stable when a
file moves within its module and makes the module boundary explicit.

## Entity lifecycle types stay together

An entity and its lifecycle variants must live in the entity's file. Do not create
separate files for `EntityCreate` or `EntityUpdate` variants:

```ts
export type User = Entity & {
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>

export type UserUpdate = Partial<Pick<User, 'name' | 'email'>>
```

Other exported types should remain in their own source file when they represent
an independent domain concept. Non-exported helper types may remain in the file
where they are used. Barrel files named `index.ts` must only re-export
declarations and must not declare types of their own.

Types that are not actual behavioral contracts must not be placed in an
`interfaces` directory. Move them to the appropriate domain boundary:

- entities for entity-shaped data and entity lifecycle variants such as
  `UserCreate`, `UserUpdate`, `EstablishmentCreate`, and `EstablishmentUpdate`;
- structures for values, filters, parameters, configurations, and relationships.

Test helpers must reuse these domain entities and structures instead of declaring
parallel data shapes. An interface file should contain an `interface` contract, not
an arbitrary object type merely because the file is named `interfaces`.

## Entities use the shared Entity contract

Every domain entity must extend the shared `Entity` type with an intersection:

```ts
import type { Entity } from '#shared/domain/entities/entity.ts'

export type Intake = Entity & {
  sequenceNumber: number
  clientId: string
  createdAt: Date
  updatedAt: Date
}
```

Do not redeclare `id` inside the entity body. The identity comes from `Entity`.
Entity files belong under the owning module's `domain/entities` directory and
must have one exported type per file.

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

## Structures represent values and configurations

Structures do not have identity of their own. Use them for filters, request
parameters, value objects, relationships, and configuration data:

```ts
export type LegalExpertise = {
  readonly legalAreaId: string
  readonly legalTopicIds: readonly [string, ...string[]]
}
```

Normal structures should expose readonly properties. They must not contain a bare
`id` field; use an explicitly named reference such as `userId` or `establishmentId`
when the relationship itself is part of the value.

## Enum-like values use const objects

Do not model application enums as string-union types alone. Define the runtime
values and derive the type from the const object:

```ts
export const UserProfile = {
  Manager: 'manager',
  Operator: 'operator',
} as const

export type UserProfile = (typeof UserProfile)[keyof typeof UserProfile]
```

Use this pattern for statuses, profiles, categories, origins, and other finite
sets of values. Keep the const object and its derived type in the same file.
