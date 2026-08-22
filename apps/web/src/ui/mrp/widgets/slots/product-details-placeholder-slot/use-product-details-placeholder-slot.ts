import { useEffect } from 'react'

import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useProductDetailsPlaceholderSlot(
  productId: string,
  allowedCategories?: readonly ProductCategory[],
) {
  const {
    data: productStock,
    isError: hasProductError,
    isPending: isLoadingProduct,
    refetch: refetchProduct,
  } = useProductStockQuery(productId)
  const { navigateTo, navigateToPath } = useNavigation()
  const isUnsupported = Boolean(
    productStock &&
      allowedCategories &&
      !productStock.product.categories.some((category) =>
        allowedCategories.includes(category),
      ),
  )

  useEffect(() => {
    if (isUnsupported) void navigateToPath(`/products/${productId}/stock`)
  }, [isUnsupported, navigateToPath, productId])

  function handleBack() {
    void navigateTo('products')
  }

  function handleRetry() {
    void refetchProduct()
  }

  return {
    hasProductError,
    isLoadingProduct,
    isUnsupported,
    product: productStock?.product,
    handleBack,
    handleRetry,
  }
}
