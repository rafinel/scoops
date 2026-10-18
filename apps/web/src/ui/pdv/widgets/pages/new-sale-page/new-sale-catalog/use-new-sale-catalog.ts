import { useEffect, useState } from 'react'

import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import {
  SaleItemKind,
  SalesCatalogAvailability,
  type SalesCatalogListItem,
  type SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'

import { useEffectiveSearch } from '@/ui/pdv/hooks/use-effective-search'
import { useOrderCatalogQuery } from '@/ui/pdv/hooks/use-order-catalog-query'
import { getEffectiveAvailability } from '@/ui/pdv/utils/get-effective-availability'
import type { UnavailableSalesCatalogAvailability } from '@/ui/pdv/widgets/components/sales-catalog-availability-pill'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

const MISSING_PRICE_LABEL = 'Preço não definido'

export type UseNewSaleCatalogProps = {
  addedProductIds: readonly string[]
  onSelectProduct: (product: SalesCatalogProduct) => void
}

export type NewSaleCatalogCard = {
  product: SalesCatalogListItem
  isAdded: boolean
  kindLabel: string
  description: string
  actionLabel: string
  actionAriaLabel: string
  unavailableReason?: UnavailableSalesCatalogAvailability
  priceLabel: string
  availabilityPillId: string
}

type PaginationState = {
  page: number
  search: string | undefined
}

function isPricedOption(option: { isActive: boolean; basePrice: number }) {
  return option.isActive && Number.isFinite(option.basePrice) && option.basePrice >= 0
}

function findLowestPrice(prices: readonly number[]) {
  return prices.length > 0 ? Math.min(...prices) : undefined
}

function findStartingPrice(product: SalesCatalogProduct) {
  if (product.kind === SaleItemKind.Portion) {
    return findLowestPrice(
      product.sizes.filter(isPricedOption).map((size) => size.basePrice),
    )
  }

  if (product.stockControl === ProductStockControl.ByBrand) {
    return findLowestPrice(
      product.resaleBrands.filter(isPricedOption).map((brand) => brand.basePrice),
    )
  }

  return product.resalePrice
}

function createCountLabel(
  total: number | undefined,
  hasSearch: boolean,
  addedCount: number,
) {
  if (total === undefined) return 'Selecione um produto para começar'

  return `${total} produtos ${hasSearch ? 'encontrados' : 'elegíveis'} · ${addedCount} adicionados`
}

function describeProduct(product: SalesCatalogProduct) {
  if (product.kind === SaleItemKind.Portion)
    return 'Escolha o tamanho e os acompanhamentos'
  if (product.stockControl === ProductStockControl.ByBrand) {
    return 'Escolha a marca e a embalagem'
  }

  return 'Produto com estoque único'
}

function createActionLabel(product: SalesCatalogProduct, isAdded: boolean) {
  if (!isAdded) return 'Adicionar'

  return product.kind === SaleItemKind.Portion
    ? 'Adicionar outra porção'
    : 'Adicionar outra unidade'
}

function createCatalogCard(
  product: SalesCatalogListItem,
  addedProductIds: readonly string[],
  formatCurrency: (value: number) => string,
): NewSaleCatalogCard {
  const availability = getEffectiveAvailability(product)
  const startingPrice = findStartingPrice(product)
  const isStartingPrice =
    product.kind === SaleItemKind.Portion ||
    product.stockControl === ProductStockControl.ByBrand
  const formattedPrice =
    startingPrice === undefined ? undefined : formatCurrency(startingPrice)
  let priceLabel = MISSING_PRICE_LABEL

  if (availability !== SalesCatalogAvailability.MissingPrice && formattedPrice) {
    priceLabel = isStartingPrice ? `A partir de ${formattedPrice}` : formattedPrice
  }

  const isAdded = addedProductIds.includes(product.productId)

  return {
    product,
    isAdded,
    kindLabel: product.kind === SaleItemKind.Portion ? 'Porção' : 'Revenda',
    description: describeProduct(product),
    actionLabel: createActionLabel(product, isAdded),
    actionAriaLabel: `${isAdded ? 'Adicionar outra configuração de' : 'Adicionar'} ${product.name}`,
    unavailableReason:
      availability === SalesCatalogAvailability.Available ? undefined : availability,
    priceLabel,
    availabilityPillId: `new-sale-availability-${product.productId}`,
  }
}

function useCatalogPagination(effectiveSearch: string | undefined) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    search: effectiveSearch,
  })
  const page = pagination.search === effectiveSearch ? pagination.page : 1

  useEffect(() => {
    setPagination((current) =>
      current.search === effectiveSearch ? current : { page: 1, search: effectiveSearch },
    )
  }, [effectiveSearch])

  function goToPage(nextPage: number) {
    setPagination({ page: nextPage, search: effectiveSearch })
  }

  function resetPage(nextSearch: string | undefined) {
    setPagination({ page: 1, search: nextSearch })
  }

  return { page, goToPage, resetPage }
}

export function useNewSaleCatalog({
  addedProductIds,
  onSelectProduct,
}: UseNewSaleCatalogProps) {
  const formatCurrency = useFormatCurrency()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<SaleItemKind>()
  const effectiveSearch = useEffectiveSearch(search)
  const { page, goToPage, resetPage } = useCatalogPagination(effectiveSearch)
  const hasSearch = effectiveSearch !== undefined
  const {
    catalogError,
    catalogPage,
    isCatalogError,
    isLoadingCatalog,
    isPageLoadingCatalog,
    isRefreshingCatalog,
    refetchCatalog,
  } = useOrderCatalogQuery(effectiveSearch, kind, page)
  const countLabel = createCountLabel(
    catalogPage?.total,
    hasSearch,
    addedProductIds.length,
  )
  const catalogCards = (catalogPage?.items ?? []).map((product) =>
    createCatalogCard(product, addedProductIds, formatCurrency),
  )

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleKindChange(value: SaleItemKind | undefined) {
    setKind(value)
    resetPage(effectiveSearch)
  }

  function handlePageChange(nextPage: number) {
    goToPage(nextPage)
  }

  function handleSelectProduct(product: SalesCatalogListItem) {
    if (getEffectiveAvailability(product) !== SalesCatalogAvailability.Available) return
    onSelectProduct(product)
  }

  function handleClearFilters() {
    setSearch('')
    setKind(undefined)
    resetPage(undefined)
  }

  return {
    catalogCards,
    catalogError,
    catalogPage,
    countLabel,
    hasSearch,
    isCatalogError,
    isLoadingCatalog,
    isPageLoadingCatalog,
    isRefreshingCatalog,
    kind,
    page,
    refetchCatalog,
    search,
    handleClearFilters,
    handleKindChange,
    handlePageChange,
    handleSearchChange,
    handleSelectProduct,
  }
}
