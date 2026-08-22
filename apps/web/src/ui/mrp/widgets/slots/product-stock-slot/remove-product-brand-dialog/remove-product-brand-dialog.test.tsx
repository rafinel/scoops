import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RemoveProductBrandDialog } from '.'

import { useRemoveProductBrandDialog } from './use-remove-product-brand-dialog'

vi.mock('./use-remove-product-brand-dialog', () => ({
  useRemoveProductBrandDialog: vi.fn(),
}))

const useRemoveProductBrandDialogMock = vi.mocked(useRemoveProductBrandDialog)
const handleConfirmMock = vi.fn()

describe('RemoveProductBrandDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveProductBrandDialogMock.mockReturnValue(fakeRemoveProductBrandDialog())
  })

  afterEach(cleanup)

  it('names the destructive impact and protects a main brand with siblings', () => {
    render(<RemoveProductBrandDialog {...fakeProps({ hasSiblingBrands: true })} />)

    expect(screen.getByText(/Frooty/)).not.toBeNull()
    expect(
      screen.getByText(/histórico de movimentações permanecerá preservado/),
    ).not.toBeNull()
    expect(screen.getByRole('alert').textContent).toContain(
      'Defina outra marca como principal',
    )
    expect(
      (screen.getByRole('button', { name: 'Excluir marca' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('delegates a permitted removal to its hook', () => {
    render(
      <RemoveProductBrandDialog
        {...fakeProps({ brand: fakeBrand({ isPrimary: false }) })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Excluir marca' }))

    expect(handleConfirmMock).toHaveBeenCalledOnce()
  })

  it('renders a hook-provided failure', () => {
    useRemoveProductBrandDialogMock.mockReturnValue(
      fakeRemoveProductBrandDialog({ error: new Error('request failed') }),
    )
    render(<RemoveProductBrandDialog {...fakeProps()} />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível excluir a marca',
    )
  })
})

function fakeProps(
  overrides: Partial<ComponentProps<typeof RemoveProductBrandDialog>> = {},
) {
  return {
    brand: fakeBrand(),
    open: true,
    productId: 'product-1',
    onOpenChange: vi.fn(),
    ...overrides,
  }
}

function fakeRemoveProductBrandDialog(
  overrides: Partial<ReturnType<typeof useRemoveProductBrandDialog>> = {},
): ReturnType<typeof useRemoveProductBrandDialog> {
  return {
    error: null,
    isPending: false,
    handleConfirm: handleConfirmMock,
    handleOpenChange: vi.fn(),
    ...overrides,
  }
}

function fakeBrand({ isPrimary = true }: { isPrimary?: boolean } = {}) {
  const now = new Date('2026-08-22T12:00:00.000Z')
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
