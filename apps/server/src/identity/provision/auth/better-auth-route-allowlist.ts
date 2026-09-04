import type { IncomingMessage } from 'node:http'

type AuthRoute = {
  method: string
  path: string
}

export const BETTER_AUTH_PUBLIC_ROUTES: readonly AuthRoute[] = [
  { method: 'GET', path: '/ok' },
  { method: 'GET', path: '/get-session' },
  { method: 'POST', path: '/sign-in/email' },
  { method: 'POST', path: '/sign-out' },
]

export function isAllowedBetterAuthRoute(
  request: Pick<IncomingMessage, 'method' | 'url'>,
): boolean {
  const path =
    new URL(request.url ?? '/', 'http://localhost').pathname.replace(/\/$/, '') || '/'
  return BETTER_AUTH_PUBLIC_ROUTES.some(
    (route) => route.method === request.method && route.path === path,
  )
}
