import { createFileRoute } from '@tanstack/react-router'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { ProductStockPage } from '@/ui/mrp/widgets/pages/product-stock-page'

export const Route = createFileRoute('/_authenticated/products/$productId')({
  beforeLoad: requireManagerMiddleware,
  component: ProductStockRoute,
})

function ProductStockRoute() {
  const { productId } = Route.useParams()
  return <ProductStockPage productId={productId} />
}
