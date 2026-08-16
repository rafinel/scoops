import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/ui/shared/widgets/pages/placeholder-page'

export const Route = createFileRoute('/_authenticated/subscription/')({
  component: SubscriptionPlaceholderRoute,
})

function SubscriptionPlaceholderRoute() {
  return (
    <PlaceholderPage
      icon='credit-card'
      title='Assinatura'
      description='Os dados da assinatura estarão disponíveis aqui em breve.'
    />
  )
}
