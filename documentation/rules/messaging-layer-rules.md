---
description: Ownership, registration, event schema, job implementation, endpoint, and testing rules for server messaging.
---

# Messaging Layer Rules

These rules apply to messaging infrastructure under
`apps/server/src/shared/messaging` and module-owned jobs under
`apps/server/src/<module>/messaging`.

## AppModule is the messaging composition root

The root `AppModule` owns the single application-wide Inngest registration:

```ts
InngestModule.forRoot({
  client: inngest,
  functions: inngestFunctions,
})
```

Keep this call in `apps/server/src/app.module.ts`. Do not move feature job imports
into `shared/messaging`, and do not call `InngestModule.forRoot` from feature
modules. The root module is the boundary that may compose shared infrastructure
with functions exported by feature modules.

There must be exactly one root Inngest registration. Calling `forRoot` more than
once may create duplicate endpoints, clients, or function registrations.

## Shared messaging owns only transport infrastructure

Reusable Inngest integration code belongs under:

```text
apps/server/src/shared/messaging/inngest/
├── inngest-client.ts
├── inngest-controller.ts
├── inngest-job.ts
├── inngest-options.ts
└── inngest.module.ts
```

This layer owns the configured client, dynamic Nest module, serve endpoint,
registration options, and base job contract. It must not import a feature module
or a feature-owned job.

Shared messaging may translate between NestJS and the Inngest SDK. It must not
contain business rules, email content, billing policy, inventory decisions, or
other module-specific behavior.

## Feature modules own their jobs

An Inngest job belongs to the module whose capability performs the work:

```text
apps/server/src/<module>/messaging/inngest/jobs/<action>-job.ts
```

For example, sending an invitation email belongs to Communication:

```text
apps/server/src/communication/messaging/inngest/jobs/send-invitation-email-job.ts
```

Use kebab-case filenames ending in `-job.ts` and PascalCase class names ending in
`Job`. Correct spelling is part of the public job identity; do not keep duplicate
or misspelled job files.

## Every job extends InngestJob

Each job class must extend the shared `InngestJob` base and retain exactly one
created function in its readonly `function` property:

```ts
@Injectable()
export class SendInvitationEmailJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'communication/send-invitation-email',
        triggers: [sendInvitationEmailEvent],
      },
      SendInvitationEmailJob.handle,
    )
  }
}
```

Do not call `createFunction` without retaining its result. The function registry
must receive the returned `InngestFunction`, not the job instance.

A job class defines transport orchestration only. Domain decisions belong in
core use cases, and reusable external capabilities belong behind core contracts
and server adapters.

## Function identifiers are stable and namespaced

Function identifiers use this form:

```text
<owning-module>/<imperative-action>
```

Examples include `communication/send-invitation-email` and
`billing/process-payment-webhook`.

An identifier is an operational identity visible to Inngest. Do not rename it as
part of an unrelated refactor. A deliberate rename requires checking deployment,
in-flight runs, observability, and cancellation references.

## Trigger names come from core event classes

Every Inngest trigger that consumes an application event must import its event
class from `@scoops/core` and use the class's static `_NAME` value:

```ts
import { UserRegistrationAttemptCreatedEvent } from '@scoops/core/identity/domain/events'

const event = eventType(UserRegistrationAttemptCreatedEvent._NAME, {
  schema: z.object({
    // Event payload schema
  }),
})
```

Do not repeat an event name as an inline string in a job. The core event class is
the canonical source for its name and prevents the producer and consumer from
silently drifting apart.

When a required event class does not exist, define it in the owning module under
`packages/core/src/<module>/domain/events`, export it through the module's events
barrel and package export, and then consume `_NAME` from the server job. Do not
create an infrastructure-only event class inside `apps/server`.

Core event names use a stable, namespaced form:

```text
identity/user-registration-attempt.created
billing/subscription.activated
```

Do not attach a job to an unrelated event merely because its payload is
convenient. The selected event must represent the fact that starts the job.

## Every external event has a runtime schema

Declare each trigger with `eventType` and a Zod object schema. The schema is the
runtime boundary for data delivered by Inngest:

```ts
export const sendInvitationEmailEvent = eventType(
  UserRegistrationAttemptCreatedEvent._NAME,
  {
    schema: z.object({
      registrationAttemptId: z.string(),
      establishmentId: z.string(),
      type: z.enum(RegistrationAttemptType),
      status: z.enum(RegistrationAttemptStatus),
      createdAt: z.iso.datetime(),
      expiresAt: z.iso.datetime(),
    }),
  },
)
```

Event payloads must be JSON-safe, minimal, and versionable. Do not include
passwords, access tokens, secret keys, raw provider credentials, or an entire
domain entity when identifiers and required values are sufficient. Avoid Zod
transforms because Inngest event schemas require matching input and output
shapes.

Schema changes must remain compatible with events already queued or in flight.
Add optional fields for compatible evolution. Use a new event name or explicit
event version for a breaking payload change.

## Handlers use durable steps for side effects

The handler receives the Inngest context and coordinates durable work. External
effects such as sending email, writing to storage, or calling another service
must run through a named Inngest step:

```ts
static async handle({ event, step }: Context) {
  return step.run('send-invitation-email', async () => {
    // Delegate to the appropriate provider or application operation.
  })
}
```

Step identifiers must be stable and describe the action. Code executed by a step
must be safe to retry. Do not place a non-idempotent effect outside a step or
silently swallow an error that Inngest should retry.

Handlers must not duplicate core business rules. They validate transport input,
delegate work, and return a small serializable result.

## Feature registries export functions

Each module with jobs exposes a registry from its `jobs/index.ts`. The registry
constructs each job with the shared client and exports only retained functions:

```ts
const sendInvitationEmailJob = new SendInvitationEmailJob(inngest)

export const inngestFunctions = [sendInvitationEmailJob.function]
```

Keep registration explicit. Do not discover jobs through filesystem scanning,
decorator reflection, glob imports, or hidden module side effects. When several
feature registries exist, `AppModule` is responsible for combining their function
arrays before passing them to `InngestModule.forRoot`.

## The serve endpoint is infrastructure-only

The shared Inngest controller owns the `/api/inngest` endpoint and delegates the
request directly to the official `inngest/express` serve handler. Do not add
business behavior, feature routing, response mapping, or application use cases to
this controller.

Feature modules must not create their own Inngest HTTP endpoints. The single
shared endpoint serves every function supplied at the root registration.

## Environment variables follow the SDK boundary

Local development sets `INNGEST_DEV=1`. Production removes `INNGEST_DEV` and
provides `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` through the deployment
environment.

Document these variables in `apps/server/.env.example`, but never commit real
keys. Application code must not log the values or include them in events.

## Messaging tests verify boundaries

Job tests must verify:

- the stable function identifier and trigger event;
- acceptance of a valid event payload and rejection of an invalid payload;
- durable step names and calls to mocked providers or application operations;
- retry-safe behavior for side effects.

Endpoint tests must verify that `/api/inngest` is registered once and exposes all
functions passed to `InngestModule.forRoot`. Tests use development mode and must
not require cloud signing or event keys.

Do not call live email, payment, storage, or Inngest cloud services from unit or
integration tests.

## Server imports use aliases

Imports between files inside `apps/server/src` use the `@/` alias. External
package imports such as `@nestjs/common`, `inngest`, and `inngest/express` retain
their package paths.
