import { createFileRoute } from '@tanstack/react-router'

import { NewSalePage } from '@/ui/pdv/widgets/pages/new-sale-page'

export const Route = createFileRoute('/_authenticated/sales/new')({
  component: NewSaleRoute,
})

function NewSaleRoute() {
  return <NewSalePage />
}
