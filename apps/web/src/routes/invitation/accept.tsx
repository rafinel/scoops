import { createFileRoute } from '@tanstack/react-router'

import { AcceptUserInvitationPage } from '@/ui/identity/widgets/pages/accept-user-invitation-page'

export const Route = createFileRoute('/invitation/accept')({
  component: AcceptUserInvitationPage,
})
