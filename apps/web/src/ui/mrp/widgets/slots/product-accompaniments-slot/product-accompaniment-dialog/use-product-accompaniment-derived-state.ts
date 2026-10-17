import { useMemo } from 'react'

import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import type { ProductAccompanimentFormState } from './use-product-accompaniment-form'
import type { ProductAccompanimentQueries } from './use-product-accompaniment-queries'

export function useProductAccompanimentDerivedState({
  formState,
  isEdit,
  item,
  queries,
}: {
  formState: ProductAccompanimentFormState
  isEdit: boolean
  item?: ProductAccompanimentDetails
  queries: ProductAccompanimentQueries
}) {
  const selectedProduct = useMemo(
    () =>
      queries.candidatesQuery.data?.find(
        (candidate) => candidate.productId === formState.productIdValue,
      ),
    [formState.productIdValue, queries.candidatesQuery.data],
  )
  const types = queries.typesQuery.data?.items ?? []
  return buildDerivedState({ formState, isEdit, item, queries, selectedProduct, types })
}

type Candidate = NonNullable<
  ProductAccompanimentQueries['candidatesQuery']['data']
>[number]
type AccompanimentTypes = NonNullable<
  ProductAccompanimentQueries['typesQuery']['data']
>['items']

function buildDerivedState({
  formState,
  isEdit,
  item,
  queries,
  selectedProduct,
  types,
}: {
  formState: ProductAccompanimentFormState
  isEdit: boolean
  item?: ProductAccompanimentDetails
  queries: ProductAccompanimentQueries
  selectedProduct: Candidate | undefined
  types: AccompanimentTypes
}) {
  const cost = getCostState({ formState, item, queries })
  return {
    ...cost,
    ...getGlobalState({ formState, isEdit, item, selectedProduct }),
    isPriceLoading:
      Boolean(queries.pricingProductId) && queries.pricingQuery.isLoadingPricing,
    isRefreshing:
      [queries.candidatesQuery, queries.typesQuery, queries.selectedStockQuery].some(
        hasRefreshableData,
      ) || queries.pricingQuery.isRefreshingPricing,
    savedPrice: queries.pricingQuery.pricing?.accompanimentPrice ?? null,
    selectedProduct,
    selectedStockError: !isEdit && queries.selectedStockQuery.isError,
    selectedStockLoading: !isEdit && queries.selectedStockQuery.isPending,
    selectedTypeName:
      types.find(({ type }) => type.id === formState.typeId)?.type.name ??
      item?.accompanimentTypeName,
    types,
  }
}

function getGlobalState({
  formState,
  isEdit,
  item,
  selectedProduct,
}: {
  formState: ProductAccompanimentFormState
  isEdit: boolean
  item?: ProductAccompanimentDetails
  selectedProduct: Candidate | undefined
}) {
  const isGlobalLocked = isEdit
    ? Boolean(item?.isGlobal)
    : Boolean(selectedProduct?.isGlobal)
  const hasOtherPortionLinks = isEdit
    ? Boolean(item?.hasOtherPortionLinks)
    : Boolean(selectedProduct?.hasPortionLinks)
  return {
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
  item?: ProductAccompanimentDetails
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
