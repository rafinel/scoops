import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MakeIndividualDialog } from '../index'
import { useMakeIndividualDialog } from '../use-make-individual-dialog'

vi.mock('../use-make-individual-dialog', () => ({ useMakeIndividualDialog: vi.fn() }))

const useMakeIndividualDialogMock = vi.mocked(useMakeIndividualDialog)

function createState(
  overrides: Partial<ReturnType<typeof useMakeIndividualDialog>> = {},
): ReturnType<typeof useMakeIndividualDialog> {
  return { actionError: null, isPending: false, handleConfirm: vi.fn(), ...overrides }
}

function renderDialog(onOpenChange = vi.fn()) {
  return render(
    <MakeIndividualDialog
      accompanimentName='Granola'
      onOpenChange={onOpenChange}
      onSuccess={vi.fn()}
      open
      productId='accompaniment-1'
    />,
  )
}

describe('MakeIndividualDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useMakeIndividualDialogMock.mockReturnValue(createState())
  })

  it('passes its scope to the owning hook', () => {
    renderDialog()

    expect(useMakeIndividualDialogMock).toHaveBeenCalledWith({
      accompanimentName: 'Granola',
      onOpenChange: expect.any(Function),
      onSuccess: expect.any(Function),
      open: true,
      productId: 'accompaniment-1',
    })
  })

  it('names the Accompaniment and explains what stays and what changes', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', { name: 'Tornar Granola individual?' })
    expect(dialog.textContent).toContain('Granola deixará de ser global.')
    expect(screen.getByRole('status').textContent).toBe(
      'As porções atuais continuam com o acompanhamento como vínculo individual; novas porções não o receberão. Os saldos de estoque não mudam.',
    )
    expect(screen.getByRole('button', { name: 'Tornar individual' })).toBeTruthy()
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('delegates confirmation without closing the dialog by itself', () => {
    const handleConfirm = vi.fn()
    const onOpenChange = vi.fn()
    useMakeIndividualDialogMock.mockReturnValue(createState({ handleConfirm }))
    renderDialog(onOpenChange)

    fireEvent.click(screen.getByRole('button', { name: 'Tornar individual' }))

    expect(handleConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes through Cancelar', () => {
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('shows the pending label and disables both actions while converting', () => {
    useMakeIndividualDialogMock.mockReturnValue(createState({ isPending: true }))
    renderDialog()

    expect(
      screen.getByRole('button', { name: 'Convertendo…' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Cancelar' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('shows an inline alert and keeps the confirmation available after a failure', () => {
    useMakeIndividualDialogMock.mockReturnValue(
      createState({ actionError: 'request failed' }),
    )
    renderDialog()

    expect(screen.getByRole('alert').textContent).toBe('request failed')
    expect(
      screen.getByRole('button', { name: 'Tornar individual' }).hasAttribute('disabled'),
    ).toBe(false)
  })
})
