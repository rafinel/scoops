import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PortionConfigurationDialog } from '..'
import { usePortionConfigurationDialog } from '../use-portion-configuration-dialog'

vi.mock('../use-portion-configuration-dialog', () => ({
  usePortionConfigurationDialog: vi.fn(),
}))

const usePortionConfigurationDialogMock = vi.mocked(usePortionConfigurationDialog)

const product = {
  productId: 'product-portion',
  name: 'Taça de morango',
  unit: 'kg' as const,
  kind: 'portion' as const,
  stockControl: 'single' as const,
  isActive: true,
  isAvailable: true,
  sizes: [
    {
      sizeId: 'size-medium',
      name: 'Médio',
      quantity: 0.2,
      basePrice: 20,
      isActive: true,
      isAvailable: true,
      accompaniments: [
        {
          accompanimentId: 'topping-1',
          name: 'Calda de chocolate',
          type: 'Cobertura',
          quantityPerPortion: 1,
          basePrice: 2,
          isActive: true,
          isAvailable: true,
        },
      ],
    },
  ],
  resaleBrands: [],
}

describe('PortionConfigurationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const granola = {
      ...product.sizes[0].accompaniments[0],
      accompanimentId: 'granola',
      name: 'Granola',
    }
    usePortionConfigurationDialogMock.mockReturnValue({
      accompanimentIds: ['granola'],
      accompanimentGroups: [
        {
          type: 'Cobertura',
          accompaniments: [
            granola,
            { ...granola, accompanimentId: 'pacoca', name: 'Paçoca', isAvailable: false },
          ],
        },
        {
          type: 'Extra',
          accompaniments: [
            {
              ...granola,
              type: 'Extra',
              accompanimentId: 'banana',
              name: 'Banana',
              basePrice: 0,
            },
          ],
        },
      ],
      estimatedUnitPrice: 22,
      formError: null,
      quantity: 1,
      selectedSize: product.sizes[0],
      sizeId: 'size-medium',
      handleAccompanimentChange: vi.fn(),
      handleClose: vi.fn(),
      handleQuantityChange: vi.fn(),
      handleSizeChange: vi.fn(),
      handleSubmit: vi.fn(),
    })
  })

  afterEach(cleanup)

  function renderDialog() {
    render(
      <PortionConfigurationDialog
        isOpen
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        product={product}
      />,
    )
  }

  it('groups options by configured type and keeps free pricing inside its type', () => {
    renderDialog()

    const toppings = screen.getByRole('group', { name: 'Cobertura' })
    const extras = screen.getByRole('group', { name: 'Extra' })
    expect(
      within(toppings)
        .getByRole('checkbox', { name: 'Granola' })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      within(toppings)
        .getByRole('checkbox', { name: 'Paçoca' })
        .getAttribute('aria-disabled'),
    ).toBe('true')
    expect(within(toppings).getByText('Sem estoque').textContent).toBe('Sem estoque')
    expect(
      within(extras)
        .getByRole('checkbox', { name: 'Banana' })
        .getAttribute('aria-checked'),
    ).toBe('false')
    expect(within(extras).getByText('Grátis').textContent).toBe('Grátis')
    expect(screen.queryByRole('group', { name: 'Grátis' })).toBeNull()
  })

  it('delegates selection and cart confirmation through the owning hook', () => {
    renderDialog()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Banana' }))
    expect(
      usePortionConfigurationDialogMock.mock.results[0].value.handleAccompanimentChange,
    ).toHaveBeenCalledWith('banana', true)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))
    expect(
      usePortionConfigurationDialogMock.mock.results[0].value.handleSubmit,
    ).toHaveBeenCalledOnce()
  })
})
