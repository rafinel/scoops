import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentGlobalField, type AccompanimentGlobalFieldProps } from '../index'
import { useGlobalField } from '../use-global-field'

vi.mock('../use-global-field', () => ({ useGlobalField: vi.fn() }))

const useGlobalFieldMock = vi.mocked(useGlobalField)

function createHookState(
  overrides: Partial<ReturnType<typeof useGlobalField>> = {},
): ReturnType<typeof useGlobalField> {
  return {
    describedBy: 'help',
    handleCheckedChange: vi.fn(),
    helpId: 'help',
    helpText:
      'Aparece em todas as porções, incluindo as novas. Tipo, quantidade e preço são compartilhados.',
    labelId: 'label',
    replacementNoticeId: 'replacement',
    ...overrides,
  }
}

function renderField(overrides: Partial<AccompanimentGlobalFieldProps> = {}) {
  return render(
    <AccompanimentGlobalField
      handleGlobalChange={vi.fn()}
      isGlobal={false}
      shouldShowReplacementNotice={false}
      {...overrides}
    />,
  )
}

describe('AccompanimentGlobalField', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useGlobalFieldMock.mockReturnValue(createHookState())
  })

  it('renders an enabled switch with its label and shared-values help', () => {
    renderField()

    const globalSwitch = screen.getByRole('switch', {
      name: 'Disponível para todas as porções',
    })
    expect(globalSwitch.getAttribute('aria-checked')).toBe('false')
    expect(globalSwitch.getAttribute('aria-disabled')).toBeNull()
    expect(globalSwitch.getAttribute('aria-describedby')).toBe('help')
    expect(
      screen.getByText(
        'Aparece em todas as porções, incluindo as novas. Tipo, quantidade e preço são compartilhados.',
      ).id,
    ).toBe('help')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('reflects the checked state and delegates toggles to the hook', () => {
    const handleCheckedChange = vi.fn()
    useGlobalFieldMock.mockReturnValue(createHookState({ handleCheckedChange }))
    renderField({ isGlobal: true })
    const globalSwitch = screen.getByRole('switch', {
      name: 'Disponível para todas as porções',
    })

    fireEvent.click(globalSwitch)

    expect(globalSwitch.getAttribute('aria-checked')).toBe('true')
    expect(handleCheckedChange).toHaveBeenCalledTimes(1)
    expect(handleCheckedChange.mock.calls[0]?.[0]).toBe(false)
  })

  it('shows the replacement notice described by the switch when individual links exist', () => {
    useGlobalFieldMock.mockReturnValue(
      createHookState({ describedBy: 'help replacement' }),
    )
    renderField({ isGlobal: true, shouldShowReplacementNotice: true })

    const notice = screen.getByRole('status')
    expect(notice.id).toBe('replacement')
    expect(notice.textContent).toContain('vinculado individualmente a outras porções')
    expect(
      screen
        .getByRole('switch', { name: 'Disponível para todas as porções' })
        .getAttribute('aria-describedby'),
    ).toContain('replacement')
  })

  it('passes its props to the owning hook', () => {
    const handleGlobalChange = vi.fn()
    renderField({ handleGlobalChange, shouldShowReplacementNotice: true })

    expect(useGlobalFieldMock).toHaveBeenCalledWith({
      handleGlobalChange,
      isGlobal: false,
      shouldShowReplacementNotice: true,
    })
  })
})
