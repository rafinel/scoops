import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { UserMenuProps } from '../types/user-menu-props'
import { useUserMenu } from '../use-user-menu'

function createProps(profile: 'manager' | 'operator'): UserMenuProps {
  return {
    account: {
      id: 'account-id',
      establishmentId: 'establishment-id',
      establishmentName: 'Scoops',
      name: 'Example User',
      email: 'example@scoops.test',
      profile,
    },
    error: null,
    isPending: false,
    onLogout: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
}

describe('useUserMenu', () => {
  it('maps each profile to its visible label', () => {
    const manager = renderHook(() => useUserMenu(createProps('manager')))
    const operator = renderHook(() => useUserMenu(createProps('operator')))

    expect(manager.result.current.profileLabel).toBe('Gerente')
    expect(operator.result.current.profileLabel).toBe('Operador')
  })

  it('delegates logout through its public handler', () => {
    const props = createProps('operator')
    const { result } = renderHook(() => useUserMenu(props))

    act(() => result.current.handleLogout())

    expect(props.onLogout).toHaveBeenCalledOnce()
  })
})
