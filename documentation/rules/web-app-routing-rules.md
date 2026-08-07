---
description: Routing conventions for the web application, including TanStack Router files, canonical paths, navigation, middleware, search validation, and generated route metadata.
---

# Web App Routing Rules

These rules apply to the TanStack Router layer in `apps/web`. They refine the UI
layer rules for route files, route constants, navigation, middleware, search
state, route integration tests, and route generation.

## Canonical paths live in `ROUTES`

Declare every application path once in:

```text
apps/web/src/constants/routes.ts
```

Use `ROUTES` for links, navigation calls, sidebar configuration, redirects, and
tests. Route keys describe the application concept; path values use kebab-case,
contain no trailing slash except for `/`, and preserve the public URL contract.

```ts
export const ROUTES = {
  root: '/',
  login: '/login',
  intakes: '/intakes',
  newIntake: '/intakes/novo',
} as const
```

Do not introduce a second route map, duplicate a static path in a widget, or
construct application paths by concatenating strings. When a path changes, update
`ROUTES`, every consumer, and the generated route tree in the same change.

Dynamic paths use the typed TanStack Router contract rather than string
interpolation:

```tsx
<Link
  to='/colaboradores/$colaboradorId'
  params={{ colaboradorId }}
>
  Ver detalhes
</Link>
```

Dynamic parameter names must describe the resource (`colaboradorId`, not `id`)
and the same explicit name must be used by the route file, its `params`, the
REST endpoint, and the tests. If a dynamic URL is constructed outside Router,
add a canonical route builder next to `ROUTES` instead of creating an ad hoc
template string.

## TanStack Router route declarations

Route files live directly under:

```text
apps/web/src/routes/
```

Organize every non-root route in a directory named after its URL segment. Use
`index.tsx` for a leaf route and `route.tsx` only when the segment owns a parent
layout with an `Outlet`:

```text
routes/
├── index.tsx              # /
├── login/
│   └── index.tsx          # /login
├── intakes/
│   ├── index.tsx          # /intakes
│   └── novo.tsx           # /intakes/novo
└── advogado/
    ├── route.tsx          # layout de /advogado
    └── consultas.tsx      # /advogado/consultas
```

Directories without `route.tsx` only organize files and do not introduce an
implicit parent route. Do not create `route.tsx` only to group files or express a
common URL prefix.

Each route file owns only route composition:

- import the page or layout widget;
- attach the route middleware;
- validate search parameters;
- declare the route component.

Business decisions, data orchestration, and substantial UI markup belong in the
owning widget, hook, or application adapter—not in the route file.

Route files must remain thin. A route may select the page widget, configure
middleware, validate search, and define route-level pending/not-found/error
boundaries. It must not fetch feature data imperatively, mutate domain state, or
duplicate the page's loading/error markup. Feature queries and mutations belong
to the owning widget hooks so the same behavior can be tested at the widget
boundary.

`createFileRoute` must receive a string literal or plain template literal. The
TanStack route generator cannot transform `createFileRoute(ROUTES.login)`, so
the declaration necessarily repeats the canonical value:

```tsx
export const Route = createFileRoute('/login')({
  component: SignInPage,
})
```

This is the only permitted static route-path duplication. Static runtime
consumers must use `ROUTES`; typed dynamic route patterns may appear in the
Router `to` contract when they are paired with explicit `params`.

## Route protection and composition

Protected routes use the shared authentication middleware in `beforeLoad`:

```tsx
export const Route = createFileRoute('/home')({
  beforeLoad: requireAuthMiddleware,
  component: HomePage,
})
```

Keep authentication and authorization checks in middleware or route loaders.
Do not duplicate guards inside every page widget. Public routes must not attach
the protected middleware unless the product requirement explicitly demands it.

Authentication and authorization are separate route concerns:

- authentication establishes whether a session exists;
- authorization establishes whether the authenticated collaborator can access
  the route and whether the account is active.

Middleware must reject unauthorized access before rendering the protected page.
The redirect destination and any preserved return location are part of the route
contract and must be asserted in browser integration tests. A widget-level guard
is not a substitute for route middleware.

Parent layout routes compose their layout with `Outlet`; child routes render the
page widget. Route groups that do not share a layout use a directory with
independent leaf routes instead. Do not place a second application shell inside
a child route.

## Search parameters

Routes that consume query parameters must define `validateSearch` in the route
file and return a typed, minimal object. Do not read or cast `window.location`
search values inside page widgets when TanStack Router can provide them through
the route contract.

Validation should describe transport shape only. Domain validation and business
rules belong in the owning use case or application adapter.

Search behavior is part of the public URL contract. Define defaults, accepted
values, invalid-value behavior, and whether a change resets pagination in the
route or feature specification. The implementation must keep the URL, the query
request, and the rendered state consistent:

- an initial URL must produce the same request parameters and visible filters;
- changing a filter must update the URL and reset dependent pagination when
  specified;
