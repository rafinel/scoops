import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { RemoveGlobalAccompanimentDialog } from '../index'
import { useRemoveGlobalAccompanimentDialog } from '../use-remove-global-accompaniment-dialog'

vi.mock('../use-remove-global-accompaniment-dialog', () => ({
  useRemoveGlobalAccompanimentDialog: vi.fn(),
}))

const useRemoveGlobalAccompanimentDialogMock = vi.mocked(
  useRemoveGlobalAccompanimentDialog,
)

const item: ProductAccompanimentDetails = {
  id: 'link-1',
  accompanimentProductId: 'product-2',
  accompanimentProductName: 'Granola',
  accompanimentTypeId: 'type-1',
  accompanimentTypeName: 'Cobertura',
  unit: 'g',
  quantityPerPortion: 50,
  salePrice: 3,
  isGlobal: true,
  hasOtherPortionLinks: false,
}

const createDialogState = (
  overrides: Partial<ReturnType<typeof useRemoveGlobalAccompanimentDialog>> = {},
): ReturnType<typeof useRemoveGlobalAccompanimentDialog> => ({
  actionError: null,
  actionLabel: 'Remover desta porção',
  consequence:
    'Granola continua nas outras porções e nas novas. Você pode vinculá-lo de novo a esta porção depois. Os saldos de estoque não mudam.',
  description: 'Granola é um acompanhamento global. Escolha onde ele deve ser removido.',
  helpText: 'Desligado: remove apenas de Polpa de Açaí.',
  isPending: false,
  isScopeLocked: false,
  removeAll: false,
  handleConfirm: vi.fn(),
  handleRemoveAllChange: vi.fn(),
  ...overrides,
})

function renderDialog(onOpenChange = vi.fn()) {
  return render(
    <RemoveGlobalAccompanimentDialog
      item={item}
      onOpenChange={onOpenChange}
      onSuccess={vi.fn()}
      open
      portionName='Polpa de Açaí'
      productId='product-1'
    />,
  )
}

describe('RemoveGlobalAccompanimentDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveGlobalAccompanimentDialogMock.mockReturnValue(createDialogState())
  })

  it('passes the item, Portion name and open state to the owning hook', () => {
    renderDialog()

    expect(useRemoveGlobalAccompanimentDialogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isScopeLocked: false,
        itemId: 'link-1',
        itemName: 'Granola',
        onSuccess: expect.any(Function),
        open: true,
        portionName: 'Polpa de Açaí',
        productId: 'product-1',
      }),
    )
  })

  it('names the accompaniment and starts with the Portion-only scope', () => {
    renderDialog()

    const dialog = screen.getByRole('alertdialog', { name: 'Remover Granola?' })
    expect(dialog.textContent).toContain(
      'Granola é um acompanhamento global. Escolha onde ele deve ser removido.',
    )
    const scopeSwitch = screen.getByRole('switch', {
      name: 'Remover de todas as porções',
    })
    expect(scopeSwitch.getAttribute('aria-checked')).toBe('false')
    expect(scopeSwitch.getAttribute('aria-describedby')).not.toBeNull()
    expect(screen.getByText('Desligado: remove apenas de Polpa de Açaí.')).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'Remover desta porção' })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('announces the Portion-only consequence as a polite status', () => {
    renderDialog()

    const status = screen.getByRole('status')
    expect(status.textContent).toContain(
      'Granola continua nas outras porções e nas novas.',
    )
    expect(status.textContent).toContain('Os saldos de estoque não mudam.')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the all-Portions state and its filled action', () => {
    useRemoveGlobalAccompanimentDialogMock.mockReturnValue(
      createDialogState({
        actionLabel: 'Remover de todas',
        consequence:
          'Será removido de todas as porções, incluindo esta. Novas porções não o receberão. Os saldos de estoque não mudam.',
        helpText: 'Granola deixa de ser global.',
        removeAll: true,
      }),
    )

    renderDialog()

    expect(
      screen
        .getByRole('switch', { name: 'Remover de todas as porções' })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(screen.getByText('Granola deixa de ser global.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain(
      'Será removido de todas as porções, incluindo esta. Novas porções não o receberão.',
    )
    expect(screen.getByRole('button', { name: 'Remover de todas' })).toBeTruthy()
  })

  it('delegates scope changes with the toggled value', () => {
    const handleRemoveAllChange = vi.fn()
    useRemoveGlobalAccompanimentDialogMock.mockReturnValue(
      createDialogState({ handleRemoveAllChange }),
    )
    renderDialog()

    fireEvent.click(screen.getByRole('switch', { name: 'Remover de todas as porções' }))

    expect(handleRemoveAllChange).toHaveBeenCalledWith(true)
  })

  it('delegates confirmation without closing the dialog by itself', () => {
    const handleConfirm = vi.fn()
    const onOpenChange = vi.fn()
    useRemoveGlobalAccompanimentDialogMock.mockReturnValue(
      createDialogState({ handleConfirm }),
    )
    renderDialog(onOpenChange)

    fireEvent.click(screen.getByRole('button', { name: 'Remover desta porção' }))

    expect(handleConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeTruthy()
  })

  it('closes through Cancelar', () => {
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('disables every control while the removal is pending', () => {
    useRemoveGlobalAccompanimentDialogMock.mockReturnValue(
      createDialogState({ actionLabel: 'Removendo…', isPending: true }),
    )
    renderDialog()

    expect(
      screen.getByRole('button', { name: 'Removendo…' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Cancelar' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen
        .getByRole('switch', { name: 'Remover de todas as porções' })
        .getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('shows an inline alert while preserving the scope switch and confirmation', () => {
    useRemoveGlobalAccompanimentDialogMock.mockReturnValue(
      createDialogState({
        actionError: 'request failed',
        actionLabel: 'Remover de todas',
        removeAll: true,
      }),
    )
    renderDialog()

    expect(screen.getByRole('alert').textContent).toBe('request failed')
    expect(
      screen
        .getByRole('switch', { name: 'Remover de todas as porções' })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      screen.getByRole('button', { name: 'Remover de todas' }).hasAttribute('disabled'),
    ).toBe(false)
  })

  describe('page-level removal from every Portion', () => {
    const lockedState = () =>
      createDialogState({
        actionLabel: 'Remover de todas',
        consequence:
          'Será removido de todas as porções. Novas porções não o receberão. Os saldos de estoque não mudam.',
        description:
          'Granola é um acompanhamento global e será removido de todas as porções.',
        helpText: 'Granola deixa de ser global.',
        isScopeLocked: true,
        removeAll: true,
      })

    function renderLockedDialog() {
      return render(
        <RemoveGlobalAccompanimentDialog
          accompanimentName='Granola'
          isScopeLocked
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
          open
          productId='accompaniment-1'
        />,
      )
    }

    beforeEach(() => {
      useRemoveGlobalAccompanimentDialogMock.mockReturnValue(lockedState())
    })

    it('passes the Accompaniment scope without a link to the owning hook', () => {
      renderLockedDialog()

      expect(useRemoveGlobalAccompanimentDialogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isScopeLocked: true,
          itemId: undefined,
          itemName: 'Granola',
          onSuccess: expect.any(Function),
          open: true,

          productId: 'accompaniment-1',
        }),
      )
    })

    it('shows the page copy with the locked switch on and the danger warning', () => {
      renderLockedDialog()

      const dialog = screen.getByRole('alertdialog', { name: 'Remover Granola?' })
      expect(dialog.textContent).toContain(
        'Granola é um acompanhamento global e será removido de todas as porções.',
      )
      expect(screen.getByText('Granola deixa de ser global.')).toBeTruthy()
      expect(screen.getByRole('status').textContent).toBe(
        'Será removido de todas as porções. Novas porções não o receberão. Os saldos de estoque não mudam.',
      )
      expect(screen.getByRole('button', { name: 'Remover de todas' })).toBeTruthy()
    })

    it('keeps the switch on, focusable and described while it never toggles off', () => {
      renderLockedDialog()
      const scopeSwitch = screen.getByRole('switch', {
        name: 'Remover de todas as porções',
      })

      expect(scopeSwitch.getAttribute('aria-checked')).toBe('true')
      expect(scopeSwitch.getAttribute('aria-disabled')).toBe('true')
      expect(scopeSwitch.getAttribute('tabindex')).toBe('0')
      expect(scopeSwitch.getAttribute('aria-describedby')).toBe(
        screen.getByText('Granola deixa de ser global.').id,
      )
      expect(scopeSwitch.closest('label')?.className).toContain('opacity-60')

      fireEvent.click(scopeSwitch)
      fireEvent.keyDown(scopeSwitch, { key: ' ' })
      fireEvent.keyUp(scopeSwitch, { key: ' ' })

      expect(scopeSwitch.getAttribute('aria-checked')).toBe('true')
    })

    it('delegates confirmation and shows a pending label and inline errors', () => {
      const handleConfirm = vi.fn()
      useRemoveGlobalAccompanimentDialogMock.mockReturnValue({
        ...lockedState(),
        actionError: 'request failed',
        handleConfirm,
      })
      renderLockedDialog()

      expect(screen.getByRole('alert').textContent).toBe('request failed')
      fireEvent.click(screen.getByRole('button', { name: 'Remover de todas' }))
      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
