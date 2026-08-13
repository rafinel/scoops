import { createFileRoute } from '@tanstack/react-router'

import { OnboardingConfirmationPage } from '@/ui/identity/widgets/pages/onboarding-confirmation-page'

export const Route = createFileRoute('/onboarding/confirm')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    confirmationToken:
      typeof search.confirmationToken === 'string' &&
      /^[A-Za-z0-9_-]{43}$/.test(search.confirmationToken)
        ? search.confirmationToken
        : undefined,
  }),
  component: () => (
    <OnboardingConfirmationPage confirmationToken={Route.useSearch().confirmationToken} />
  ),
})
