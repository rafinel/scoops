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
  const baseFormState = useProductAccompanimentForm(item, open)
  const queries = useProductAccompanimentQueries({
    form: baseFormState.form,
    isEdit,
    item,
    open,
    productId,
    productIdValue: baseFormState.productIdValue,
  })
  const derived = useProductAccompanimentDerivedState({
    formState: baseFormState,
    isEdit,
    item,
    queries,
  })

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

  const formState = { ...baseFormState, handleGlobalChange, handleValueChange }
  const submit = useProductAccompanimentSubmit({
    item,
    onSuccess,
    productId,
    savedPrice: derived.savedPrice,
    setActionError: formState.setActionError,
  })

  return getDialogState(
    getFormState(formState, derived, isEdit),
    getQueryState(queries, derived, isEdit),
    getSubmitState(formState, submit),
  )
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
    handleGlobalChange: formState.handleGlobalChange,
    handleValueChange: formState.handleValueChange,
    isEdit,
    isGlobalLocked: derived.isGlobalLocked,
    isGlobalValue: derived.isGlobalValue,
    numericQuantity: derived.numericQuantity,
    productIdValue: formState.productIdValue,
    register: formState.form.register,
    selectedProduct: derived.selectedProduct,
    selectedStockError: derived.selectedStockError,
    selectedStockLoading: derived.selectedStockLoading,
    selectedTypeName: derived.selectedTypeName,
    shouldShowReplacementNotice: derived.shouldShowReplacementNotice,
    source: derived.source,
    typeId: formState.typeId,
    types: derived.types,
    ...getDialogProjection(formState, derived),
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
    canSave: isPriceReadyToSave(
      queries.pricingProductId,
      queries.pricingQuery.pricingError,
      derived.isPriceLoading,
      queries.pricingQuery.isRefreshingPricing,
    ),
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

function getDialogProjection(
  formState: ReturnType<typeof useProductAccompanimentForm>,
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    fields: getDialogFields(formState, derived),
    isRefreshing: derived.isRefreshing,
  }
}

type ProductAccompanimentFormErrors = ReturnType<
  typeof useProductAccompanimentForm
>['form']['formState']['errors']

function getDialogFields(
  formState: ReturnType<typeof useProductAccompanimentForm>,
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    ...getFormDialogFields(formState),
    ...getProductDialogFields(derived),
    ...getCostDialogFields(derived),
    ...getGlobalDialogFields(formState, derived),
    ...getStockDialogFields(derived),
  }
}

function getGlobalDialogFields(
  formState: ReturnType<typeof useProductAccompanimentForm>,
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    handleGlobalChange: formState.handleGlobalChange,
    isGlobalLocked: derived.isGlobalLocked,
    isGlobalValue: derived.isGlobalValue,
    shouldShowReplacementNotice: derived.shouldShowReplacementNotice,
  }
}

function getFormDialogFields(formState: ReturnType<typeof useProductAccompanimentForm>) {
  return {
    ...getFormInputFields(formState),
    ...getFormErrorFields(formState.form.formState.errors),
  }
}

function getFormInputFields(formState: ReturnType<typeof useProductAccompanimentForm>) {
  return {
    actionError: formState.actionError,
    handleValueChange: formState.handleValueChange,
    productIdValue: formState.productIdValue,
    register: formState.form.register,
    typeId: formState.typeId,
  }
}

function getFormErrorFields(errors: ProductAccompanimentFormErrors) {
  return {
    priceError: errors.accompanimentPrice?.message,
    productError: errors.accompanimentProductId?.message,
    quantityError: errors.quantityPerPortion?.message,
    typeError: errors.accompanimentTypeId?.message,
  }
}

function getProductDialogFields(
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    brandName: getBrandName(derived),
    selectedProductName: derived.selectedProduct?.name,
    selectedProductUnit: derived.selectedProduct?.unit,
    selectedTypeName: derived.selectedTypeName,
    types: derived.types,
  }
}

function getBrandName(derived: ReturnType<typeof useProductAccompanimentDerivedState>) {
  if (derived.selectedStockLoading && derived.selectedProduct?.unit) return 'Carregando…'
  return derived.source?.name ?? 'Não disponível'
}

function getCostDialogFields(
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    estimatedCost: derived.estimatedCost,
    numericQuantity: derived.numericQuantity,
    sourceUnitCost: derived.source?.unitCost,
  }
}

function getStockDialogFields(
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    selectedStockError: derived.selectedStockError,
    selectedStockLoading: derived.selectedStockLoading,
  }
}

function isPriceReadyToSave(
  pricingProductId: string | undefined,
  pricingError: boolean,
  priceLoading: boolean,
  pricingRefreshing: boolean,
) {
  if (!pricingProductId) return true
  return !pricingError && !priceLoading && !pricingRefreshing
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

function getDialogState(
  formState: ReturnType<typeof getFormState>,
  queryState: ReturnType<typeof getQueryState>,
  submitState: ReturnType<typeof getSubmitState>,
) {
  return {
    ...formState,
    ...queryState,
    ...submitState,
    fields: getStateFields(formState.fields, queryState),
  }
}

function getStateFields(
  formFields: ReturnType<typeof getFormState>['fields'],
  queryState: ReturnType<typeof getQueryState>,
) {
  return {
    ...formFields,
    ...queryState,
    priceDescribedBy: getPriceDescription(
      formFields.priceError,
      queryState.accompanimentPriceError,
    ),
  }
}

function getPriceDescription(priceError: string | undefined, hasReadError: boolean) {
  return `accompaniment-price-help${priceError ? ' accompaniment-price-validation-error' : ''}${hasReadError ? ' accompaniment-price-read-error' : ''}`
}

export type ProductAccompanimentDialogState = ReturnType<
  typeof useProductAccompanimentDialog
>
