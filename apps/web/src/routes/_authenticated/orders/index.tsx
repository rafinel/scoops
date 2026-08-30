import { createFileRoute } from '@tanstack/react-router'
import { ordersSearchSchema, type OrdersSearch } from '@scoops/validation'

import { OrdersPage } from '@/ui/pdv/widgets/pages/orders-page'

export const Route = createFileRoute('/_authenticated/orders/')({
  validateSearch: ordersSearchSchema,
  component: OrdersRoute,
})

function OrdersRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function handleSearchChange(nextSearch: OrdersSearch) {
    void navigate({ search: () => nextSearch })
  }

  return <OrdersPage onSearchChange={handleSearchChange} search={search} />
}
