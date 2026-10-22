import type { Product } from '@scoops/core/mrp/domain/entities'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { useGlobalAccompanimentQuery } from '@/ui/mrp/hooks/use-global-accompaniment-query'

export type UseProductDetailsHeaderProps = {
  product: Product
}

export function useProductDetailsHeader({ product }: UseProductDetailsHeaderProps) {
  const hasAccompanimentCategory = product.categories.includes(
    ProductCategory.Accompaniment,
  )
  const { data: globalAccompaniment } = useGlobalAccompanimentQuery(
    product.id,
    hasAccompanimentCategory,
  )
  const isGlobal = hasAccompanimentCategory && globalAccompaniment?.isGlobal === true

  function isCategoryGlobal(category: ProductCategory) {
    return isGlobal && category === ProductCategory.Accompaniment
  }

  return { isGlobal, isCategoryGlobal }
}
