import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewSaleCart } from '..'
import { useNewSaleCart } from '../use-new-sale-cart'

vi.mock('../use-new-sale-cart', () => ({ useNewSaleCart: vi.fn() }))

const useNewSaleCartMock = vi.mocked(useNewSaleCart)
const line = {
  accompanimentIds: [],
  kind: 'resale' as const,
  productId: 'product-1',
  quantity: 2,
}
const product = {
  productId: 'product-1',
  name: 'Copo pronto',
  kind: 'resale' as const,
  stockControl: 'single' as const,
  isActive: true,
  isAvailable: true,
  sizes: [],
  resalePrice: 12,
  resaleBrands: [],
}

describe('NewSaleCart', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('offers direct quantity controls and registration', () => {
    const onQuantityChange = vi.fn()
    const onRegister = vi.fn()
    useNewSaleCartMock.mockReturnValue({
      handleClearConfirmationChange: vi.fn(),
      handleConfirmClear: vi.fn(),
      handleEditLine: vi.fn(),
      handleOpenClearConfirmation: vi.fn(),
      handleQuantityChange: onQuantityChange,
      handleRegister: onRegister,
      handleRemoveLine: vi.fn(),
      isClearConfirmationOpen: false,
      lineInputs: [line],
      previewCart: {
        establishmentId: 'establishment-1',
        lines: [
          {
            ...line,
            baseUnitPrice: 12,
            finalUnitPrice: 12,
            subtotal: 24,
            consumptions: [],
          },
        ],
        discounts: [],
        subtotal: 24,
        totalDiscount: 0,
        total: 24,
      },
      productsById: new Map([[product.productId, product]]),
    } as never)

    render(
      <NewSaleCart
        canRegister
        channels={[]}
        isPreviewPending={false}
        lineInputs={[line]}
        onChannelChange={vi.fn()}
        onClear={vi.fn()}
        onEditLine={vi.fn()}
        onQuantityChange={onQuantityChange}
        onRegister={onRegister}
        onRemoveLine={vi.fn()}
        previewCart={undefined}
        products={[product]}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Aumentar quantidade de Copo pronto' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    expect(onQuantityChange).toHaveBeenCalledWith(0, 3)
    expect(onRegister).toHaveBeenCalledOnce()
  })

  it('shows the last matching prices while recalculating repeated product lines', () => {
    const firstLine = { ...line, kind: 'portion' as const, sizeId: 'size-1', accompanimentIds: ['cream'] }
    const secondLine = { ...firstLine, accompanimentIds: ['granola'] }
    const previewLines = [
      { ...firstLine, baseUnitPrice: 20, finalUnitPrice: 20, subtotal: 20, consumptions: [] },
      { ...secondLine, baseUnitPrice: 22, finalUnitPrice: 22, subtotal: 22, consumptions: [] },
    ]
    useNewSaleCartMock.mockReturnValue({
      handleClearConfirmationChange: vi.fn(),
      handleConfirmClear: vi.fn(),
      handleEditLine: vi.fn(),
      handleOpenClearConfirmation: vi.fn(),
      handleQuantityChange: vi.fn(),
      handleRegister: vi.fn(),
      handleRemoveLine: vi.fn(),
      isClearConfirmationOpen: false,
      lineInputs: [firstLine, secondLine],
      previewCart: {
        establishmentId: 'establishment-1', lines: previewLines, discounts: [],
        subtotal: 42, totalDiscount: 0, total: 42,
      },
      productsById: new Map([[product.productId, { ...product, name: 'Açaí tropical', kind: 'portion', sizes: [{ sizeId: 'size-1', name: '300 g', accompaniments: [{ accompanimentId: 'cream', name: 'Creme' }, { accompanimentId: 'granola', name: 'Granola' }] }] }]]),
    } as never)

    render(
      <NewSaleCart
        canRegister
        channels={[]}
        isPreviewPending
        lineInputs={[firstLine, secondLine]}
        onChannelChange={vi.fn()}
        onClear={vi.fn()}
        onEditLine={vi.fn()}
        onQuantityChange={vi.fn()}
        onRegister={vi.fn()}
        onRemoveLine={vi.fn()}
        previewCart={undefined}
        products={[product]}
      />,
    )

    expect(screen.queryAllByText('Atualizando valor…')).toHaveLength(0)
    expect(screen.getByText('R$ 20,00 cada')).toBeTruthy()
    expect(screen.getByText('R$ 22,00 cada')).toBeTruthy()
  })
})
