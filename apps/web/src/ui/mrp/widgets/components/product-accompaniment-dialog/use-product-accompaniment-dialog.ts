import type {
  GlobalAccompanimentDetails,
  ProductAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { getScopeState } from './product-accompaniment-dialog-state'
import type { ProductAccompanimentDialogMode } from './product-accompaniment-dialog-scope'
import { useProductAccompanimentScope } from './use-product-accompaniment-scope'
import { useProductAccompanimentHandlers } from './use-product-accompaniment-handlers'
import type { useProductAccompanimentDerivedState } from './use-product-accompaniment-derived-state'
import type { useProductAccompanimentForm } from './use-product-accompaniment-form'
import type { useProductAccompanimentQueries } from './use-product-accompaniment-queries'
import { useProductAccompanimentState } from './use-product-accompaniment-state'
import { useProductAccompanimentSubmit } from './use-product-accompaniment-submit'

export type UseProductAccompanimentDialogProps = {
  accompaniment?: GlobalAccompanimentDetails
  hasIndividualLinks?: boolean
  item?: ProductAccompanimentDetails
  mode?: ProductAccompanimentDialogMode
  onSuccess: () => void
  open: boolean
  portionName?: string
  productId: string
}

export function useProductAccompanimentDialog(props: UseProductAccompanimentDialogProps) {
  const { item, onSuccess, productId } = props
  const scope = useProductAccompanimentScope(props)
  const { baseFormState, derived, isEdit, queries } = useProductAccompanimentState(
    props,
    scope,
  )
  const formState = {
    ...baseFormState,
    ...useProductAccompanimentHandlers({ baseFormState, derived, isEdit, queries }),
  }
  const submit = useProductAccompanimentSubmit({
    item,
    onSuccess,
    productId,
    baselinePrice: derived.baselinePrice,
    scope,
    setActionError: formState.setActionError,
  })

  return withScopeState(
    getDialogState(
      getFormState(formState, derived, isEdit),
      getQueryState(queries, derived),
      getSubmitState(formState, submit),
    ),
    getScopeState(derived, { item, scope }),
  )
}

function withScopeState(
  state: ReturnType<typeof getDialogState>,
  scopeState: ReturnType<typeof getScopeState>,
) {
  return { ...state, ...scopeState, fields: { ...state.fields, ...scopeState.fields } }
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
    productIdValue: formState.productIdValue,
    register: formState.form.register,
    typeId: formState.typeId,
    ...getDerivedFormState(derived),
    ...getDialogProjection(formState, derived),
  }
}

function getDerivedFormState(
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    isGlobalLocked: derived.isGlobalLocked,
    isGlobalValue: derived.isGlobalValue,
    numericQuantity: derived.numericQuantity,
    selectedProduct: derived.selectedProduct,
    selectedStockError: derived.selectedStockError,
    selectedStockLoading: derived.selectedStockLoading,
    selectedTypeName: derived.selectedTypeName,
    shouldShowReplacementNotice: derived.shouldShowReplacementNotice,
    source: derived.source,
    types: derived.types,
  }
}

function getQueryState(
  queries: ReturnType<typeof useProductAccompanimentQueries>,
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  return {
    ...getPriceQueryState(queries, derived),
    ...getCandidatesState(queries),
    retrySelectedStock: queries.selectedStockQuery.refetch,
    typesError: queries.typesQuery.isError,
    typesLoading: queries.typesQuery.isPending,
  }
}

function getPriceQueryState(
  queries: ReturnType<typeof useProductAccompanimentQueries>,
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
) {
  const { pricingProductId, pricingQuery } = queries
  return {
    accompanimentPriceError: pricingQuery.pricingError,
    accompanimentPriceIsSaved: derived.savedPrice !== null,
    accompanimentPriceLoading: derived.isPriceLoading,
    accompanimentPriceSuggestion:
      pricingQuery.pricing?.suggestedAccompanimentPrice ?? null,
    accompanimentPriceSuggestionMode: pricingQuery.pricing?.mode,
    canSave: isPriceReadyToSave(
      pricingProductId,
      pricingQuery.pricingError,
      derived.isPriceLoading,
      pricingQuery.isRefreshingPricing,
    ),
    retryAccompanimentPrice: pricingQuery.retryPricing,
  }
}

function getCandidatesState(queries: ReturnType<typeof useProductAccompanimentQueries>) {
  const { candidatesQuery, usesCandidates } = queries
  return {
    candidates: candidatesQuery.data ?? [],
    candidatesError: usesCandidates && candidatesQuery.isError,
    candidatesLoading: usesCandidates && candidatesQuery.isPending,
    retryCandidates: candidatesQuery.refetch,
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
