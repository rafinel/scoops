import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { MrpService } from '@scoops/core/mrp/interfaces'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { RestContext } from '@/ui/shared/contexts/rest-context'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ProductStockSlot } from '.'

import { useProductStockSlot } from './use-product-stock-slot'

vi.mock('./use-product-stock-slot', () => ({
  useProductStockSlot: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route: _route, ...props }: AnchorProps) => (
    <a href='/products' {...props}>
      {children}
    </a>
  ),
}))

const useProductStockSlotMock = vi.mocked(useProductStockSlot)
const handleBackMock = vi.fn()
const handleRetryMock = vi.fn()

describe('ProductStockSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProductStockSlotMock.mockReturnValue(fakeProductStockSlot())
  })

  afterEach(() => cleanup())

  it('renders the loading state', () => {
    useProductStockSlotMock.mockReturnValue(
      fakeProductStockSlot({ isLoading: true, productStock: undefined }),
    )

    renderPage()

    expect(
      screen.getByRole('status', { name: 'Carregando estoque do produto' }),
    ).not.toBeNull()
  })

  it('renders single-stock content and delegates return navigation', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Polpa de morango' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Movimentar estoque' })).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Histórico de Movimentações' }),
    ).not.toBeNull()
    expect(screen.queryByRole('button', { name: /editar produto/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /excluir produto/i })).toBeNull()

    fireEvent.click(screen.getByRole('link', { name: 'Voltar para produtos' }))

    expect(handleBackMock).toHaveBeenCalledOnce()
  })

  it('shows request recovery and delegates retry', () => {
    useProductStockSlotMock.mockReturnValue(
      fakeProductStockSlot({ isError: true, productStock: undefined }),
    )

    renderPage()

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar o estoque',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(handleRetryMock).toHaveBeenCalledOnce()
  })
})

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <RestContext.Provider value={{ mrpService: fakeMrpService() } as never}>
      <QueryClientProvider client={queryClient}>
        <ProductStockSlot productId='product-1' />
      </QueryClientProvider>
    </RestContext.Provider>,
  )
}

function fakeProductStockSlot(
  overrides: Partial<ReturnType<typeof useProductStockSlot>> = {},
): ReturnType<typeof useProductStockSlot> {
  return {
    productStock: fakeProductStock(),
    selectedAction: undefined,
    isBrandActionPending: false,
    isError: false,
    isLoading: false,
    handleAddBrand: vi.fn(),
    handleActionOpenChange: vi.fn(),
    handleActionSuccess: vi.fn(),
    handleBack: handleBackMock,
    handleEntry: vi.fn(),
    handleDeleteBrand: vi.fn(),
    handleEditBrand: vi.fn(),
    handleRetry: handleRetryMock,
    handleSetPrimaryBrand: vi.fn(),
    handleWriteOff: vi.fn(),
    ...overrides,
  }
}

function fakeProductStock() {
  return {
    product: ProductFaker.fake({
      id: 'product-1',
      establishmentId: 'establishment-1',
      name: 'Polpa de morango',
      unit: 'kg',
      categories: ['ingredient'],
      stockControl: 'single',
      status: 'active',
      allowNegativeStock: false,
      idealStock: 10,
    }),
    stockQuantity: 12,
    idealStock: 10,
    stockSituation: 'normal' as const,
    brands: [],
  }
}

function fakeMrpService(): MrpService {
  return {
    getProductPricing: vi.fn(),
    registerProductSize: vi.fn(),
    updateProductSize: vi.fn(),
    removeProductSize: vi.fn(),
    saveSingleResaleConfiguration: vi.fn(),
    saveBrandResaleConfiguration: vi.fn(),
    getProductStock: vi.fn(),
    listStockTransactions: vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ body: { items: [], page: 1, limit: 5, total: 0 } }),
      ),
    getProductRecipe: vi.fn(),
    saveRecipeYield: vi.fn(),
    addRecipeIngredient: vi.fn(),
    updateRecipeIngredient: vi.fn(),
    removeRecipeIngredient: vi.fn(),
    previewProduction: vi.fn(),
    registerProduction: vi.fn(),
    listProducts: vi.fn(),
    registerProduct: vi.fn(),
    registerProductBrand: vi.fn(),
    updateProductBrand: vi.fn(),
    setPrimaryProductBrand: vi.fn(),
    removeProductBrand: vi.fn(),
    adjustProductStock: vi.fn(),
    getProductAccompaniments: vi.fn(),
    linkProductAccompaniment: vi.fn(),
    updateProductAccompaniment: vi.fn(),
    removeProductAccompaniment: vi.fn(),
    listAccompanimentTypes: vi.fn(),
    createAccompanimentType: vi.fn(),
    renameAccompanimentType: vi.fn(),
    removeAccompanimentType: vi.fn(),
  }
}
