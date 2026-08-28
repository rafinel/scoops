import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PortionConfigurationDialog } from '..'

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
          type: 'topping' as const,
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
  afterEach(cleanup)

  it('saves the selected size, accompaniment and quantity', () => {
    const onSave = vi.fn()
    render(
      <PortionConfigurationDialog
        isOpen
        onOpenChange={vi.fn()}
        onSave={onSave}
        product={product}
      />,
    )

    expect(screen.getByText('0,2 kg')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Preço' }).textContent).toContain('Preço')
    fireEvent.click(screen.getByRole('checkbox', { name: /Calda de chocolate/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    const addButton = screen.getByRole('button', { name: 'Adicionar ao carrinho' })
    addButton.focus()
    expect(document.activeElement).toBe(addButton)
    fireEvent.click(addButton)

    expect(onSave).toHaveBeenCalledWith({
      accompanimentIds: ['topping-1'],
      kind: 'portion',
      productId: 'product-portion',
      quantity: 2,
      sizeId: 'size-medium',
    })
  })
})
