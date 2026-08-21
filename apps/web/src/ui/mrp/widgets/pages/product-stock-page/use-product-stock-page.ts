import { useState } from 'react'

import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'

import { useProductStockQuery } from '../../../hooks/use-product-stock-query'
import { useSetPrimaryProductBrandAction } from '../../../hooks/use-set-primary-product-brand-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { showErrorToast } from '@/ui/shared/notifications'

export type ProductStockAction =
  | { kind: 'add-brand' }
  | { kind: 'delete-brand' | 'edit-brand'; brand: ProductBrandStock }
  | { kind: 'entry' | 'write-off'; brand?: ProductBrandStock }

export function useProductStockPage(productId: string) {
  const query = useProductStockQuery(productId)
  const setPrimaryAction = useSetPrimaryProductBrandAction(productId)
  const { navigateTo } = useNavigation()
  const [selectedAction, setSelectedAction] = useState<ProductStockAction>()

  function handleBack() {
    void navigateTo('products')
  }

  function handleRetry() {
    void query.refetch()
  }

  function handleAddBrand() {
    setSelectedAction({ kind: 'add-brand' })
  }

  function handleEditBrand(brand: ProductBrandStock) {
    setSelectedAction({ kind: 'edit-brand', brand })
  }

  function handleDeleteBrand(brand: ProductBrandStock) {
    setSelectedAction({ kind: 'delete-brand', brand })
  }

  async function handleSetPrimaryBrand(brand: ProductBrandStock) {
    try {
      await setPrimaryAction.setPrimaryProductBrand(brand.brand.id)
      await query.refetch()
    } catch {
      showErrorToast('Não foi possível definir a marca como principal. Tente novamente.')
    }
  }

  function handleEntry(brand?: ProductBrandStock) {
    setSelectedAction({ kind: 'entry', brand })
  }

  function handleWriteOff(brand?: ProductBrandStock) {
    setSelectedAction({ kind: 'write-off', brand })
  }

  function handleActionOpenChange(open: boolean) {
    if (!open) setSelectedAction(undefined)
  }

  function handleActionSuccess() {
    setSelectedAction(undefined)
    void query.refetch()
  }

  return {
    productStock: query.data,
    selectedAction,
    isBrandActionPending: setPrimaryAction.isPending,
    isError: query.isError,
    isLoading: query.isPending,
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
