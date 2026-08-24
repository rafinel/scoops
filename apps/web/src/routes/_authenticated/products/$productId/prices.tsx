import { createFileRoute } from '@tanstack/react-router'

import { ProductPricingSlot } from '@/ui/mrp/widgets/slots/product-pricing-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/prices')({
  component: ProductPricesRoute,
})

function ProductPricesRoute() {
  const { productId } = Route.useParams()

  return <ProductPricingSlot productId={productId} />
}
