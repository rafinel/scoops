import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RemoveAccompanimentTypeDialog } from '../index'
import { useRemoveAccompanimentTypeDialog } from '../use-remove-accompaniment-type-dialog'

vi.mock('../use-remove-accompaniment-type-dialog', () => ({
  useRemoveAccompanimentTypeDialog: vi.fn(),
}))
const useRemoveAccompanimentTypeDialogMock = vi.mocked(useRemoveAccompanimentTypeDialog)
const item = {
  type: AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' }),
  usageCount: 0,
}

describe('RemoveAccompanimentTypeDialog', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveAccompanimentTypeDialogMock.mockReturnValue({
      actionError: null,
      handleConfirm: vi.fn(),
      isPending: false,
    })
  })

  it('requires and delegates explicit confirmation', () => {
    const onSuccess = vi.fn()
    render(
      <RemoveAccompanimentTypeDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
        open
      />,
    )

    expect(
      screen.getByRole('alertdialog', { name: 'Remover tipo de acompanhamento?' }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(
      useRemoveAccompanimentTypeDialogMock.mock.results[0].value.handleConfirm,
    ).toHaveBeenCalledTimes(1)
  })

  it('shows action errors and pending copy', () => {
    useRemoveAccompanimentTypeDialogMock.mockReturnValue({
      actionError: 'Tipo em uso',
      handleConfirm: vi.fn(),
      isPending: true,
    })
    render(
      <RemoveAccompanimentTypeDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain('Tipo em uso')
    expect(screen.getByRole('button', { name: 'Removendo…' })).toBeTruthy()
  })
})
