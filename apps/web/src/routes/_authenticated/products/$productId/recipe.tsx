import { createFileRoute } from '@tanstack/react-router'

import { ProductRecipeSlot } from '@/ui/mrp/widgets/slots/product-recipe-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/recipe')({
  component: ProductRecipeRoute,
})

function ProductRecipeRoute() {
  const { productId } = Route.useParams()
  return <ProductRecipeSlot productId={productId} />
}
