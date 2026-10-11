import { createFileRoute } from '@tanstack/react-router'

import { TermsOfUsePage } from '@/ui/identity/widgets/pages/terms-of-use-page'

export const Route = createFileRoute('/terms-of-use/')({
  head: () => ({ meta: [{ title: 'Termos de Uso — Scoops' }] }),
  component: TermsOfUsePage,
})
