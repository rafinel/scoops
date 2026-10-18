import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SalesCatalogListItem } from '@scoops/core/pdv/domain/structures'
import { SalesCatalogProductFaker } from '@scoops/core/pdv/domain/structures/fakers'

import { useOrderCatalogQuery } from '@/ui/pdv/hooks/use-order-catalog-query'

import { useNewSaleCatalog } from '../use-new-sale-catalog'

vi.mock('@/ui/pdv/hooks/use-order-catalog-query', () => ({
  useOrderCatalogQuery: vi.fn(),
}))

const useOrderCatalogQueryMock = vi.mocked(useOrderCatalogQuery)

const portion: SalesCatalogListItem = SalesCatalogProductFaker.fakeListItem({
  productId: 'portion-1',
  name: 'Açaí tradicional',
  kind: 'portion',
  resalePrice: undefined,
  sizes: [
    {
      sizeId: 'size-inactive',
      name: 'Promo',
      quantity: 1,
      basePrice: 5,
      isActive: false,
      isAvailable: true,
      accompaniments: [],
    },
    {
      sizeId: 'size-out',
      name: 'Pequeno',
      quantity: 1,
      basePrice: 16,
      isActive: true,
      isAvailable: false,
      accompaniments: [],
    },
    {
      sizeId: 'size-in',
      name: 'Grande',
      quantity: 1,
      basePrice: 24,
      isActive: true,
      isAvailable: true,
      accompaniments: [],
    },
  ],
})

const singleResale: SalesCatalogListItem = {
  ...portion,
  productId: 'resale-single',
  name: 'Pote de açaí 1 L',
  kind: 'resale',
  availability: 'out_of_stock',
  isAvailable: false,
  resalePrice: 28,
  sizes: [],
}

const byBrandResale: SalesCatalogListItem = {
  ...singleResale,
  productId: 'resale-brand',
  name: 'Creme de avelã',
  stockControl: 'by-brand',
  availability: 'available',
  isAvailable: true,
  resalePrice: undefined,
  resaleBrands: [
    {
      brandId: 'brand-inactive',
      name: 'Inativa',
      basePrice: 1,
      isActive: false,
      isAvailable: true,
    },
    {
      brandId: 'brand-a',
      name: 'Marca A',
      basePrice: 40,
      isActive: true,
      isAvailable: false,
    },
    {
      brandId: 'brand-b',
      name: 'Marca B',
      basePrice: 35,
      isActive: true,
      isAvailable: true,
    },
  ],
}

const unpricedResale: SalesCatalogListItem = {
  ...singleResale,
  productId: 'resale-unpriced',
  name: 'Pote de açaí 500 ml',
  availability: 'missing_price',
  resalePrice: undefined,
}

const freeResale: SalesCatalogListItem = {
  ...singleResale,
  productId: 'resale-free',
  name: 'Brinde',
  availability: 'available',
  isAvailable: true,
  resalePrice: 0,
}

function mockCatalogPage(items: SalesCatalogListItem[], total = items.length) {
  useOrderCatalogQueryMock.mockReturnValue({
    catalogError: undefined,
    catalogPage: { items, page: 1, pageSize: 20, total, totalPages: 1 },
    isCatalogError: false,
    isLoadingCatalog: false,
    isPageLoadingCatalog: false,
    isRefreshingCatalog: false,
    refetchCatalog: vi.fn(),
  } as never)
}

function renderCatalog(addedProductIds: readonly string[] = []) {
  const onSelectProduct = vi.fn()
  const view = renderHook(() => useNewSaleCatalog({ addedProductIds, onSelectProduct }))

  return { ...view, onSelectProduct }
}

