import { createFileRoute } from '@tanstack/react-router'

import { OrderDetailsPage } from '@/ui/pdv/widgets/pages/order-details-page'

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  component: OrderDetailsRoute,
})

function OrderDetailsRoute() {
  const { orderId } = Route.useParams()
  return <OrderDetailsPage orderId={orderId} />
}