- clearing filters must remove optional values and restore documented defaults;
- malformed values must fall back deterministically without crashing the route.

Do not maintain incompatible parsers for the same parameter in the route and a
widget hook. If a hook uses `nuqs` for interactive synchronization, its parser
must share the route's transport contract and be covered by the hook tests.

## Internal navigation

Use the shared `Anchor` widget for internal links:

```tsx
<Anchor route='newIntake'>Novo intake</Anchor>
```

Use `ROUTES` when a library API requires a path value directly:

```ts
navigate({ to: ROUTES.login })
```

Do not use arbitrary `href` values, route casts, or string-interpolated dynamic
URLs for an application route. Native anchors remain appropriate for external
URLs and same-page fragment links. Direct TanStack `Link` setup is allowed for a
typed dynamic route when the shared `Anchor` cannot express its params; it must
use the route pattern and explicit `params` shown above.

Navigation tests must verify behavior through the accessible link or button and
the canonical route contract. Do not assert CSS classes or internal Router state.
For dynamic destinations, assert both the route pattern and the explicit params.

## Generated route tree

`apps/web/src/routeTree.gen.ts` is generated and read-only. Never edit it by hand.
After adding, removing, renaming, or moving a route file, run:

```bash
pnpm --filter web generate-routes
```

Review the generated diff to ensure that the intended route path, parent-child
relationship, and route imports changed. A route change is incomplete until the
generated tree is synchronized.

Never hand-edit generated route metadata to make a test or typecheck pass. If the
generated tree differs because of an unrelated stale route, report that finding
and isolate it from the feature change.

## Route integration tests

Route behavior is tested with Playwright under:

```text
apps/web/tests/routes/
```

Organize route suites by bounded module, then name the file after the feature or
route behavior:

```text
apps/web/tests/routes/
├── identity/
│   ├── colaboradores.index.test.tsx
│   └── colaboradores.$colaboradorId.test.tsx
└── intake/
    └── intake.novo.test.tsx
```

When a feature exposes multiple route files, keep one test file per route file:
`<route-file>.test.tsx`. This keeps list-route behavior separate from dynamic
detail-route behavior and makes a failing route boundary immediately visible.

The first directory is the domain module that owns the route, not a translation
of the URL segment. Collaborators belong to `identity` because identity owns
users, authentication, authorization, and collaborator access management. This
keeps route tests aligned with `documentation/modules.md`, keeps related server,
core, UI, and browser tests discoverable together, and prevents a URL rename or
localization from moving tests between unrelated technical areas.

These are browser integration tests, not backend end-to-end tests. A real backend
is not required: `page.route` may provide a deterministic mocked transport. When
the transport is mocked, the test must model the relevant response state instead
of returning the same fixture forever.

Every protected feature route should cover the applicable cases:

- unauthenticated redirect;
- authenticated but unauthorized redirect;
- authorized route renders the final URL and primary page content;
- loading, request error, and retry/recovery states;
- dynamic parameter reaches the expected request path;
- search/filter/pagination values reach the expected query string;
- mutations assert HTTP method, path, payload, response handling, and the
  resulting visible state;
- edit or dialog flows assert open, cancel, confirm, pending, error, and success;
- action availability is verified for each status/role that changes it.

Do not consider a test complete because `page.waitForRequest()` resolved. Pair
request assertions with the response status/body contract and a user-visible
outcome, such as a refreshed row, closed dialog, updated status, or error message.
Use stateful route mocks for flows such as deactivate, cancel, reactivate, and
remove so the subsequent GET reflects the mutation.

Route tests must exercise the actual route middleware, route component, and page
composition. Do not mock the owning page or hook in a Playwright route test. Keep
unit-level controller and hook tests under `apps/web/src/ui/**/tests`; do not use
them as a substitute for route coverage.

If the backend is mocked, describe the suite as browser integration with mocked
transport. It verifies the UI-to-REST contract and route behavior; server
authorization, controller, and persistence behavior require their own server/core
tests.

## Route failure boundaries

Every route that can fail to load feature data must expose a user-observable
pending and error/retry state at the owning widget or declared route boundary.
Do not leave a route in an indefinite loading state after a rejected request.
Mutation rejections must be handled at the UI event boundary so they remain
visible in the dialog/form and do not become unhandled browser promise errors.

## Required validation

For route changes, run the checks in this order:

```bash
pnpm --filter web generate-routes
pnpm --filter web check:code
pnpm --filter web check:types
pnpm --filter web test
```

If `check:code` reports unrelated pre-existing findings, identify them clearly;
do not weaken Biome rules or edit unrelated files merely to hide the failure.

For route, authentication, form, search, or REST changes, also run the focused
browser integration suite:

```bash
pnpm --filter web test:integration tests/routes/<module>/<feature>.test.tsx
```

Do not skip the focused browser suite merely because unit tests pass. Record
pre-existing hydration or browser-console warnings separately; they must not be
silently treated as route behavior or allowed to hide a new failure.
