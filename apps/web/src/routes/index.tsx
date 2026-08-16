import { createFileRoute } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { AuthRouteUnavailableState } from '@/ui/identity/widgets/states/auth-route-unavailable-state'
import { AuthenticatedRoute } from '@/ui/identity/widgets/layouts/authenticated-route'

export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: requireAuthMiddleware,
  component: AuthenticatedRoute,
  errorComponent: AuthRouteUnavailableState,
})
