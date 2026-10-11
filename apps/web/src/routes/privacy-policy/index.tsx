import { createFileRoute } from '@tanstack/react-router'

import { PrivacyPolicyPage } from '@/ui/identity/widgets/pages/privacy-policy-page'

export const Route = createFileRoute('/privacy-policy/')({
  head: () => ({ meta: [{ title: 'Política de Privacidade — Scoops' }] }),
  component: PrivacyPolicyPage,
})
