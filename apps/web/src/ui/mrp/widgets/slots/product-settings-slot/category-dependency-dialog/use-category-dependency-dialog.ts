import type { ProductCategory } from '@scoops/core/mrp/domain/structures'
import type { ProductCategoryDependency } from '@scoops/core/mrp/domain/structures'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { getDependencyPath } from './get-dependency-path'

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
  savedCategories: readonly ProductCategory[]
  canRemove: boolean
  isLoading: boolean
  isRefreshing?: boolean
  onRetry: () => void
}

export function useCategoryDependencyDialog(props: CategoryDependencyDialogProps) {
  const { navigateToPath } = useNavigation()

  function handleOpenChange(open: boolean) {
    if (props.isPending) return
    props.onOpenChange(open)
  }

  function handleDependencyAction(dependency: ProductCategoryDependency) {
    void navigateToPath(getDependencyPath(dependency, props))
  }

  return { handleDependencyAction, handleOpenChange }
}
