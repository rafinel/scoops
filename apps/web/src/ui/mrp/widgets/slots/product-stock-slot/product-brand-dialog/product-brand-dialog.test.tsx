import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductBrandDialog } from '.'

import { useProductBrandDialog } from './use-product-brand-dialog'

vi.mock('./use-product-brand-dialog', () => ({
  useProductBrandDialog: vi.fn(),
}))

const useProductBrandDialogMock = vi.mocked(useProductBrandDialog)
const handleOpenChangeMock = vi.fn()
const handleSubmitMock = vi.fn()

describe('ProductBrandDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProductBrandDialogMock.mockReturnValue(fakeProductBrandDialog())
  })

  afterEach(cleanup)

  it('renders the add state and delegates submission', () => {
    render(<ProductBrandDialog {...fakeProps()} />)

    expect(screen.getByRole('heading', { name: 'Adicionar marca' })).not.toBeNull()
    expect(screen.getByText('Estoque inicial (opcional)')).not.toBeNull()
    expect(screen.getByText(/R\$\s*5,00 \/ kg/)).not.toBeNull()

    const form = screen.getByRole('button', { name: 'Confirmar' }).closest('form')
    if (!form) throw new Error('Missing product brand form')
    fireEvent.submit(form)

    expect(handleSubmitMock).toHaveBeenCalledOnce()
  })

  it('renders the edit state without an initial-stock field', () => {
    render(<ProductBrandDialog {...fakeProps({ brand: fakeBrand(), variant: 'edit' })} />)

    expect(screen.getByRole('heading', { name: 'Editar marca' })).not.toBeNull()
    expect(screen.queryByText('Estoque inicial (opcional)')).toBeNull()
  })

  it('shows the mapped error and delegates cancellation', () => {
    useProductBrandDialogMock.mockReturnValue(
      fakeProductBrandDialog({ actionError: new Error('request failed') }),
    )
    render(<ProductBrandDialog {...fakeProps()} />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível salvar a marca',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(handleOpenChangeMock).toHaveBeenCalledWith(false)
  })
})

function fakeProps(overrides: Partial<ComponentProps<typeof ProductBrandDialog>> = {}) {
  return {
    open: true,
    variant: 'add' as const,
    productId: 'product-1',
    productName: 'Polpa',
    unit: 'kg' as const,
    onOpenChange: vi.fn(),
    ...overrides,
  }
}

function fakeProductBrandDialog(
  overrides: Partial<ReturnType<typeof useProductBrandDialog>> = {},
): ReturnType<typeof useProductBrandDialog> {
  return {
    actionError: null,
    errors: {},
    handleOpenChange: handleOpenChangeMock,
    handleSubmit: handleSubmitMock,
    isPending: false,
    packageQuantity: '2',
    packageValue: '10',
    unitPrice: 5,
    register: vi.fn(() => ({})) as never,
    ...overrides,
  }
}

function fakeBrand() {
  return {
    brand: {
      id: 'brand-1',
      productId: 'product-1',
      name: 'Frooty',
      packageQuantity: 2,
      packagePrice: 8,
      isPrimary: false,
      createdAt: new Date('2026-08-22T12:00:00.000Z'),
      updatedAt: new Date('2026-08-22T12:00:00.000Z'),
    },
    stockQuantity: 9,
    unitPrice: 4,
  }
}
