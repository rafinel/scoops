import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RemoveProductSizeDialog } from '../index'
import { useRemoveProductSizeDialog } from '../use-remove-product-size-dialog'

vi.mock('../use-remove-product-size-dialog', () => ({
  useRemoveProductSizeDialog: vi.fn(),
}))

const useRemoveProductSizeDialogMock = vi.mocked(useRemoveProductSizeDialog)

describe('RemoveProductSizeDialog', () => {
  beforeEach(() => {
    useRemoveProductSizeDialogMock.mockReturnValue({
      formError: null,
      handleConfirm: vi.fn(),
      isPending: false,
    })
  })

  it('renders the named destructive warning and cancel action', () => {
    render(
      <RemoveProductSizeDialog
        isOpen
        onOpenChange={vi.fn()}
        onSuccess={vi.fn(async () => undefined)}
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
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Remover tamanho?' }).textContent,
    ).toContain('300 ml')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy()
    const removeButton = screen.getByRole('button', { name: 'Remover tamanho' })
    expect(removeButton.className).toContain('bg-destructive')
    expect(removeButton.className).toContain('text-destructive-foreground')
    expect(removeButton.className).toContain('shadow-destructive')
  })
})
