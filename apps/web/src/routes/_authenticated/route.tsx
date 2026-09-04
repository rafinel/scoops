import { createFileRoute } from '@tanstack/react-router'

import { AuthRouteUnavailableState } from '@/ui/identity/widgets/states/auth-route-unavailable-state'
import { AuthenticatedRoute } from '@/ui/identity/widgets/layouts/authenticated-route'
import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: requireAuthMiddleware,
  component: AuthenticatedRoute,
  errorComponent: AuthRouteUnavailableState,
})
