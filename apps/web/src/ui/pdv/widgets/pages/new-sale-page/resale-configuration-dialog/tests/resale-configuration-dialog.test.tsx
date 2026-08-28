import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ResaleConfigurationDialog } from '..'

const product = {
  productId: 'product-resale',
  name: 'Pote pronto',
  kind: 'resale' as const,
  stockControl: 'by-brand' as const,
  isActive: true,
  isAvailable: true,
  sizes: [],
  resaleBrands: [
    {
      brandId: 'brand-1',
      name: 'Marca Frooty',
      basePrice: 15,
      isActive: true,
      isAvailable: true,
    },
  ],
}

describe('ResaleConfigurationDialog', () => {
  afterEach(cleanup)

  it('requires a brand and emits the resale line', () => {
    const onSave = vi.fn()
    render(
      <ResaleConfigurationDialog
        isOpen
        onOpenChange={vi.fn()}
        onSave={onSave}
        product={product}
      />,
    )

    expect(screen.getByRole('region', { name: 'Preço' }).textContent).toContain('Preço')
    const brandButton = screen.getByRole('button', { name: /Marca Frooty/ })
    brandButton.focus()
    expect(document.activeElement).toBe(brandButton)
    fireEvent.click(brandButton)
    const addButton = screen.getByRole('button', { name: 'Adicionar ao carrinho' })
    addButton.focus()
    expect(document.activeElement).toBe(addButton)
    fireEvent.click(addButton)

    expect(onSave).toHaveBeenCalledWith({
      accompanimentIds: [],
      brandId: 'brand-1',
      kind: 'resale',
      productId: 'product-resale',
      quantity: 1,
    })
  })
})
