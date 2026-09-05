import { createFileRoute } from '@tanstack/react-router'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { ProductRegistrationPage } from '@/ui/mrp/widgets/pages/product-registration-page'

export const Route = createFileRoute('/_authenticated/products/new')({
  beforeLoad: requireManagerMiddleware,
  component: ProductRegistrationRoute,
})

function ProductRegistrationRoute() {
  return <ProductRegistrationPage />
}
