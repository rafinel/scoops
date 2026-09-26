import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { initializeBrowserSentry } from './provision/telemetry/sentry.config'

import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultViewTransition: {
      types: ({ fromLocation, pathChanged }) =>
        fromLocation && pathChanged ? ['scoops-route'] : false,
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  initializeBrowserSentry(router)

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
