import { createFileRoute } from '@tanstack/react-router'

import { ProductDetailsPlaceholderSlot } from '@/ui/mrp/widgets/slots/product-details-placeholder-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/settings')({
  component: ProductSettingsRoute,
})

function ProductSettingsRoute() {
  const { productId } = Route.useParams()

  return (
    <ProductDetailsPlaceholderSlot
      description='Em breve você poderá ajustar as configurações específicas deste produto.'
      icon='settings'
      productId={productId}
      selectedTab='settings'
      title='Configurações'
    />
  )
}
