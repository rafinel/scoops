import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeleteComboDialog } from '..'
import { useDeleteComboDialog } from '../use-delete-combo-dialog'

import { comboDetails } from '../../tests/combo-test-fixtures'

vi.mock('../use-delete-combo-dialog', () => ({ useDeleteComboDialog: vi.fn() }))

describe('DeleteComboDialog', () => {
  afterEach(cleanup)
  beforeEach(() =>
    vi
      .mocked(useDeleteComboDialog)
      .mockReturnValue({ actionError: null, handleConfirm: vi.fn(), isPending: false }),
  )

  it('describes history preservation and delegates the destructive action', () => {
    const handleConfirm = vi.fn()
    vi.mocked(useDeleteComboDialog).mockReturnValue({
      actionError: null,
      handleConfirm,
      isPending: false,
    })
    render(
      <DeleteComboDialog
        combo={comboDetails.combo}
        expectedUpdatedAt={comboDetails.combo.updatedAt}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )
    expect(
      screen.getByRole('alertdialog', { name: 'Excluir combo?' }).textContent,
    ).toContain('histórico')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir combo' }))
    expect(handleConfirm).toHaveBeenCalledOnce()
  })
})
