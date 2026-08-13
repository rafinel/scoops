import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { LoginPage } from '..'

const { loginActionState, loginMock, navigateToPathMock } = vi.hoisted(() => ({
  loginActionState: {
    error: null as Error | null,
    isPending: false,
  },
  loginMock: vi.fn(),
  navigateToPathMock: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-login-action', () => ({
  useLoginAction: () => ({
    error: loginActionState.error,
    isPending: loginActionState.isPending,
    login: loginMock,
  }),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({
    navigateTo: vi.fn(),
    navigateToPath: navigateToPathMock,
  }),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={route} {...props}>
      {children}
    </a>
  ),
}))

describe('LoginPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders accessible credentials and navigates to the sanitized destination', async () => {
    loginMock.mockResolvedValue(undefined)

    render(<LoginPage returnTo='/app' />)

    expect(screen.getByRole('textbox', { name: 'E-mail' }).getAttribute('id')).toBe(
      'login-email',
    )
    expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('password')

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'manager@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'password' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar no Scoops' }))

    await vi.waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        identifier: 'manager@example.com',
        password: 'password',
      })
      expect(navigateToPathMock).toHaveBeenCalledWith('/app')
    })
  })

  it('shows validation and keeps submission disabled while pending', () => {
    loginActionState.isPending = true

    render(<LoginPage />)

    expect(
      (screen.getByRole('button', { name: 'Entrando…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    loginActionState.isPending = false
  })

  it('toggles password visibility from the eye button', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('Senha')
    const visibilityButton = screen.getByRole('button', { name: 'Mostrar senha' })

    expect(passwordInput.getAttribute('type')).toBe('password')
    fireEvent.click(visibilityButton)

    expect(passwordInput.getAttribute('type')).toBe('text')
    expect(
      screen.getByRole('button', { name: 'Ocultar senha' }).getAttribute('aria-pressed'),
    ).toBe('true')
  })
})
