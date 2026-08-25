import { useEffect, useState } from 'react'

import type { Product } from '@scoops/core/mrp/domain/entities'

import { useUpdateProductSettingsAction } from '@/ui/mrp/hooks/use-update-product-settings-action'

export function useStockControlCard(product: Product) {
  const action = useUpdateProductSettingsAction(product.id)
  const [allowNegativeStock, setAllowNegativeStock] = useState(
    Boolean(product.allowNegativeStock),
  )
  const [error, setError] = useState<string>()

  useEffect(() => {
    setAllowNegativeStock(Boolean(product.allowNegativeStock))
    setError(undefined)
  }, [product])

  async function save(value: boolean) {
    setError(undefined)
    try {
      await action.updateProductSettings({
        field: 'allowNegativeStock',
        input: { allowNegativeStock: value, expectedUpdatedAt: product.updatedAt },
      })
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : 'Não foi possível salvar. Tente novamente.',
      )
    }
  }

  async function handleAllowNegativeStockChange(value: boolean) {
    setAllowNegativeStock(value)
    await save(value)
  }

  function handleRetry() {
    void save(allowNegativeStock)
  }

  function handleRevert() {
    setAllowNegativeStock(Boolean(product.allowNegativeStock))
    setError(undefined)
  }

  return {
    allowNegativeStock,
    error,
    handleAllowNegativeStockChange,
    handleRetry,
    handleRevert,
    isPending: action.isUpdatingProductSettings,
  }
}
