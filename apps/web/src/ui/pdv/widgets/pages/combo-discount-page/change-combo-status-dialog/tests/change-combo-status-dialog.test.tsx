import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChangeComboStatusDialog } from '..'
import { useChangeComboStatusDialog } from '../use-change-combo-status-dialog'

import { comboDetails } from '../../tests/combo-test-fixtures'

vi.mock('../use-change-combo-status-dialog', () => ({
  useChangeComboStatusDialog: vi.fn(),
}))

describe('ChangeComboStatusDialog', () => {
  afterEach(cleanup)
  beforeEach(() =>
    vi
      .mocked(useChangeComboStatusDialog)
      .mockReturnValue({ actionError: null, handleConfirm: vi.fn(), isPending: false }),
  )

  it('keeps status confirmation explicit and prevents accidental close during confirm', () => {
    const handleConfirm = vi.fn()
    vi.mocked(useChangeComboStatusDialog).mockReturnValue({
      actionError: null,
      handleConfirm,
      isPending: false,
    })
    render(
      <ChangeComboStatusDialog
        combo={comboDetails.combo}
        expectedUpdatedAt={comboDetails.combo.updatedAt}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        targetStatus='inactive'
      />,
    )
    expect(
      screen.getByRole('alertdialog', { name: 'Inativar combo?' }).textContent,
    ).toContain('histórico')
    fireEvent.click(screen.getByRole('button', { name: 'Inativar combo' }))
    expect(handleConfirm).toHaveBeenCalledOnce()
  })
})
