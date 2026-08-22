import { createFileRoute } from '@tanstack/react-router'

import { ProductStockSlot } from '@/ui/mrp/widgets/slots/product-stock-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/stock')({
  component: ProductStockRoute,
})

function ProductStockRoute() {
  const { productId } = Route.useParams()
  return <ProductStockSlot productId={productId} />
}
