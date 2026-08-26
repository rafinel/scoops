import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RemoveComboProductDialog } from '..'
import { useRemoveComboProductDialog } from '../use-remove-combo-product-dialog'

vi.mock('../use-remove-combo-product-dialog', () => ({
  useRemoveComboProductDialog: vi.fn(),
}))

describe('RemoveComboProductDialog', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.mocked(useRemoveComboProductDialog).mockReturnValue({
      handleConfirm: vi.fn(),
      handleOpenChange: vi.fn(),
    })
  })

  it('describes the selected product and delegates confirmation', () => {
    const handleConfirm = vi.fn()
    vi.mocked(useRemoveComboProductDialog).mockReturnValue({
      handleConfirm,
      handleOpenChange: vi.fn(),
    })

    render(
      <RemoveComboProductDialog
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
        open
        productName='Açaí 500 ml'
        resolveFinalFocus={() => null}
      />,
    )

    expect(
      screen.getByRole('alertdialog', { name: 'Remover produto do Combo?' }).textContent,
    ).toContain('O produto Açaí 500 ml será removido da composição.')
    fireEvent.click(screen.getByRole('button', { name: 'Remover produto' }))
    expect(handleConfirm).toHaveBeenCalledOnce()
  })
})
