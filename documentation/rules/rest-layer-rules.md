---
description: REST controller, route grouping, dependency wiring, and REST client rules.
---

# REST Wiring Rules

These rules apply to NestJS controllers under `apps/server/src` and their matching
files under `apps/server/rest-client`.

## Grouped routes use a module decorator

Every route group must have a decorator in the owning module's `decorators`
directory. The decorator centralizes the route prefix:

```ts
// decorators/intakes-controller.ts
export const IntakesController = () => Controller('intakes')
```

Controllers in that group use `@IntakesController()` instead of repeating
`@Controller('intakes')`.

## Route parameters use semantic names

Every dynamic route segment must identify the resource or relationship it
represents. Use names such as `:clientId`, `:collaboratorId`, `:intakeId` and
`:legalAreaId`; never use a generic `:id`. The controller's `@Param()` key and
the local variable must match the route placeholder exactly, and REST examples,
tests and documentation must preserve the same name.

## One controller represents one application action

Create one controller class per use case or REST action. A controller must only:

- receive and extract HTTP input;
- translate that input into the use-case request;
- execute the use case;
- return its result.

Validation, domain decisions, persistence access, and mapping persisted rows do
not belong in controllers.

## Controllers instantiate use cases once

A controller constructor receives the dependencies required by its use case and
manually instantiates a private, readonly use-case field:

```ts
@IntakesController()
export class ListClientIntakesController {
  private readonly useCase: ListClientIntakesUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    intakesRepository: IntakesRepository,
  ) {
    this.useCase = new ListClientIntakesUseCase(intakesRepository)
  }

  @Get('clients/:clientId')
  handle(@Param('clientId') clientId: string) {
    return this.useCase.execute({ clientId })
  }
}
```

Do not inject a use-case class through NestJS and do not instantiate it inside
`handle`. The constructor receives use-case dependencies, not the use case itself.

Repositories must be injected through the module token and typed with the core
interface. Never inject a concrete infrastructure implementation into a
controller. Shared providers such as `DatetimeProvider` are regular constructor
dependencies.

## SSE routes are REST adapter boundaries

Server-Sent Events remain a REST boundary. An SSE controller must adapt the
authenticated HTTP request, disconnect signal, and response sink to the stream
use case. It may construct the use case and translate its result or expected
failures into HTTP/SSE behavior, but it must not own realtime business logic.

The stream use case owns authorization, current-session and audience
revalidation, recipient and tenant filtering, subscription capacity, queueing,
and subscription cleanup policy. Database listeners and committed-row lookup
remain infrastructure concerns. The controller must not implement those rules,
read persistence directly, or filter events itself.

Keep stream framing in a REST transport adapter such as `NotificationStream`:

- emit the named event and versioned envelope defined by the REST contract;
- write comment heartbeats every 20 seconds and handle response backpressure;
- observe disconnect and terminal response signals and invoke the cleanup
  returned by the stream use case exactly once;
- translate authentication, authorization, capacity, and unexpected failures
  into the documented `401`, `403`, `429`, and `500` responses without exposing
  implementation details.

An SSE endpoint is future-only and has no replay cursor. Capacity limits and
queue overflow are decided by the use case; the REST boundary documents and
translates those outcomes rather than reimplementing them.

The realtime contract must be aligned end to end. The database trigger's
`pg_notify` channel, the server database subscriber, the stream adapter's event
name, and the versioned payload consumed by the web client are one integration
contract. When any of these values changes, update every producer and consumer
in the same change and verify a fresh committed database insert through an
authenticated SSE connection. Controller tests alone are insufficient because
they cannot detect a trigger/subscriber channel mismatch or a stale installed
function from an already-applied migration.

## Request body types come from the use case

When a controller receives a body, declare only a local `RequestBody` type and
derive it from the use-case `execute` method:

```ts
type RequestBody = Parameters<RegisterIntakeUseCase['execute']>[0]
```

Use it directly in the body parameter:

```ts
handle(@Body() body: RequestBody) {
  return this.useCase.execute(body)
}
```

