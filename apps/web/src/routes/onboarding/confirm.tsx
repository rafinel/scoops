import { createFileRoute } from '@tanstack/react-router'
import { confirmOnboardingSchema } from '@scoops/validation'

import { OnboardingConfirmationPage } from '@/ui/identity/widgets/pages/onboarding-confirmation-page'

export const Route = createFileRoute('/onboarding/confirm')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    const confirmationToken = confirmOnboardingSchema.shape.confirmationToken.safeParse(
      search.confirmationToken,
    )

    return {
      confirmationToken: confirmationToken.success ? confirmationToken.data : undefined,
    }
  },
  component: () => (
    <OnboardingConfirmationPage confirmationToken={Route.useSearch().confirmationToken} />
  ),
})
