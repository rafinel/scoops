import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RemoveProductBrandDialog } from '.'

const removeProductBrandMock = vi.fn()
vi.mock('@/ui/mrp/hooks/use-remove-product-brand-action', () => ({
  useRemoveProductBrandAction: () => ({
    error: null,
    isPending: false,
    removeProductBrand: removeProductBrandMock,
  }),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

describe('RemoveProductBrandDialog', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('names the destructive impact and protects a main brand with siblings', () => {
    render(
      <RemoveProductBrandDialog
        brand={createBrand(true)}
        hasSiblingBrands
        open
        productId='product-1'
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/Frooty/)).toBeTruthy()
    expect(
      screen.getByText(/histórico de movimentações permanecerá preservado/),
    ).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain(
      'Defina outra marca como principal',
    )
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Excluir marca' }).disabled,
    ).toBe(true)
  })

  it('removes the exact brand and closes only after success', async () => {
    removeProductBrandMock.mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    render(
      <RemoveProductBrandDialog
        brand={createBrand(false)}
        open
        productId='product-1'
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Excluir marca' }))
    await waitFor(() => expect(removeProductBrandMock).toHaveBeenCalledWith('brand-1'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalled()
  })
})

function createBrand(isPrimary: boolean) {
  const now = new Date()
  return {
    brand: {
      id: 'brand-1',
      productId: 'product-1',
      name: 'Frooty',
      packageQuantity: 2,
      packagePrice: 8,
      isPrimary,
      createdAt: now,
      updatedAt: now,
    },
    stockQuantity: 10,
    unitPrice: 4,
  }
}
