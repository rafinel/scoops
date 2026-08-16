import { createFileRoute } from '@tanstack/react-router'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { UserDetailsPage } from '@/ui/identity/widgets/pages/user-details-page'

export const Route = createFileRoute('/_authenticated/users/$userId')({
  beforeLoad: requireManagerMiddleware,
  component: UserDetailsRoute,
})

function UserDetailsRoute() {
  const { userId } = Route.useParams()
  return <UserDetailsPage userId={userId} />
}
