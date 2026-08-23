import { createFileRoute } from '@tanstack/react-router'

import { ProductAccompanimentsSlot } from '@/ui/mrp/widgets/slots/product-accompaniments-slot'

export const Route = createFileRoute(
  '/_authenticated/products/$productId/accompaniments',
)({
  component: ProductAccompanimentsRoute,
})

function ProductAccompanimentsRoute() {
  const { productId } = Route.useParams()

  return <ProductAccompanimentsSlot productId={productId} />
}
