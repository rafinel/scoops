import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { useProductAccompanimentDerivedState } from './use-product-accompaniment-derived-state'
import { useProductAccompanimentForm } from './use-product-accompaniment-form'
import { useProductAccompanimentQueries } from './use-product-accompaniment-queries'
import { useProductAccompanimentSubmit } from './use-product-accompaniment-submit'

export function useProductAccompanimentDialog({
  item,
  onSuccess,
  open,
  productId,
}: {
  item?: ProductAccompanimentDetails
  onSuccess: () => void
  open: boolean
  productId: string
}) {
  const isEdit = Boolean(item)
  const formState = useProductAccompanimentForm(item, open)
  const queries = useProductAccompanimentQueries({
    form: formState.form,
    isEdit,
    item,
    open,
    productId,
    productIdValue: formState.productIdValue,
  })
  const derived = useProductAccompanimentDerivedState({
    formState,
    isEdit,
    item,
    queries,
  })
  const submit = useProductAccompanimentSubmit({
    item,
    onSuccess,
    productId,
    savedPrice: derived.savedPrice,
    setActionError: formState.setActionError,
  })

  return {
    ...getFormState(formState, derived, isEdit),
    ...getQueryState(queries, derived, isEdit),
    ...getSubmitState(formState, submit),
  }
}

function getFormState(
  formState: ReturnType<typeof useProductAccompanimentForm>,
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
  isEdit: boolean,
) {
  return {
    actionError: formState.actionError,
    errors: formState.form.formState.errors,
    estimatedCost: derived.estimatedCost,
    handleValueChange: formState.handleValueChange,
    isEdit,
    numericQuantity: derived.numericQuantity,
    productIdValue: formState.productIdValue,
    register: formState.form.register,
    selectedProduct: derived.selectedProduct,
    selectedStockError: derived.selectedStockError,
    selectedStockLoading: derived.selectedStockLoading,
    selectedTypeName: derived.selectedTypeName,
    source: derived.source,
    typeId: formState.typeId,
    types: derived.types,
    isRefreshing: derived.isRefreshing,
  }
}

function getQueryState(
  queries: ReturnType<typeof useProductAccompanimentQueries>,
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
  isEdit: boolean,
) {
  return {
    accompanimentPriceError: queries.pricingQuery.pricingError,
    accompanimentPriceIsSaved: derived.savedPrice !== null,
    accompanimentPriceLoading: derived.isPriceLoading,
    accompanimentPriceSuggestion:
      queries.pricingQuery.pricing?.suggestedAccompanimentPrice ?? null,
    accompanimentPriceSuggestionMode: queries.pricingQuery.pricing?.mode,
    canSave:
      !queries.pricingProductId ||
      (!queries.pricingQuery.pricingError && !derived.isPriceLoading),
    candidates: queries.candidatesQuery.data ?? [],
    candidatesError: !isEdit && queries.candidatesQuery.isError,
    candidatesLoading: !isEdit && queries.candidatesQuery.isPending,
    retryAccompanimentPrice: queries.pricingQuery.retryPricing,
    retryCandidates: queries.candidatesQuery.refetch,
    retrySelectedStock: queries.selectedStockQuery.refetch,
    typesError: queries.typesQuery.isError,
    typesLoading: queries.typesQuery.isPending,
  }
}

function getSubmitState(
  formState: ReturnType<typeof useProductAccompanimentForm>,
  submit: ReturnType<typeof useProductAccompanimentSubmit>,
) {
  return {
    handleSubmit: formState.form.handleSubmit(submit.handleValidSubmit),
    isPending: submit.isPending,
  }
}

export type ProductAccompanimentDialogState = ReturnType<
  typeof useProductAccompanimentDialog
>
