---
description: Organization and implementation rules for module-owned database layers.
---

# Database Layer Rules

These rules apply to database code under `apps/server/src`.

## Database code belongs to the owning module

Each module must own its persistence implementation under:

```text
apps/server/src/<module>/database/
├── drizzle/
│   ├── mappers/
│   ├── models/
│   ├── repositories/
│   └── types/
├── <module>-database.module.ts
└── <module>-seeder.ts
```

A module must not define or import another module's tables, repositories, mappers,
or seed data. Cross-module relationships must use identifiers and the integration
mechanisms defined by the owning domains.

Every directory that exposes declarations must have an `index.ts` barrel. Barrel
files must only re-export declarations.

## Drizzle models are declarations, not classes

Drizzle schema declarations belong in
`database/drizzle/models`. Do not create schema classes or a module-local
`schema.ts`.

Declare each `pgTable`, `pgEnum`, or equivalent PostgreSQL declaration in its own
file. Model filenames must end in `-model.ts`, and exported values must end in
`Model`:

```ts
// intake-model.ts
export const intakeModel = pgTable('intakes', {
  // ...
})

// intake-status-model.ts
export const intakeStatusModel = pgEnum('intake_status', [
  // ...
])
```

The shared database schema used by Drizzle and migration tooling must re-export
the models owned by every module. Models remain defined in their module.

Migrations belong to the shared database migration infrastructure and must be
generated from that shared schema barrel. Do not hand-maintain a second schema
representation inside a feature module.

## Persistence types translate Drizzle records

Types that represent rows returned by Drizzle belong in:

```text
database/drizzle/types/entities/
```

Name them with the `Drizzle` prefix and infer them from the corresponding model:

```ts
export type DrizzleIntake = InferSelectModel<typeof intakeModel>
```

Do not leak a Drizzle row type into `packages/core` or use it as a domain entity.
Persistence-only insert, join, or projection types must stay under the module's
`database/drizzle/types`.

## Mappers define the persistence boundary

Every repository that returns domain data must use a mapper from
`database/drizzle/mappers`.

A mapper must expose `toDomain` when converting a persisted record into a domain
object. Do not add `toDrizzle` merely to copy an object unchanged. Add a write-side
mapping method only when the database representation genuinely differs from the
domain input.

The mapper is responsible for representation differences, including converting
database `null` values to domain `undefined` values when the domain declares a
property as optional.

```ts
export class DrizzleIntakeMapper {
  static toDomain(record: DrizzleIntake): Intake {
    return {
      ...record,
      closedAt: record.closedAt ?? undefined,
    }
  }
}
```

Mappers must not contain business rules. Business decisions belong to core use
cases.

## Repository contracts belong to core

Repository interfaces must be declared by the owning module under:

```text
packages/core/src/<module>/interfaces/
```

Repository names are plural, such as `IntakesRepository`. Method and parameter
names must describe the operation and target explicitly.

Use the following write vocabulary:

- `add(input)` inserts one record.
- `addMany(inputs)` inserts several records.
- `replace(id, changes, ...)` updates an existing record.
- `remove(id)` removes one record.
- `removeAll()` removes all records, only for explicit maintenance or seed
  workflows that require a full reset.

Do not use the ambiguous method name `save` for inserts or updates. Use explicit
parameter names such as `intakeId`, `changes`, and `expectedVersion` instead of
generic names such as `id`, `data`, or `value` when context would otherwise be
lost.

Do not use `delete` or `deleteAll` as repository method names; use `remove` or
`removeAll` instead.

Creation and update inputs are domain types, not database types. A repository
must not accept a Drizzle model or expose query-builder details in its contract.

`addMany` must:

- return an empty array without querying the database when its input is empty;
- perform one batch insert rather than one insert per item;
- return all inserted records mapped to domain objects.

## Drizzle repositories implement core contracts

Concrete repositories belong in `database/drizzle/repositories` and use the
`Drizzle<Plural>Repository` naming pattern:

```ts
@Injectable()
export class DrizzleIntakesRepository implements IntakesRepository {
  // ...
}
```

They must use the shared Drizzle database infrastructure, map returned rows to the
domain, and implement exactly the semantics declared by the core contract.
Repositories may compose queries and enforce persistence concerns such as
optimistic version matching, but they must not decide business policy.

## Repositories do not receive tests

Do not create test files for repository implementations, mappers, Drizzle models,
or database adapters. This prohibition applies to both isolated unit tests and
Testcontainers integration tests whose direct subject is a repository.

Business behavior must be covered by core use-case tests with mocked repository
contracts. Database behavior is validated indirectly through the server integration
tests for controllers or complete application flows that consume the repository.
Do not expose a concrete repository through a fixture solely to test it directly.

## Repository injection uses module tokens

Each module must declare its repository tokens under
`apps/server/src/<module>/constants`, following this shape:

```ts
export const INTAKE_REPOSITORIES = {
  intakes: Symbol('INTAKE_REPOSITORIES.intakes'),
} as const
```

All repository tokens must be `Symbol` values. Do not use string tokens such as
`'identity:clients-repository'`, even when the string is namespaced. Consumers
must always import and use the exported token constant; they must not recreate a
symbol or use a token literal directly.

The module database provider must register the concrete repository and bind the
token with `useExisting`. Export the token so consumers inject the interface
without depending on the Drizzle implementation:

```ts
{
  provide: INTAKE_REPOSITORIES.intakes,
  useExisting: DrizzleIntakesRepository,
}
```

Consumers must use `@Inject(INTAKE_REPOSITORIES.intakes)` with the core repository
interface as the TypeScript type. Never inject the concrete Drizzle repository
outside database infrastructure.

## Every module owns a seeder

Every persisted module must provide an injectable seeder at:

```text
apps/server/src/<module>/database/<module>-seeder.ts
```

The seeder must receive the module repository through its repository token and
delegate bulk insertion to `addMany`. It receives domain creation records; it must
not duplicate insert queries, construct Drizzle rows, or invent identifiers owned
by another module.

Register and export the seeder from the module's database module so application
bootstrap and integration tests can reuse the same entry point.

Seeders must also follow these rules:

- expose `clear()` for destructive reset and `run()` for data insertion;
- implement `clear()` through the injected repository contracts and their
  `removeAll()` methods; never import `DrizzleClient`, `DrizzleDB`, models,
  query builders, or SQL into a seeder or the seed orchestration entrypoint;
- implement `run()` through repository methods, normally `addMany()`, and pass
  domain creation records rather than persistence rows;
- use domain fakers for generated development records. Fixed credentials or
  other values required to make a development account usable may remain
  explicit;
- keep cleanup ownership inside module seeders. When foreign keys require an
  order, the central orchestrator must call the module `clear()` methods in
  dependency order before calling their `run()` methods;
- centralize execution in `apps/server/src/shared/database/seed.ts`. It must
  verify `HMS_SERVER_APP_MODE` is `dev` or `stg` before any cleanup or insertion,
  abort in every other mode, require `HMS_USER_SEED_PASSWORD` in `dev` and `stg`, and
  close the Nest application context in a `finally` block;
- expose the operation through the server's `db:seed` command. Running seeds
  must never be part of application bootstrap or production deployment. Staging
  deployment explicitly runs the seed after migrations, so its database is
  reset and repopulated on every server deployment.

## Server imports use aliases

Imports between files inside `apps/server/src` must use the `@/` alias. Keep
package imports such as `@nestjs/common` and `@hms/core/...` unchanged. Do not
introduce long relative imports between server modules.
