import { createFileRoute } from '@tanstack/react-router'

import { OnboardingPage } from '@/ui/identity/widgets/pages/onboarding-page'

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingPage,
})
