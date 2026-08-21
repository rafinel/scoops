import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { MrpService } from '@scoops/core/mrp/interfaces'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { RestContext } from '@/ui/shared/contexts/rest-context'
import { StockTransactionHistoryCard } from '.'

describe('StockTransactionHistoryCard', () => {
  afterEach(cleanup)
  it('renders signed immutable snapshots and sends exact filter and page inputs', async () => {
    const mrpService = createMrpService()
    renderHistory(mrpService)

    expect(await screen.findAllByText('Gestora Ágil')).toHaveLength(2)
    expect(screen.getAllByText('+3 kg')).toHaveLength(2)
    expect(screen.getAllByText('Marca removida')).toHaveLength(2)

    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }))
    selectOption(await screen.findByRole('option', { name: 'Baixa Manual' }))
    fireEvent.click(screen.getByRole('combobox', { name: 'Marca' }))
    selectOption(await screen.findByRole('option', { name: 'Frooty' }))
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-08-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-08-18' } })

    await waitFor(() =>
      expect(mrpService.listStockTransactions).toHaveBeenLastCalledWith(
        'product-1',
        expect.objectContaining({
          page: 1,
          limit: 5,
          type: 'write-off',
          brandId: 'brand-1',
        }),
      ),
    )
    const input = vi.mocked(mrpService.listStockTransactions).mock.calls.at(-1)?.[1]
    expect(input?.from).toEqual(new Date('2026-08-01T00:00:00.000'))
    expect(input?.to).toEqual(new Date('2026-08-18T23:59:59.999'))

    fireEvent.click(screen.getByRole('button', { name: /Limpar filtros/ }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Limpar filtros/ })).toBeNull(),
    )
  })

  it('distinguishes loading, request error with retry, and empty history', async () => {
    const mrpService = createMrpService()
    vi.mocked(mrpService.listStockTransactions)
      .mockResolvedValueOnce(new RestResponse({ statusCode: 503 }))
      .mockResolvedValueOnce(
        new RestResponse({ body: { items: [], page: 1, limit: 5, total: 0 } }),
      )
    renderHistory(mrpService)

    expect(screen.getByRole('status').textContent).toContain('Carregando histórico')
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Não foi possível carregar',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhuma movimentação registrada.')).toBeTruthy()
    expect(mrpService.listStockTransactions).toHaveBeenCalledTimes(2)
  })
})

function selectOption(option: HTMLElement) {
  fireEvent.pointerDown(option, { button: 0, pointerId: 1 })
  fireEvent.pointerUp(option, { button: 0, pointerId: 1 })
  fireEvent.click(option)
}

function renderHistory(mrpService: MrpService) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <RestContext.Provider value={{ mrpService } as never}>
      <QueryClientProvider client={queryClient}>
        <StockTransactionHistoryCard brands={[createBrand()]} productId='product-1' />
      </QueryClientProvider>
    </RestContext.Provider>,
  )
}

function createMrpService(): MrpService {
  const transaction = {
    id: 'transaction-1',
    establishmentId: 'establishment-1',
    productId: 'product-1',
    brandId: 'deleted-brand',
    productName: 'Polpa',
    brandName: 'Marca removida',
    unit: 'kg' as const,
    type: 'entry' as const,
    quantity: 3,
    balanceAfter: 13,
    performedBy: 'user-1',
    performedByName: 'Gestora Ágil',
    occurredAt: new Date('2026-08-18T12:00:00.000Z'),
  }
  return {
    listStockTransactions: vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ body: { items: [transaction], page: 1, limit: 5, total: 1 } }),
      ),
    listProducts: vi.fn(),
    registerProduct: vi.fn(),
    getProductStock: vi.fn(),
    registerProductBrand: vi.fn(),
    updateProductBrand: vi.fn(),
    setPrimaryProductBrand: vi.fn(),
    removeProductBrand: vi.fn(),
    adjustProductStock: vi.fn(),
  }
}

function createBrand() {
  const now = new Date()
  return {
    brand: {
      id: 'brand-1',
      productId: 'product-1',
      name: 'Frooty',
      packageQuantity: 2,
      packagePrice: 8,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
    stockQuantity: 10,
    unitPrice: 4,
  }
}
