import { createFileRoute } from '@tanstack/react-router'

import { ComboDiscountPage } from '@/ui/pdv/widgets/pages/combo-discount-page'

export const Route = createFileRoute('/_authenticated/discounts/$discountId')({
  component: DiscountDetailsRoute,
})

function DiscountDetailsRoute() {
  const { discountId } = Route.useParams()
  return <ComboDiscountPage comboId={discountId} mode='edit' />
}
