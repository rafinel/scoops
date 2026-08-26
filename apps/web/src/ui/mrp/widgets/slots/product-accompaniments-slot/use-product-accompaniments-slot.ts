import { useState } from 'react'
import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { useProductAccompanimentsQuery } from '@/ui/mrp/hooks/use-product-accompaniments-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type ProductAccompanimentsAction =
  | { kind: 'add' }
  | { kind: 'edit' | 'remove'; item: ProductAccompanimentDetails }

export function useProductAccompanimentsSlot(productId: string) {
  const stockQuery = useProductStockQuery(productId)
  const query = useProductAccompanimentsQuery(productId)
  const { navigateTo } = useNavigation()
  const [selectedAction, setSelectedAction] = useState<ProductAccompanimentsAction>()

  function handleAddAction() {
    setSelectedAction({ kind: 'add' })
  }
  function handleEditAction(item: ProductAccompanimentDetails) {
    setSelectedAction({ kind: 'edit', item })
  }
  function handleRemoveAction(item: ProductAccompanimentDetails) {
    setSelectedAction({ kind: 'remove', item })
  }

  function handleBack() {
    void navigateTo('products')
  }

  function handleActionOpenChange(open: boolean) {
    if (!open) setSelectedAction(undefined)
  }

  function handleActionSuccess() {
    setSelectedAction(undefined)
    void query.refetch()
  }

  return {
    details: query.data,
    isError: stockQuery.isError || query.isError,
    isLoading: stockQuery.isPending || query.isPending,
    product: stockQuery.data?.product ?? query.data?.product,
    selectedAction,
    handleActionOpenChange,
    handleActionSuccess,
    handleBack,
    handleAddAction,
    handleEditAction,
    handleRemoveAction,
    handleRetry: () => {
      void stockQuery.refetch()
      void query.refetch()
    },
  }
}
