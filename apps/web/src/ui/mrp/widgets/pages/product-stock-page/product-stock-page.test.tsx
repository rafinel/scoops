import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { MrpService } from '@scoops/core/mrp/interfaces'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { RestContext } from '@/ui/shared/contexts/rest-context'
import { ProductStockPage } from '.'

const navigateToMock = vi.fn()

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

describe('ProductStockPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the real single-stock composition and delegates return navigation', async () => {
    const mrpService = createMrpService()
    renderPage(mrpService)

    expect(
      screen.getByRole('status', { name: 'Carregando estoque do produto' }),
    ).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Polpa de morango' })).toBeTruthy()
    expect(screen.getByText('Movimentar estoque')).toBeTruthy()
    expect(screen.getByText('Histórico de Movimentações')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /editar produto/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /excluir produto/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para produtos' }))
    expect(navigateToMock).toHaveBeenCalledWith('products')
  })

  it('shows request recovery and refetches the nearest service boundary', async () => {
    const mrpService = createMrpService()
    vi.mocked(mrpService.getProductStock)
      .mockResolvedValueOnce(new RestResponse({ statusCode: 503 }))
      .mockResolvedValueOnce(new RestResponse({ body: createProductStock() }))
    renderPage(mrpService)

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Não foi possível carregar o estoque',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('heading', { name: 'Polpa de morango' })).toBeTruthy()
    expect(mrpService.getProductStock).toHaveBeenCalledTimes(2)
  })
})

function renderPage(mrpService: MrpService) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <RestContext.Provider value={{ mrpService } as never}>
      <QueryClientProvider client={queryClient}>
        <ProductStockPage productId='product-1' />
      </QueryClientProvider>
    </RestContext.Provider>,
  )
}

function createProductStock() {
  const now = new Date('2026-08-18T12:00:00.000Z')
  return {
    product: {
      id: 'product-1',
      establishmentId: 'establishment-1',
      name: 'Polpa de morango',
      unit: 'kg' as const,
      categories: ['ingredient'] as const,
      stockControl: 'single' as const,
      status: 'active' as const,
      allowNegativeStock: false,
      idealStock: 10,
      createdAt: now,
      updatedAt: now,
    },
    stockQuantity: 12,
    idealStock: 10,
    stockSituation: 'normal' as const,
    brands: [],
  }
}

function createMrpService(): MrpService {
  return {
    getProductStock: vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: createProductStock() })),
    listStockTransactions: vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ body: { items: [], page: 1, limit: 5, total: 0 } }),
      ),
    listProducts: vi.fn(),
    registerProduct: vi.fn(),
    registerProductBrand: vi.fn(),
    updateProductBrand: vi.fn(),
    setPrimaryProductBrand: vi.fn(),
    removeProductBrand: vi.fn(),
    adjustProductStock: vi.fn(),
  }
}
