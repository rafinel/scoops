import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductBrandDialog } from '.'

const registerProductBrandMock = vi.fn()
const updateProductBrandMock = vi.fn()

vi.mock('@/ui/mrp/hooks/use-register-product-brand-action', () => ({
  useRegisterProductBrandAction: () => ({
    error: null,
    isPending: false,
    registerProductBrand: registerProductBrandMock,
  }),
}))
vi.mock('@/ui/mrp/hooks/use-update-product-brand-action', () => ({
  useUpdateProductBrandAction: () => ({
    error: null,
    isPending: false,
    updateProductBrand: updateProductBrandMock,
  }),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

describe('ProductBrandDialog', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('submits the add contract with trimmed values and unit-price preview', async () => {
    registerProductBrandMock.mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    render(
      <ProductBrandDialog
        open
        variant='add'
        productId='product-1'
        productName='Polpa'
        unit='kg'
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.change(screen.getByLabelText('Nome da marca'), {
      target: { value: '  Frooty  ' },
    })
    fireEvent.change(getInput('packageQuantity'), { target: { value: '2' } })
    fireEvent.change(getInput('packageValue'), { target: { value: '10' } })
    fireEvent.change(getInput('initialQuantity'), { target: { value: '4' } })
    expect(screen.getByText(/R\$\s*5,00 \/ kg/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() =>
      expect(registerProductBrandMock).toHaveBeenCalledWith({
        name: 'Frooty',
        packageQuantity: 2,
        packageValue: 10,
        initialQuantity: 4,
      }),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalled()
  })

  it('keeps stock out of the edit contract', async () => {
    updateProductBrandMock.mockResolvedValue(undefined)
    const now = new Date()
    const brand = {
      brand: {
        id: 'brand-1',
        productId: 'product-1',
        name: 'Antiga',
        packageQuantity: 2,
        packagePrice: 8,
        isPrimary: false,
        createdAt: now,
        updatedAt: now,
      },
      stockQuantity: 9,
      unitPrice: 4,
    }
    render(
      <ProductBrandDialog
        brand={brand}
        open
        variant='edit'
        productId='product-1'
        productName='Polpa'
        unit='kg'
        onOpenChange={vi.fn()}
      />,
    )

    expect(document.querySelector('[name="initialQuantity"]')).toBeNull()
    fireEvent.change(screen.getByLabelText('Nome da marca'), {
      target: { value: 'Nova' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() =>
      expect(updateProductBrandMock).toHaveBeenCalledWith({
        brandId: 'brand-1',
        name: 'Nova',
        packageQuantity: 2,
        packageValue: 8,
      }),
    )
  })
})

function getInput(name: string) {
  const input = document.querySelector<HTMLInputElement>(`[name="${name}"]`)
  if (!input) throw new Error(`Missing ${name} input`)
  return input
}
