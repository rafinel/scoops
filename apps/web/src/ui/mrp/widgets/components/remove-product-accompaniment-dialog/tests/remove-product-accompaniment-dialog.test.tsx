import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductAccompanimentFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { RemoveProductAccompanimentDialog } from '../index'
import { useRemoveProductAccompanimentDialog } from '../use-remove-product-accompaniment-dialog'

vi.mock('../use-remove-product-accompaniment-dialog', () => ({
  useRemoveProductAccompanimentDialog: vi.fn(),
}))

const useRemoveProductAccompanimentDialogMock = vi.mocked(
  useRemoveProductAccompanimentDialog,
)
const item = {
  ...ProductAccompanimentFaker.fake({ id: 'link-1' }),
  accompanimentProductName: 'Granola',
  accompanimentTypeName: 'Cobertura',
  unit: 'g' as const,
  salePrice: 3,
  isGlobal: false,
  hasOtherPortionLinks: false,
}

describe('RemoveProductAccompanimentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveProductAccompanimentDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm: vi.fn(),
      isPending: false,
    })
  })

  it('renders the named warning and delegates confirmation', () => {
    const handleConfirm = vi.fn()
    useRemoveProductAccompanimentDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm,
      isPending: false,
    })

    render(
      <RemoveProductAccompanimentDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(
      screen.getByRole('alertdialog', { name: 'Remover acompanhamento?' }),
    ).toBeTruthy()
    expect(screen.getByRole('alertdialog').textContent).toContain('Granola')
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))

    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it('exposes a mutation error while keeping the confirmation available', () => {
    useRemoveProductAccompanimentDialogMock.mockReturnValue({
      actionError: 'request failed',
      handleConfirm: vi.fn(),
      isPending: false,
    })

    render(
      <RemoveProductAccompanimentDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain('request failed')
    expect(
      screen.getByRole('button', { name: 'Remover' }).getAttribute('disabled'),
    ).toBeNull()
  })

  it('names the Portion in the warning when the link is removed from a Portions tab row', () => {
    render(
      <RemoveProductAccompanimentDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        portionName='Açaí 300 ml'
        productId='portion-1'
      />,
    )

    expect(screen.getByRole('alertdialog').textContent).toContain(
      'O vínculo de Granola com Açaí 300 ml será removido. O estoque e o histórico permanecem intactos.',
    )
  })

  it('keeps the generic warning when no Portion name is given', () => {
    render(
      <RemoveProductAccompanimentDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(screen.getByRole('alertdialog').textContent).toContain(
      'O vínculo de Granola será removido. O estoque e o histórico permanecem intactos.',
    )
  })
})
