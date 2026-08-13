import { createFileRoute } from '@tanstack/react-router'

import { AuthenticatedHomePage } from '@/ui/identity/widgets/pages/authenticated-home-page'

export const Route = createFileRoute('/_authenticated/app/')({
  component: AuthenticatedHomePage,
})
