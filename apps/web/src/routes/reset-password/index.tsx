import { createFileRoute } from '@tanstack/react-router'
import { resetPasswordSchema } from '@scoops/validation'

import { ResetPasswordPage } from '@/ui/identity/widgets/pages/reset-password-page'

export const Route = createFileRoute('/reset-password/')({
  validateSearch(search: Record<string, unknown>) {
    const token = resetPasswordSchema.shape.token.safeParse(search.token)

    return {
      token: token.success ? token.data : undefined,
    }
  },
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  return <ResetPasswordPage token={Route.useSearch().token} />
}
