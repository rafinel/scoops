import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { AuthenticatedHomePage } from '..'

const { accountState } = vi.hoisted(() => ({
  accountState: {
    account: null as {
      id: string
      establishmentId: string
      name: string
      email: string
      profile: 'manager' | 'operator'
    } | null,
  },
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => accountState,
}))

describe('AuthenticatedHomePage', () => {
  afterEach(() => {
    cleanup()
    accountState.account = null
  })

  it('renders the authenticated account summary for a manager', () => {
    accountState.account = {
      id: 'account-id',
      establishmentId: 'establishment-id',
      name: 'Ana Manager',
      email: 'ana@example.com',
      profile: 'manager',
    }

    render(<AuthenticatedHomePage />)

    expect(screen.getByRole('heading', { name: 'Bem-vindo, Ana Manager' })).toBeDefined()
    expect(screen.getByText('ana@example.com')).toBeDefined()
    expect(screen.getByText('Manager')).toBeDefined()
  })

  it('maps non-manager profiles to the operator label', () => {
    accountState.account = {
      id: 'account-id',
      establishmentId: 'establishment-id',
      name: 'Operator Example',
      email: 'operator@example.com',
      profile: 'operator',
    }

    render(<AuthenticatedHomePage />)

    expect(screen.getByText('Operator')).toBeDefined()
  })
})
