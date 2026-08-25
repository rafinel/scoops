import { useEffect, useState } from 'react'

import type { Product } from '@scoops/core/mrp/domain/entities'
import { productSettingsFormSchema } from '@scoops/validation'

import { useUpdateProductSettingsAction } from '@/ui/mrp/hooks/use-update-product-settings-action'

export function useInternalNotesCard(product: Product) {
  const action = useUpdateProductSettingsAction(product.id)
  const [internalNotes, setInternalNotes] = useState(product.internalNotes ?? '')
  const [error, setError] = useState<string>()

  useEffect(() => {
    setInternalNotes(product.internalNotes ?? '')
    setError(undefined)
  }, [product])

  async function handleBlur() {
    const result = productSettingsFormSchema.safeParse({
      name: product.name,
      idealStock: product.idealStock === undefined ? '' : String(product.idealStock),
      status: product.status,
      allowNegativeStock: Boolean(product.allowNegativeStock),
      internalNotes,
    })
    if (!result.success) {
      const issue = result.error.issues.find((item) => item.path[0] === 'internalNotes')
      setError(issue?.message ?? 'Revise a anotação.')
      return
    }
    setError(undefined)
    try {
      await action.updateProductSettings({
        field: 'internalNotes',
        input: {
          internalNotes: result.data.internalNotes,
          expectedUpdatedAt: product.updatedAt,
        },
      })
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : 'Não foi possível salvar. Tente novamente.',
      )
    }
  }

  function handleRetry() {
    void handleBlur()
  }

  function handleRevert() {
    setInternalNotes(product.internalNotes ?? '')
    setError(undefined)
  }

  return {
    error,
    handleBlur,
    handleRetry,
    handleRevert,
    internalNotes,
    isPending: action.isUpdatingProductSettings,
    setInternalNotes,
  }
}