If a use-case request also contains route or query parameters, derive
`RequestBody` with `Omit` and assemble the complete request in `handle`. Do not
duplicate a request DTO shape that already exists in the use case.

Do not declare aliases such as `RequestParams`, `RequestQuery`, or
`ControllerRequest` merely to rename primitive route inputs. Type those parameters
directly unless a framework DTO is required for validation or transformation.

## Controllers document HTTP responses

Every controller action must declare its successful response and each expected
error response with NestJS Swagger `@ApiResponse` decorators. Use `HttpStatus`
constants instead of numeric literals, write a concise description, and provide
the response DTO through `type` whenever the response has a JSON body. Standard
REST errors use `ErrorResponseDto`:

```ts
@ApiResponse({
  status: HttpStatus.OK,
  description: 'The client was returned successfully.',
  type: ClientDetailsResponseDto,
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'The client was not found.',
  type: ErrorResponseDto,
})
handle() {
  // ...
}
```

Keep the documented statuses synchronized with the global REST error handler and
the use case behavior. Responses without a body may omit `type`; all other
successful and error responses must describe their payload explicitly.

## Response DTOs have one primary declaration per file

Every response DTO class under a module's `rest/dtos` directory must have its own
file. The file name must describe the resource and response shape, for example:

```text
notification-response.dto.ts
notification-page-response.dto.ts
notification-realtime-event-response.dto.ts
```

Do not group an entity response, pagination response, cursor response, command
result, or transport envelope in one DTO file. A DTO may reference other DTOs,
but each referenced DTO remains declared in its own file and is imported directly
from that file. Keep `index.ts` barrels limited to re-exporting the individual
DTO files.

Response DTOs own the HTTP serialization shape, Swagger metadata, and the narrow
domain-to-transport projection. When a response needs conversion from a domain
value, expose a `static from` or similarly named factory on the DTO. That factory
must only copy and format values for transport; authorization, persistence,
validation, and business decisions remain outside the DTO.

Nested response DTOs must be used for nested JSON objects and arrays. Do not
return a domain entity directly merely to avoid creating a response DTO, and do
not make controllers assemble ad hoc JSON objects that bypass the documented
DTO shape. Date values must declare their `date-time` representation and be
serialized consistently at the REST boundary.

For event-stream responses, serialize the canonical notification DTO inside a
versioned envelope, for example `{ version: 1, notification }`. Reuse the
canonical notification response projection for REST and SSE; do not create an
alternate realtime notification shape. `static from` (or an equivalent DTO
factory) is only a transport projection: it may copy and format domain values,
but it must not authorize, validate business rules, query persistence, or make
delivery decisions.

Keep the current DTO boundary in force. A future decision to return domain
objects from REST and eliminate mappers is not adopted by this rule; it requires
its own approved change to the REST contract and implementation rules.

## Routes reflect resource ownership

Use nested route segments when listing a resource by its owner. For client
intakes, the route is:

```http
GET /intakes/clients/:clientId
```

The route-group prefix remains first, followed by the owner collection and its
identifier. Keep path names plural for collections.

## Every route group has a REST client file

Each controller route group must have a matching `.rest` file under:

```text
apps/server/rest-client/<module>/<route-group>.rest
```

For the `intakes` group, use:

```text
apps/server/rest-client/intake/intakes.rest
```

The file must cover every controller route in that group. Define the base URL and
reusable identifiers once, separate requests with `###`, and give each request a
clear label.

Include the actual method, route parameters, required headers, and a representative
JSON body. Keep the examples synchronized whenever a controller route or request
shape changes.

## Services implement REST contracts

Each client-facing module service must implement the service interface declared in
the core package. The interface belongs under the module's `interfaces` directory
and describes the operation names, request types, and `RestResponse` payloads.

For example, Identity exposes its REST contract from
`packages/core/src/identity/interfaces/identity-service.ts`:

