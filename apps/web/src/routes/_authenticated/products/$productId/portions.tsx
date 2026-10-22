import { createFileRoute } from '@tanstack/react-router'

import { ProductPortionsSlot } from '@/ui/mrp/widgets/slots/product-portions-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/portions')({
  component: ProductPortionsRoute,
})

function ProductPortionsRoute() {
  const { productId } = Route.useParams()
  return <ProductPortionsSlot productId={productId} />
}
