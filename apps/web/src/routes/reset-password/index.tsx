import { createFileRoute } from '@tanstack/react-router'

import { ResetPasswordPage } from '@/ui/identity/widgets/pages/reset-password-page'

export const Route = createFileRoute('/reset-password/')({
  component: ResetPasswordPage,
})
