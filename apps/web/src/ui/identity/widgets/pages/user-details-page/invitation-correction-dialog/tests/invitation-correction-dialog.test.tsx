import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InvitationCorrectionDialog } from '..'
import { useInvitationCorrectionDialog } from '../use-invitation-correction-dialog'

vi.mock('../use-invitation-correction-dialog', () => ({
  useInvitationCorrectionDialog: vi.fn(),
}))

const useInvitationCorrectionDialogMock = vi.mocked(useInvitationCorrectionDialog)
type InvitationCorrectionDialogForm = ReturnType<typeof useInvitationCorrectionDialog>
type FormStateOverrides = Omit<Partial<InvitationCorrectionDialogForm>, 'formState'> & {
  formState?: Partial<InvitationCorrectionDialogForm['formState']>
}

function createProps(
  overrides: Partial<ComponentProps<typeof InvitationCorrectionDialog>> = {},
): ComponentProps<typeof InvitationCorrectionDialog> {
  return {
    email: 'ana@example.com',
    error: null,
    name: 'Ana Operator',
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    pending: false,
    ...overrides,
  }
}

function createFormState(overrides: FormStateOverrides = {}) {
  return {
    formState: { errors: {} },
    handleSubmit: vi.fn(),
    register: vi.fn((name: string) => ({ name })),
    ...overrides,
  } as unknown as InvitationCorrectionDialogForm
}

describe('InvitationCorrectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useInvitationCorrectionDialogMock.mockReturnValue(createFormState())
  })

  afterEach(cleanup)

  it('renders the correction form and delegates submission to its hook', () => {
    const handleSubmit = vi.fn()
    useInvitationCorrectionDialogMock.mockReturnValue(createFormState({ handleSubmit }))

    render(<InvitationCorrectionDialog {...createProps()} />)

    expect(screen.getByRole('dialog', { name: 'Corrigir convite' })).not.toBeNull()
    expect(screen.getByRole('textbox', { name: 'Nome' })).not.toBeNull()
    expect(screen.getByRole('textbox', { name: 'E-mail' })).not.toBeNull()

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    expect(handleSubmit).toHaveBeenCalledOnce()
  })

  it('shows validation and action errors while preserving the pending save state', () => {
    useInvitationCorrectionDialogMock.mockReturnValue(
      createFormState({
        formState: {
          errors: {
            email: { message: 'Informe um e-mail válido.', type: 'manual' },
            name: { message: 'Informe o nome completo.', type: 'manual' },
          },
        },
      }),
    )

    render(
      <InvitationCorrectionDialog
        {...createProps({ error: new Error('Convite já enviado.'), pending: true })}
      />,
    )

    expect(screen.getAllByRole('alert')[0]?.textContent).toContain(
      'Informe o nome completo.',
    )
    expect(screen.getAllByRole('alert')[1]?.textContent).toContain('Convite já enviado.')
    expect(
      screen.getByRole('textbox', { name: 'Nome' }).getAttribute('aria-invalid'),
    ).toBe('true')
    expect(
      screen.getByRole('textbox', { name: 'E-mail' }).getAttribute('aria-invalid'),
    ).toBe('true')
    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('closes when the Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<InvitationCorrectionDialog {...createProps({ onClose })} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes from the close control and the cancel action', () => {
    const onClose = vi.fn()
    render(<InvitationCorrectionDialog {...createProps({ onClose })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
