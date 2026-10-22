import type { ProductAccompanimentDialogScope } from './product-accompaniment-dialog-scope'
import { useProductAccompanimentDerivedState } from './use-product-accompaniment-derived-state'
import { useProductAccompanimentForm } from './use-product-accompaniment-form'
import { useProductAccompanimentQueries } from './use-product-accompaniment-queries'
import type { UseProductAccompanimentDialogProps } from './use-product-accompaniment-dialog'

export function useProductAccompanimentState(
  { item, open, productId }: UseProductAccompanimentDialogProps,
  scope: ProductAccompanimentDialogScope,
) {
  const isEdit = Boolean(item) || scope.kind === 'global'
  const baseFormState = useProductAccompanimentForm(item, open, scope)
  const queries = useProductAccompanimentQueries({
    form: baseFormState.form,
    isEdit,
    item,
    open,
    productId,
    productIdValue: baseFormState.productIdValue,
    scope,
  })
  const derived = useProductAccompanimentDerivedState({
    formState: baseFormState,
    isEdit,
    item,
    queries,
    scope,
  })

  return { baseFormState, derived, isEdit, queries }
}
