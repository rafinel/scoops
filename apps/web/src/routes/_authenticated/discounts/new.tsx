import { createFileRoute } from '@tanstack/react-router'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { ComboDiscountPage } from '@/ui/pdv/widgets/pages/combo-discount-page'

export const Route = createFileRoute('/_authenticated/discounts/new')({
  beforeLoad: requireManagerMiddleware,
  component: NewDiscountRoute,
})

function NewDiscountRoute() {
  return <ComboDiscountPage mode='create' />
}