```ts
export interface IdentityService {
  getClient(clientId: string): Promise<RestResponse<ClientDetails>>
  lookupClient(request: LookupClientRequest): Promise<RestResponse<ClientDetails>>
  registerClient(request: RegisterClientRequest): Promise<RestResponse<ClientDetails>>
}
```

Implementations belong in the application adapter layer, under
`apps/web/src/rest/services/<module>-service.ts`. They must:

- receive a `RestClient` instead of creating an Axios or `fetch` client directly;
- return the core service contract;
- delegate each operation to the controller's HTTP method and route;
- pass route identifiers in the path and request data in the body;
- preserve the typed response body without reimplementing use-case rules;
- contain no business decisions, authentication state, caching, or persistence
  logic.

Use a factory so the transport dependency can be replaced in tests or configured
at the application boundary:

```ts
import type { IdentityService as IdentityRestService } from '@hms/core/identity/interfaces'
import type { ClientDetails } from '@hms/core/identity/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'

export const IdentityService = (restClient: RestClient): IdentityRestService => {
  return {
    getClient(clientId) {
      return restClient.get<ClientDetails>(`/clients/${clientId}`)
    },

    lookupClient(request) {
      return restClient.post<ClientDetails>('/clients/lookup', request)
    },

    registerClient(request) {
      return restClient.post<ClientDetails>('/clients', request)
    },
  }
}
```

The service method names and signatures must remain aligned with the core
interface. Changes to a controller route or payload require updating the core
contract and its application adapter together.

Web REST services and transport adapters remain factory functions. A web
service factory receives the shared `RestClient`, and a transport factory owns
construction of its client (for example, a credentialed `EventSource`) without
leaking transport controls into controllers or UI consumers. Keep construction
at the application boundary so each dependency can be replaced or configured
without changing the core contract.

## Web REST transport owns cookie transport

`apps/web/src/rest/axios/axios-rest-client.ts` is the web transport boundary. It
sends credentialed requests so the browser can attach the server-issued
`HttpOnly` session cookie. It must not read a token, inject a Bearer header, or
persist authentication material. Web module services must not import Better
Auth, read the auth context, or assemble authentication headers themselves.

When the web server performs an authenticated SSR request, its transport must
forward the incoming session cookie explicitly. The browser and SSR paths must
resolve the same `/auth/session` contract without exposing the cookie to client
JavaScript.

The REST context belongs under `apps/web/src/ui/shared/contexts/rest-context/` and
may depend on the shared auth context for authenticated application state. Keep
Better Auth operations in the auth provider/context boundary and keep cookie
transport behavior in the REST client.

Cookie-authenticated unsafe methods require exact trusted-origin CORS and server
`Origin` validation. `SameSite` cookies are a defense in depth control, not a
replacement for origin validation or application authorization.

When a service factory is added or changed, verify its HTTP mapping at the
appropriate REST boundary with the existing workspace validation commands.

Web module services and web transport adapters do not receive dedicated test
files. Verify their observable method, path, query, body, response, failure,
connection, and cleanup behavior through consuming widget/page tests and the
Playwright route integration suite. Server controller tests remain the
authoritative backend HTTP contract boundary. Do not create or retain
`apps/web/src/rest/services/tests/<module>-service.test.ts` or an equivalent
transport-adapter test merely to mock `RestClient`/`EventSource` and restate
delegation or construction calls.

## Server imports use aliases

Imports between files inside `apps/server/src` must use the `@/` prefix. External
package imports such as `@nestjs/common` and `@hms/core/...` keep their package
paths.

## Shared errors use one global REST handler

The server must register one global error handler during bootstrap. The handler
belongs under `apps/server/src/shared/rest/filters` and must map core shared
errors to HTTP status codes without putting HTTP concerns in `packages/core`:

- `NotFoundError` becomes `404`;
- `ConflictError` becomes `409`;
- other `AppError` instances become `500`.

The response shape is stable and contains `statusCode`, `title`, `message`,
`timestamp`, and `path`. Unknown errors must return a generic internal-error
message and must not expose implementation details.