describe('useNewSaleCatalog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useOrderCatalogQueryMock.mockReturnValue({
      catalogError: undefined,
      catalogPage: undefined,
      isCatalogError: false,
      isLoadingCatalog: false,
      isPageLoadingCatalog: false,
      isRefreshingCatalog: false,
      refetchCatalog: vi.fn(),
    } as never)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('updates the search field immediately and requests the trimmed search after 250 ms', () => {
    const { result } = renderCatalog()

    act(() => result.current.handleSearchChange(' aça'))
    act(() => result.current.handleSearchChange('  açaí '))

    expect(result.current.search).toBe('  açaí ')
    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith(undefined, undefined, 1)
    act(() => vi.advanceTimersByTime(249))
    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith(undefined, undefined, 1)
    act(() => vi.advanceTimersByTime(1))
    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith('açaí', undefined, 1)
    expect(result.current.hasSearch).toBe(true)
  })

  it('does not bring back an older search when typing again right after clearing', () => {
    const { result } = renderCatalog()

    act(() => result.current.handleSearchChange('abc'))
    act(() => vi.advanceTimersByTime(250))
    act(() => result.current.handleSearchChange(''))
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.handleSearchChange('x'))

    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith(undefined, undefined, 1)
    expect(result.current.hasSearch).toBe(false)
    act(() => vi.advanceTimersByTime(250))
    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith('x', undefined, 1)
  })

  it('treats a whitespace-only search as no search without waiting', () => {
    const { result } = renderCatalog()

    act(() => result.current.handleSearchChange('açaí'))
    act(() => vi.advanceTimersByTime(250))
    act(() => result.current.handleSearchChange('   '))

    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith(undefined, undefined, 1)
    expect(result.current.hasSearch).toBe(false)
  })

  it('resets the page when the effective search changes and clears filters immediately', () => {
    const { result } = renderCatalog()

    act(() => result.current.handlePageChange(3))
    expect(result.current.page).toBe(3)
    act(() => result.current.handleSearchChange('baunilha'))
    expect(result.current.page).toBe(3)
    act(() => vi.advanceTimersByTime(250))
    expect(result.current.page).toBe(1)
    expect(useOrderCatalogQueryMock).not.toHaveBeenCalledWith('baunilha', undefined, 3)
    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith('baunilha', undefined, 1)

    act(() => result.current.handlePageChange(2))
    act(() => result.current.handleKindChange('resale'))
    expect(result.current.kind).toBe('resale')
    expect(result.current.page).toBe(1)

    act(() => result.current.handlePageChange(2))
    act(() => result.current.handleClearFilters())
    expect(result.current.search).toBe('')
    expect(result.current.kind).toBeUndefined()
    expect(result.current.page).toBe(1)
    expect(result.current.hasSearch).toBe(false)
    expect(useOrderCatalogQueryMock).toHaveBeenLastCalledWith(undefined, undefined, 1)
  })

  it('does not restore an older page when the search returns to a previous value', () => {
    const { result } = renderCatalog()

    act(() => result.current.handleSearchChange('a'))
    act(() => vi.advanceTimersByTime(250))
    act(() => result.current.handlePageChange(3))
    act(() => result.current.handleSearchChange('ab'))
    act(() => vi.advanceTimersByTime(250))
    act(() => result.current.handleSearchChange('a'))
    act(() => vi.advanceTimersByTime(250))

    expect(result.current.page).toBe(1)
  })

  it('labels the count with eligible products by default and found products while searching', () => {
    mockCatalogPage([portion], 7)
    const { result } = renderCatalog(['portion-1', 'resale-free'])

    expect(result.current.countLabel).toBe('7 produtos elegíveis · 2 adicionados')
    act(() => result.current.handleSearchChange('açaí'))
    expect(result.current.countLabel).toBe('7 produtos elegíveis · 2 adicionados')
    act(() => vi.advanceTimersByTime(250))
    expect(result.current.countLabel).toBe('7 produtos encontrados · 2 adicionados')
    act(() => result.current.handleClearFilters())
    expect(result.current.countLabel).toBe('7 produtos elegíveis · 2 adicionados')
  })

  it('prompts for a selection before the catalog has loaded', () => {
    const { result } = renderCatalog()

    expect(result.current.countLabel).toBe('Selecione um produto para começar')
    expect(result.current.catalogCards).toEqual([])
  })

  it('derives the price line, reason and added flag of each card', () => {
    mockCatalogPage([portion, singleResale, byBrandResale, unpricedResale, freeResale])
    const { result } = renderCatalog(['portion-1', 'resale-single'])

    expect(
      result.current.catalogCards.map((card) => [
        card.product.productId,
        card.priceLabel.replace(/\s/g, ' '),
        card.unavailableReason,
        card.isAdded,
        card.availabilityPillId,
      ]),
    ).toEqual([
      [
        'portion-1',
        'A partir de R$ 16,00',
        undefined,
        true,
        'new-sale-availability-portion-1',
      ],
      [
        'resale-single',
        'R$ 28,00',
        'out_of_stock',
        true,
        'new-sale-availability-resale-single',
      ],
      [
        'resale-brand',
        'A partir de R$ 35,00',
        undefined,
        false,
        'new-sale-availability-resale-brand',
      ],
      [
        'resale-unpriced',
        'Preço não definido',
        'missing_price',
        false,
        'new-sale-availability-resale-unpriced',
      ],
      ['resale-free', 'R$ 0,00', undefined, false, 'new-sale-availability-resale-free'],
    ])
  })

  it('derives card copy and action labels from the product kind and added state', () => {
    mockCatalogPage([portion, singleResale, byBrandResale])
    const { result } = renderCatalog(['portion-1', 'resale-single'])

    expect(
      result.current.catalogCards.map((card) => [
        card.kindLabel,
        card.description,
        card.actionLabel,
        card.actionAriaLabel,
      ]),
    ).toEqual([
      [
        'Porção',
        'Escolha o tamanho e os acompanhamentos',
        'Adicionar outra porção',
        'Adicionar outra configuração de Açaí tradicional',
      ],
      [
        'Revenda',
        'Produto com estoque único',
        'Adicionar outra unidade',
        'Adicionar outra configuração de Pote de açaí 1 L',
      ],
      [
        'Revenda',
        'Escolha a marca e a embalagem',
        'Adicionar',
        'Adicionar Creme de avelã',
      ],
    ])
  })

  it('shows an undefined price when no active priced option exists', () => {
    mockCatalogPage([{ ...portion, sizes: [], availability: 'out_of_stock' }])
    const { result } = renderCatalog()

    expect(result.current.catalogCards[0].priceLabel).toBe('Preço não definido')
  })

  it('selects only available products', () => {
    const { result, onSelectProduct } = renderCatalog()

    act(() => result.current.handleSelectProduct(singleResale))
    act(() => result.current.handleSelectProduct(unpricedResale))
    expect(onSelectProduct).not.toHaveBeenCalled()

    act(() => result.current.handleSelectProduct(portion))
    expect(onSelectProduct).toHaveBeenCalledExactlyOnceWith(portion)
  })

  it('presents an item without availability from isAvailable', () => {
    const { availability: _availableAvailability, ...legacyAvailable } = portion
    const { availability: _unavailableAvailability, ...legacyUnavailable } = {
      ...singleResale,
    }
    mockCatalogPage([legacyAvailable, legacyUnavailable] as SalesCatalogListItem[])
    const { result, onSelectProduct } = renderCatalog()

    expect(result.current.catalogCards.map((card) => card.unavailableReason)).toEqual([
      undefined,
      'out_of_stock',
    ])
    act(() => result.current.handleSelectProduct(legacyUnavailable as never))
    expect(onSelectProduct).not.toHaveBeenCalled()
    act(() => result.current.handleSelectProduct(legacyAvailable as never))
    expect(onSelectProduct).toHaveBeenCalledOnce()
  })
})
