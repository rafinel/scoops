import { useState } from 'react'

import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'
import { useProductStockQuery } from '../../../hooks/use-product-stock-query'
import { useSetPrimaryProductBrandAction } from '../../../hooks/use-set-primary-product-brand-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { showErrorToast } from '@/ui/shared/notifications'
import { useStockWorkflowTracker } from './use-stock-workflow-tracker'

type StockWorkflowTracker = ReturnType<typeof useStockWorkflowTracker>
type EntryWorkflow = ReturnType<StockWorkflowTracker['startEntryWorkflow']>
type WriteOffWorkflow = ReturnType<StockWorkflowTracker['startWriteOffWorkflow']>
type StockWorkflowByAction = { entry: EntryWorkflow; 'write-off': WriteOffWorkflow }

export function useProductStockSlot(productId: string) {
  const query = useProductStockQuery(productId)
  const setPrimaryAction = useSetPrimaryProductBrandAction(productId)
  const workflowTracker = useStockWorkflowTracker()
  const { navigateTo } = useNavigation()
  const [selectedAction, setSelectedAction] = useState<ProductStockAction>()

  const handleBack = () => void navigateTo('products')

  const handleRetry = () => void query.refetch()

  function handleAddBrand() {
    setSelectedAction({ kind: 'add-brand' })
  }

  function handleEditBrand(brand: ProductBrandStock) {
    setSelectedAction({ kind: 'edit-brand', brand })
  }

  function handleDeleteBrand(brand: ProductBrandStock) {
    setSelectedAction({ kind: 'delete-brand', brand })
  }

  const handleSetPrimaryBrand = (brand: ProductBrandStock) =>
    updatePrimaryBrandAndRefresh(setPrimaryAction, brand, query.refetch)

  function handleEntry(brand?: ProductBrandStock) {
    const workflow = workflowTracker.startEntryWorkflow()
    setSelectedAction({ kind: 'entry', brand, workflow })
  }

  function handleWriteOff(brand?: ProductBrandStock) {
    const workflow = workflowTracker.startWriteOffWorkflow()
    setSelectedAction({ kind: 'write-off', brand, workflow })
  }

  function handleActionOpenChange(open: boolean) {
    if (open) return
    workflowTracker.endActiveWorkflow()
    setSelectedAction(undefined)
  }

  function handleActionSuccess() {
    workflowTracker.endActiveWorkflow()
    setSelectedAction(undefined)
    void query.refetch()
  }

  return {
    productStock: query.data,
    selectedAction,
    isBrandActionPending: setPrimaryAction.isPending,
    isError: query.isError,
    isLoading: query.isPending,
    isRefreshing: query.isFetching && Boolean(query.data),
    handleAddBrand,
    handleActionOpenChange,
    handleActionSuccess,
    handleBack,
    handleEntry,
    handleDeleteBrand,
    handleEditBrand,
    handleRetry,
    handleSetPrimaryBrand,
    handleWriteOff,
  }
}

export type ProductStockAction =
  | { kind: 'add-brand' }
  | { kind: 'delete-brand' | 'edit-brand'; brand: ProductBrandStock }
  | { kind: 'entry'; brand?: ProductBrandStock; workflow: StockWorkflowByAction['entry'] }
  | {
      kind: 'write-off'
      brand?: ProductBrandStock
      workflow: StockWorkflowByAction['write-off']
    }

async function updatePrimaryBrandAndRefresh(
  action: ReturnType<typeof useSetPrimaryProductBrandAction>,
  brand: ProductBrandStock,
  refetch: () => Promise<unknown>,
) {
  try {
    await action.setPrimaryProductBrand(brand.brand.id)
    await refetch()
  } catch {
    showErrorToast('Não foi possível definir a marca como principal. Tente novamente.')
  }
}
