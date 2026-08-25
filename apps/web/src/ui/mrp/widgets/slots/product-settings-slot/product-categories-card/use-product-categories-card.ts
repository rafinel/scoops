import { useEffect, useState } from 'react'

import type { Product } from '@scoops/core/mrp/domain/entities'
import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { useChangeProductCategoriesAction } from '@/ui/mrp/hooks/use-change-product-categories-action'
import { useProductCategoryRemovalImpactQuery } from '@/ui/mrp/hooks/use-product-category-removal-impact-query'

import type { ProductSettingsSearch } from '../use-product-settings-slot'

export function useProductCategoriesCard(
  product: Product,
  retrySearch: ProductSettingsSearch,
) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>()
  const [dependencyCategory, setDependencyCategory] = useState<ProductCategory>()
  const [error, setError] = useState<string>()
  const [lastRequestedCategories, setLastRequestedCategories] =
    useState<readonly ProductCategory[]>()
  const changeAction = useChangeProductCategoriesAction(product.id)
  const impactQuery = useProductCategoryRemovalImpactQuery(
    product.id,
    selectedCategory,
    Boolean(selectedCategory),
  )

  useEffect(() => {
    if (
      retrySearch.retryProductId === product.id &&
      retrySearch.retryCategory &&
      retrySearch.retryDependency
    ) {
      setSelectedCategory(retrySearch.retryCategory)
    }
  }, [
    product.id,
    retrySearch.retryCategory,
    retrySearch.retryDependency,
    retrySearch.retryProductId,
  ])

  useEffect(() => {
    if (impactQuery.categoryRemovalImpact) setDependencyCategory(selectedCategory)
  }, [impactQuery.categoryRemovalImpact, selectedCategory])

  const isOnlyCategory = product.categories.length === 1

  function isMutuallyExclusive(category: ProductCategory) {
    return (
      (category === 'portion' && product.categories.includes('resale')) ||
      (category === 'resale' && product.categories.includes('portion'))
    )
  }

  async function changeCategories(nextCategories: readonly ProductCategory[]) {
    setLastRequestedCategories(nextCategories)
    setError(undefined)
    try {
      await changeAction.changeProductCategories({
        categories: nextCategories,
        expectedUpdatedAt: product.updatedAt,
      })
      setLastRequestedCategories(undefined)
      return true
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : 'Não foi possível atualizar as categorias. Tente novamente.',
      )
      return false
    }
  }

  function handleRetry() {
    if (lastRequestedCategories) void changeCategories(lastRequestedCategories)
  }

  function handleCategoryClick(category: ProductCategory) {
    setError(undefined)
    if (product.categories.includes(category)) {
      if (isOnlyCategory) {
        setError('O produto precisa permanecer em pelo menos uma categoria.')
        return
      }
      setSelectedCategory(category)
      return
    }
    if (isMutuallyExclusive(category)) {
      setError('Porção e Revenda não podem ser usadas juntas neste produto.')
      return
    }
    void changeCategories([...product.categories, category])
  }

  async function handleConfirmRemoval() {
    if (!selectedCategory) return
    const changed = await changeCategories(
      product.categories.filter((category) => category !== selectedCategory),
    )
    if (!changed) return
    setSelectedCategory(undefined)
    setDependencyCategory(undefined)
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setSelectedCategory(undefined)
      setDependencyCategory(undefined)
    }
  }

  return {
    categoryRemovalImpact: impactQuery.categoryRemovalImpact,
    categoryRemovalImpactError: impactQuery.categoryRemovalImpactError,
    dependencyCategory,
    error,
    handleCategoryClick,
    handleConfirmRemoval,
    handleDialogOpenChange,
    handleRetry,
    isChangingCategories: changeAction.isChangingProductCategories,
    isLoadingImpact: impactQuery.isLoadingCategoryRemovalImpact,
    isPendingImpact: impactQuery.isPendingCategoryRemovalImpact,
    isSelected: (category: ProductCategory) => selectedCategory === category,
    retryImpact: impactQuery.retryCategoryRemovalImpact,
    selectedCategory,
  }
}
