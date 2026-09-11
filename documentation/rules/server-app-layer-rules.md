---
description: NestJS application and layer-module boundaries for feature-owned provision, messaging, and AI adapters.
---

# Server App Layer Rules

These rules apply to the NestJS application bootstrap and to technical layers
owned by feature modules under `apps/server/src/<module>`.

## Application bootstrap belongs to `App`

The server bootstrap must use the application wrapper at:

```text
apps/server/src/app.ts
```

`App` owns the configured `INestApplication` instance and all HTTP application
configuration methods. The class must contain the behavior for:

- trusted-origin CORS configuration with credentials;
- Better Auth's `/api/auth` adapter and allowed-route guard;
- Better Auth response sanitization before a response is returned;
- raw-body parser registration required by Better Auth; and
- the single global `GlobalErrorHandler` registration.

Keep helpers that exist only to configure or sanitize this application as
class-owned methods. Make implementation-only helpers private; do not leave a
parallel `configure-*.ts` function module beside `app.ts`.

`main.ts` is the composition entry point only. It may create `App` around the
Nest instance, configure Swagger, resolve application dependencies, call the
`App` HTTP configuration method, initialize the wrapped instance, and start
listening. It must not duplicate CORS, Better Auth, parser, sanitization, or
global-filter logic.

The bootstrap sequence must preserve `bodyParser: false` during
`NestFactory.create`, configure Better Auth before Nest body parsers are
installed, initialize the application once, and return/use the wrapped
`INestApplication` instance for `listen` and test consumers.

## Technical layer directories own Nest modules

A feature-owned `provision`, `messaging`, or `ai` directory must expose its own NestJS
module. These directories are application layers, not folders whose providers are
registered individually by the feature root module.

Use this structure:

```text
apps/server/src/<module>/
├── ai/
│   ├── mastra/
│   └── <module>-ai.module.ts
├── provision/
│   ├── <technology>-provider.ts
│   └── <module>-provision.module.ts
└── messaging/
    ├── inngest/jobs/
    └── <module>-messaging.module.ts
```

The feature root module imports these layer modules. It must not duplicate their
provider or job registrations.

Detailed agent, tool, workflow, and public AI contract rules live in
[`ai-layer-rules.md`](ai-layer-rules.md). Detailed domain-event, job, and fan-out
rules live in [`messaging-layer-rules.md`](messaging-layer-rules.md).

## Provision modules encapsulate feature adapters

The feature provision module:

- registers concrete provider implementations;
- binds module provider tokens with `useExisting` when consumers depend on a core
  interface;
- exports the token rather than the concrete implementation;
- imports shared provision capabilities only when its providers require them.

Provider files use the technology or adapter name followed by `-provider.ts`, and
classes use the corresponding `<Name>Provider` form. For example,
`docx-provider.ts` contains `DocxProvider`.

Shared capabilities used by several feature modules remain in
`apps/server/src/shared/provision`; do not recreate them in a feature provision
module.

## Messaging modules own jobs and messaging dependencies

The feature messaging module:

- registers the feature's jobs;
- imports `SharedMessagingModule` for shared brokers and Inngest infrastructure;
- imports application modules required by the jobs, such as the feature AI module;
- exports only jobs or messaging entry points consumed by application composition.

The feature root module imports the messaging module instead of registering jobs
directly. The application composition may import the feature root module or its
exported messaging module when collecting jobs for the shared Inngest endpoint.

Creating a feature messaging module must not create another Inngest controller or
endpoint. HTTP serving remains centralized in the shared messaging infrastructure.
