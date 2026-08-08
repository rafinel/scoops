export const ROUTES = {
  root: '/',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]
