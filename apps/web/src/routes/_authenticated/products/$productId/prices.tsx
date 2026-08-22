import { createFileRoute } from '@tanstack/react-router'

import { ProductDetailsPlaceholderSlot } from '@/ui/mrp/widgets/slots/product-details-placeholder-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/prices')({
  component: ProductPricesRoute,
})

function ProductPricesRoute() {
  const { productId } = Route.useParams()

  return (
    <ProductDetailsPlaceholderSlot
      allowedCategories={['portion', 'resale']}
      description='Em breve você poderá acompanhar preços e custos deste produto.'
      icon='tag'
      productId={productId}
      selectedTab='prices'
      title='Preços'
    />
  )
}
