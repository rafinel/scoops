import { createFileRoute } from '@tanstack/react-router'

import { ProductDetailsPlaceholderSlot } from '@/ui/mrp/widgets/slots/product-details-placeholder-slot'

export const Route = createFileRoute(
  '/_authenticated/products/$productId/accompaniments',
)({
  component: ProductAccompanimentsRoute,
})

function ProductAccompanimentsRoute() {
  const { productId } = Route.useParams()

  return (
    <ProductDetailsPlaceholderSlot
      allowedCategories={['portion']}
      description='Em breve você poderá organizar os acompanhamentos vinculados a este produto.'
      icon='layers'
      productId={productId}
      selectedTab='accompaniments'
      title='Acompanhamentos'
    />
  )
}
