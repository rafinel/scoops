import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/ui/shared/widgets/pages/placeholder-page'
import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'

export const Route = createFileRoute('/_authenticated/subscription/')({
  beforeLoad: requireManagerMiddleware,
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
