import { createFileRoute } from '@tanstack/react-router'

import { AccessDeniedPage } from '@/ui/identity/widgets/pages/access-denied-page'

export const Route = createFileRoute('/access-denied/')({
  component: AccessDeniedPage,
})
