import type { useProductAccompanimentDerivedState } from './use-product-accompaniment-derived-state'
import type { useProductAccompanimentForm } from './use-product-accompaniment-form'
import type { useProductAccompanimentQueries } from './use-product-accompaniment-queries'

export function useProductAccompanimentHandlers({
  baseFormState,
  derived,
  isEdit,
  queries,
}: {
  baseFormState: ReturnType<typeof useProductAccompanimentForm>
  derived: ReturnType<typeof useProductAccompanimentDerivedState>
  isEdit: boolean
  queries: ReturnType<typeof useProductAccompanimentQueries>
}) {
  function handleValueChange(
    name: 'accompanimentProductId' | 'accompanimentTypeId',
    value: string | null,
  ) {
    baseFormState.handleValueChange(name, value)
    if (name !== 'accompanimentProductId' || isEdit) return
    baseFormState.selectCandidate(
      queries.candidatesQuery.data?.find((candidate) => candidate.productId === value),
      derived.selectedProduct,
    )
  }

  function handleGlobalChange(checked: boolean) {
    if (derived.isGlobalLocked) return
    baseFormState.handleGlobalChange(checked)
  }

  return { handleGlobalChange, handleValueChange }
}
