import { useMemo } from 'react'

import type {
  ProductAccompanimentCandidate,
  ProductAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import {
  getBaselinePrice,
  isAccompanimentSideScope,
  type ProductAccompanimentDialogScope,
} from './product-accompaniment-dialog-scope'
import type { ProductAccompanimentFormState } from './use-product-accompaniment-form'
import type { ProductAccompanimentQueries } from './use-product-accompaniment-queries'

export function useProductAccompanimentDerivedState({
  formState,
  isEdit,
  item,
  queries,
  scope,
}: {
  formState: ProductAccompanimentFormState
  isEdit: boolean
  item?: ProductAccompanimentDetails
  queries: ProductAccompanimentQueries
  scope: ProductAccompanimentDialogScope
}) {
  const candidates = queries.candidatesQuery.data
  const selectedProduct = useMemo(
    () =>
      isAccompanimentSideScope(scope)
        ? getAccompanimentSideProduct(scope)
        : candidates?.find(
            (candidate) => candidate.productId === formState.productIdValue,
          ),
    [candidates, formState.productIdValue, scope],
  )
  const types = queries.typesQuery.data?.items ?? []
  return buildDerivedState({
    formState,
    isEdit,
    item,
    queries,
    scope,
    selectedProduct,
    types,
  })
}

type Candidate = Pick<
  ProductAccompanimentCandidate,
  'hasPortionLinks' | 'isGlobal' | 'name' | 'productId' | 'unit'
>

function getAccompanimentSideProduct(
  scope: Extract<ProductAccompanimentDialogScope, { kind: 'global' | 'make-global' }>,
): Candidate {
  const { accompaniment } = scope
  return {
    hasPortionLinks: scope.kind === 'make-global' && scope.hasIndividualLinks,
    isGlobal: scope.kind === 'global',
    name: accompaniment.accompanimentProductName,
    productId: accompaniment.accompanimentProductId,
    unit: accompaniment.unit,
  }
}

function getCostSource(
  item: ProductAccompanimentDetails | undefined,
  scope: ProductAccompanimentDialogScope,
) {
  if (item) return item
  if (scope.kind !== 'global') return undefined
  return {
    brandName: scope.accompaniment.brandName,
    unitCost: scope.accompaniment.unitCost,
  }
}
type AccompanimentTypes = NonNullable<
  ProductAccompanimentQueries['typesQuery']['data']
>['items']

type DerivedArgs = {
  formState: ProductAccompanimentFormState
  isEdit: boolean
  item?: ProductAccompanimentDetails
  queries: ProductAccompanimentQueries
  scope: ProductAccompanimentDialogScope
  selectedProduct: Candidate | undefined
  types: AccompanimentTypes
}

function buildDerivedState(args: DerivedArgs) {
  const { formState, isEdit, item, queries, scope, selectedProduct, types } = args
  return {
    ...getCostState({ formState, item: getCostSource(item, scope), queries }),
    ...getGlobalState({ formState, isEdit, item, scope, selectedProduct }),
    ...getQueryFlags(queries, isEdit),
    ...getPriceState(queries, item, scope),
    selectedProduct,
    selectedTypeName: getSelectedTypeName(types, formState.typeId, item, scope),
    types,
  }
}

function getPriceState(
  queries: ProductAccompanimentQueries,
  item: ProductAccompanimentDetails | undefined,
  scope: ProductAccompanimentDialogScope,
) {
  const savedPrice = queries.pricingQuery.pricing?.accompanimentPrice ?? null
  return {
    baselinePrice: getBaselinePrice(item, scope, savedPrice, queries.selectedCandidate),
    savedPrice,
  }
}

function getQueryFlags(queries: ProductAccompanimentQueries, isEdit: boolean) {
  return {
    isPriceLoading:
      Boolean(queries.pricingProductId) && queries.pricingQuery.isLoadingPricing,
    isRefreshing:
      [queries.candidatesQuery, queries.typesQuery, queries.selectedStockQuery].some(
        hasRefreshableData,
      ) || queries.pricingQuery.isRefreshingPricing,
    selectedStockError: !isEdit && queries.selectedStockQuery.isError,
    selectedStockLoading: !isEdit && queries.selectedStockQuery.isPending,
  }
}

function getSelectedTypeName(
  types: AccompanimentTypes,
  typeId: string,
  item: ProductAccompanimentDetails | undefined,
  scope: ProductAccompanimentDialogScope,
) {
  return (
    types.find(({ type }) => type.id === typeId)?.type.name ??
    item?.accompanimentTypeName ??
    (scope.kind === 'global' ? scope.accompaniment.accompanimentTypeName : undefined)
  )
}

function getGlobalState({
  formState,
  isEdit,
  item,
  scope,
  selectedProduct,
}: {
  formState: ProductAccompanimentFormState
  isEdit: boolean
  item?: ProductAccompanimentDetails
  scope: ProductAccompanimentDialogScope
  selectedProduct: Candidate | undefined
}) {
  const isGlobalLocked = isEdit
    ? Boolean(item?.isGlobal)
    : Boolean(selectedProduct?.isGlobal)
  const hasOtherPortionLinks = isEdit
    ? Boolean(item?.hasOtherPortionLinks)
    : Boolean(selectedProduct?.hasPortionLinks)
  return {
    hasGlobalSwitch: scope.kind === 'portion' && !isGlobalLocked,
    isGlobalLocked,
    isGlobalValue: formState.isGlobalValue,
    shouldShowReplacementNotice:
      formState.isGlobalValue && !isGlobalLocked && hasOtherPortionLinks,
  }
}

function getCostState({
  formState,
  item,
  queries,
}: {
  formState: ProductAccompanimentFormState
  item?: Pick<ProductAccompanimentDetails, 'brandName' | 'unitCost'>
  queries: ProductAccompanimentQueries
}) {
  const selectedStock = queries.selectedStockQuery.data
  const selectedBrand = selectedStock?.brands.find(({ brand }) => brand.isPrimary)
  const source = getAccompanimentSource({
    item,
    selectedBrand,
    selectedStockUnitCost: selectedStock?.product.currentUnitCost,
    hasSelectedStock: selectedStock !== undefined,
  })
  const numericQuantity = Number(String(formState.quantity ?? '').replace(',', '.'))
  return {
    estimatedCost:
      source?.unitCost !== undefined && numericQuantity > 0
        ? source.unitCost * numericQuantity
        : undefined,
    numericQuantity,
    source,
  }
}

function getAccompanimentSource({
  hasSelectedStock,
  item,
  selectedBrand,
  selectedStockUnitCost,
}: {
  hasSelectedStock: boolean
  item?: Pick<ProductAccompanimentDetails, 'brandName' | 'unitCost'>
  selectedBrand?: { brand: { name: string }; unitPrice?: number }
  selectedStockUnitCost?: number
}) {
  if (item) return { name: item.brandName, unitCost: item.unitCost }
  if (selectedBrand?.unitPrice !== undefined) {
    return { name: selectedBrand.brand.name, unitCost: selectedBrand.unitPrice }
  }
  if (selectedStockUnitCost !== undefined) {
    return {
      name: hasSelectedStock ? 'Estoque único' : undefined,
      unitCost: selectedStockUnitCost,
    }
  }
  return undefined
}

function hasRefreshableData(query: { data: unknown; isFetching: boolean }) {
  return query.isFetching && query.data != null
}
