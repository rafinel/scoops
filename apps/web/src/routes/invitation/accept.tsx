import { createFileRoute } from '@tanstack/react-router'
import { acceptUserInvitationSchema } from '@scoops/validation'

import { AcceptUserInvitationPage } from '@/ui/identity/widgets/pages/accept-user-invitation-page'

export const Route = createFileRoute('/invitation/accept')({
  validateSearch(search: Record<string, unknown>) {
    const confirmationToken =
      acceptUserInvitationSchema.shape.confirmationToken.safeParse(
        search.confirmationToken,
      )

    return {
      confirmationToken: confirmationToken.success ? confirmationToken.data : undefined,
    }
  },
  component: InvitationAcceptanceRoute,
})

function InvitationAcceptanceRoute() {
  return (
    <AcceptUserInvitationPage confirmationToken={Route.useSearch().confirmationToken} />
  )
}
