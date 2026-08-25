import type { ProductCategory } from '@scoops/core/mrp/domain/structures'
import type { ProductCategoryDependency } from '@scoops/core/mrp/domain/structures'

import { ROUTES } from '@/constants/routes'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type CategoryDependencyDialogProps = {
  category: ProductCategory
  dependencies: readonly ProductCategoryDependency[]
  error?: string
  isPending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  productId: string
  productName: string
  canRemove: boolean
  isLoading: boolean
  onRetry: () => void
}

export function useCategoryDependencyDialog(props: CategoryDependencyDialogProps) {
  const { navigateToPath } = useNavigation()

  function handleOpenChange(open: boolean) {
    if (props.isPending) return
    props.onOpenChange(open)
  }

  function retrySearch(kind: ProductCategoryDependency['kind']) {
    return new URLSearchParams({
      retryCategory: props.category,
      retryDependency: kind,
      retryProductId: props.productId,
    })
  }

  function handleDependencyAction(dependency: ProductCategoryDependency) {
    const retry = retrySearch(dependency.kind)
    let path: string
    switch (dependency.kind) {
      case 'consuming-recipe':
      case 'owned-recipe':
        path = `${ROUTES.productDetailsRecipe.replace('$productId', dependency.productId)}?${retry.toString()}`
        break
      case 'portion-size':
        retry.set('focus', 'sizes')
        path = `${ROUTES.productDetailsPrices.replace('$productId', dependency.productId)}?${retry.toString()}`
        break
      case 'resale-configuration':
        retry.set('focus', 'resale')
        path = `${ROUTES.productDetailsPrices.replace('$productId', dependency.productId)}?${retry.toString()}`
        break
      case 'portion-accompaniment':
        path = `${ROUTES.productDetailsAccompaniments.replace('$productId', dependency.productId)}?${retry.toString()}`
        break
      case 'accompaniment-user':
        retry.set('usedAsAccompanimentId', props.productId)
        path = `${ROUTES.products}?${retry.toString()}`
        break
    }
    void navigateToPath(path)
  }

  return { handleDependencyAction, handleOpenChange }
}
