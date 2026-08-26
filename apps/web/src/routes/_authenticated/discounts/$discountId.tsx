import { createFileRoute } from '@tanstack/react-router'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { ComboDiscountPage } from '@/ui/pdv/widgets/pages/combo-discount-page'

export const Route = createFileRoute('/_authenticated/discounts/$discountId')({
  beforeLoad: requireManagerMiddleware,
  component: DiscountDetailsRoute,
})

function DiscountDetailsRoute() {
  const { discountId } = Route.useParams()
  return <ComboDiscountPage comboId={discountId} mode='edit' />
}
