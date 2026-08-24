import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductSizeDialog } from '../index'
import { useProductSizeDialog } from '../use-product-size-dialog'

vi.mock('../use-product-size-dialog', () => ({
  useProductSizeDialog: vi.fn(),
}))

const useProductSizeDialogMock = vi.mocked(useProductSizeDialog)

describe('ProductSizeDialog', () => {
  beforeEach(() => {
    useProductSizeDialogMock.mockReturnValue({
      errors: {},
      formError: null,
      handleSubmit: vi.fn((event) => event.preventDefault()),
      isEdit: false,
      isPending: false,
      register: vi.fn((name) => ({ name })),
    } as never)
  })

  it('renders the add form with accessible fields and primary action', () => {
    render(
      <ProductSizeDialog
        isOpen
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        productId='product-1'
        unit='ml'
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Adicionar tamanho' })).toBeTruthy()
    expect(screen.getByLabelText('Nome')).toBeTruthy()
    expect(screen.getByLabelText('Quantidade')).toBeTruthy()
    expect(screen.getByLabelText('Preço')).toBeTruthy()
  })

  it('disables form actions while a size mutation is pending', () => {
    useProductSizeDialogMock.mockReturnValue({
      errors: {},
      formError: 'Não foi possível salvar.',
      handleSubmit: vi.fn((event) => event.preventDefault()),
      isEdit: true,
      isPending: true,
      register: vi.fn((name) => ({ name })),
    } as never)

    render(
      <ProductSizeDialog
        isOpen
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        productId='product-1'
        size={{
          size: {
            id: 'size-1',
            establishmentId: 'establishment-1',
            productId: 'product-1',
            name: '300 ml',
            quantity: 300,
            price: 10,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }}
        unit='ml'
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Salvando…' }).getAttribute('disabled'),
    ).not.toBeNull()
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível salvar.')
  })
})
