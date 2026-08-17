import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ROUTES } from '@/constants/routes'

import { UserMenu } from '..'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

describe('UserMenu', () => {
  it('shows the safe account fields and delegates current-device logout', () => {
    const onLogoutMock = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

    render(
      <UserMenu
        account={{
          id: 'account-id',
          establishmentId: 'establishment-id',
          establishmentName: 'Scoops',
          name: 'Operator Example',
          email: 'operator@example.com',
          profile: 'operator',
        }}
        error={null}
        isPending={false}
        onLogout={onLogoutMock}
      />,
    )

    fireEvent.click(screen.getByText('Operator Example'))

    expect(screen.getByText('Operador')).toBeDefined()
    expect(screen.getByText('operator@example.com')).toBeDefined()
    expect(
      screen.getByRole('menuitem', { name: 'Minha conta' }).getAttribute('href'),
    ).toBe(ROUTES.account)

    fireEvent.click(screen.getByRole('menuitem', { name: 'Sair deste dispositivo' }))

    expect(onLogoutMock).toHaveBeenCalledOnce()
  })

  it('disables logout while the current-device request is pending', () => {
    render(
      <UserMenu
        account={{
          id: 'account-id',
          establishmentId: 'establishment-id',
          establishmentName: 'Scoops',
          name: 'Manager Example',
          email: 'manager@example.com',
          profile: 'manager',
        }}
        error={null}
        isPending
        onLogout={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
      />,
    )

    fireEvent.click(screen.getByText('Manager Example'))

    expect(
      screen.getByRole('menuitem', { name: 'Saindo…' }).getAttribute('aria-disabled'),
    ).toBe('true')
  })
})
