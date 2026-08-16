import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/ui/shared/widgets/pages/placeholder-page'

export const Route = createFileRoute('/_authenticated/orders/')({
  component: OrdersPlaceholderRoute,
})

function OrdersPlaceholderRoute() {
  return (
    <PlaceholderPage
      icon='clipboard-list'
      title='Pedidos'
      description='A gestão de pedidos estará disponível aqui em breve.'
    />
  )
}
