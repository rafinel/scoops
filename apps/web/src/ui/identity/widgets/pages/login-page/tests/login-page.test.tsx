import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { LoginPage } from '..'

import { useLoginPage } from '../use-login-page'

vi.mock('../use-login-page', () => ({
  useLoginPage: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route: _route, ...props }: AnchorProps) => (
    <a {...props}>{children}</a>
  ),
}))

const useLoginPageMock = vi.mocked(useLoginPage)
const handleSubmitMock = vi.fn()
const handleTogglePasswordVisibilityMock = vi.fn()

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLoginPageMock.mockReturnValue(fakeLoginPage())
  })

  afterEach(cleanup)

  it('renders accessible credentials and delegates form submission', () => {
    render(<LoginPage returnTo='/' />)

    expect(screen.getByRole('textbox', { name: 'E-mail' }).getAttribute('id')).toBe(
      'login-email',
    )
    expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('password')

    const form = screen.getByRole('button', { name: 'Entrar no Scoops' }).closest('form')
    if (!form) throw new Error('Missing login form')
    fireEvent.submit(form)

    expect(handleSubmitMock).toHaveBeenCalledOnce()
  })

  it('maps the pending state to the submit control', () => {
    useLoginPageMock.mockReturnValue(fakeLoginPage({ isPending: true }))
    render(<LoginPage />)

    expect(
      (screen.getByRole('button', { name: 'Entrando…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('maps password visibility and delegates toggling', () => {
    useLoginPageMock.mockReturnValue(fakeLoginPage({ isPasswordVisible: true }))
    render(<LoginPage />)

    expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('text')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))

    expect(handleTogglePasswordVisibilityMock).toHaveBeenCalledOnce()
  })

  it('maps the neutral authentication error', () => {
    useLoginPageMock.mockReturnValue(fakeLoginPage({ error: new Error('rejected') }))
    render(<LoginPage />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível entrar. Confira seus dados e tente novamente.',
    )
  })
})

function fakeLoginPage(
  overrides: Partial<ReturnType<typeof useLoginPage>> = {},
): ReturnType<typeof useLoginPage> {
  return {
    error: null,
    isPasswordVisible: false,
    isPending: false,
    validationError: null,
    handleSubmit: handleSubmitMock,
    handleTogglePasswordVisibility: handleTogglePasswordVisibilityMock,
    register: vi.fn(() => ({})) as never,
    ...overrides,
  }
}
