import type { FieldErrors, UseFormReturn } from 'react-hook-form'

import type { LinkPortionsFormValues } from './use-link-portions-form'
import type { LinkPortionsQueries } from './use-link-portions-queries'

export type LinkPortionsFormState = {
  form: UseFormReturn<LinkPortionsFormValues>
  portionProductIds: string[]
  quantity: string
  typeId: string
}

type StockData = NonNullable<LinkPortionsQueries['stockQuery']['data']>

export function getLinkPortionsFields(
  queries: LinkPortionsQueries,
  formState: LinkPortionsFormState,
  savedPrice: number | null,
) {
  const errors = formState.form.formState.errors
  return {
    ...getPriceFields(queries.pricingQuery, savedPrice, errors),
    ...getCostFields(queries.stockQuery, formState.quantity),
    ...getListFields(queries),
    ...getFormFields(formState),
    ...getStatusFields(queries, formState.portionProductIds.length),
    ...getIdentityFields(queries, formState.typeId),
    errors,
  }
}

function getFormFields({ form, portionProductIds, typeId }: LinkPortionsFormState) {
  return {
    portionProductIds,
    priceRegistration: form.register('accompanimentPrice'),
    quantityRegistration: form.register('quantityPerPortion'),
    submitLabel: getSubmitLabel(portionProductIds.length),
    typeId,
  }
}

function getStatusFields(queries: LinkPortionsQueries, selectedCount: number) {
  const { candidatesQuery, pricingQuery, stockQuery, typesQuery } = queries
  const isPriceReady =
    !pricingQuery.pricingError &&
    !pricingQuery.isLoadingPricing &&
    !pricingQuery.isRefreshingPricing
  return {
    canSubmit: isPriceReady && selectedCount > 0,
    isRefreshing:
      [candidatesQuery, typesQuery, stockQuery].some(
        (query) => query.isFetching && query.data != null,
      ) || pricingQuery.isRefreshingPricing,
  }
}

function getIdentityFields(queries: LinkPortionsQueries, typeId: string) {
  const { globalQuery, stockQuery, typesQuery } = queries
  const types = typesQuery.data?.items ?? []
  return {
    accompanimentName: globalQuery.data?.accompanimentProductName ?? '',
    selectedTypeName: types.find(({ type }) => type.id === typeId)?.type.name,
    types,
    unit: globalQuery.data?.unit ?? stockQuery.data?.product.unit ?? 'un',
  }
}

function getPriceFields(
  pricingQuery: LinkPortionsQueries['pricingQuery'],
  savedPrice: number | null,
  errors: FieldErrors<LinkPortionsFormValues>,
) {
  return {
    accompanimentPriceError: pricingQuery.pricingError,
    accompanimentPriceIsSaved: savedPrice !== null,
    accompanimentPriceLoading: pricingQuery.isLoadingPricing,
    accompanimentPriceSuggestion:
      pricingQuery.pricing?.suggestedAccompanimentPrice ?? null,
    accompanimentPriceSuggestionMode: pricingQuery.pricing?.mode,
    priceDescribedBy: getPriceDescription(
      errors.accompanimentPrice?.message,
      pricingQuery.pricingError,
    ),
    retryAccompanimentPrice: pricingQuery.retryPricing,
  }
}

function getCostFields(stockQuery: LinkPortionsQueries['stockQuery'], quantity: string) {
  const cost = getCost(stockQuery.data, quantity)
  return {
    brandName: getBrandName(cost.sourceName, stockQuery.isPending),
    estimatedCost: cost.estimatedCost,
    numericQuantity: cost.numericQuantity,
    retrySelectedStock: stockQuery.refetch,
    selectedStockError: stockQuery.isError,
    selectedStockLoading: stockQuery.isPending,
    sourceUnitCost: cost.unitCost,
  }
}

function getListFields({ candidatesQuery, typesQuery }: LinkPortionsQueries) {
  return {
    candidates: candidatesQuery.data ?? [],
    candidatesError: candidatesQuery.isError,
    candidatesLoading: candidatesQuery.isPending,
    retryCandidates: candidatesQuery.refetch,
    typesError: typesQuery.isError,
    typesLoading: typesQuery.isPending,
  }
}

function getCost(stock: StockData | undefined, quantity: string) {
  const primaryBrand = stock?.brands.find(({ brand }) => brand.isPrimary)
  const unitCost = primaryBrand?.unitPrice ?? stock?.product.currentUnitCost
  const numericQuantity = Number(String(quantity ?? '').replace(',', '.'))
  return {
    estimatedCost:
      unitCost !== undefined && numericQuantity > 0
        ? unitCost * numericQuantity
        : undefined,
    numericQuantity,
    sourceName: getSourceName(primaryBrand, unitCost),
    unitCost,
  }
}

function getSourceName(
  primaryBrand: StockData['brands'][number] | undefined,
  unitCost: number | undefined,
) {
  if (primaryBrand?.unitPrice !== undefined) return primaryBrand.brand.name
  return unitCost === undefined ? undefined : 'Estoque único'
}

function getBrandName(sourceName: string | undefined, isStockPending: boolean) {
  if (isStockPending) return 'Carregando…'
  return sourceName ?? 'Não disponível'
}

function getSubmitLabel(count: number) {
  if (count === 0) return 'Vincular porções'
  return count === 1 ? 'Vincular 1 porção' : `Vincular ${count} porções`
}

function getPriceDescription(priceError: string | undefined, hasReadError: boolean) {
  return `accompaniment-price-help${priceError ? ' accompaniment-price-validation-error' : ''}${hasReadError ? ' accompaniment-price-read-error' : ''}`
}
