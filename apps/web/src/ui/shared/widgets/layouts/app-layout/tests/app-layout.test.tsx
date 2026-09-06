import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { UserProfile } from '@scoops/core/identity/domain/structures'

import { getSidebarItems } from '@/constants/sidebar-items'
import { isSidebarItemActive } from '../index'

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/' }),
}))

vi.mock('../use-app-layout', () => ({
  useAppLayout: vi.fn(),
}))

vi.mock('../user-menu', () => ({
  UserMenu: () => null,
}))

vi.mock('@/ui/communication/widgets/components/notification-dropdown', () => ({
  NotificationDropdown: () => <button type='button'>Notificações</button>,
}))

import { AppLayout } from '../index'
import { useAppLayout } from '../use-app-layout'

const useAppLayoutMock = vi.mocked(useAppLayout)

describe('AppLayout sidebar profile configuration', () => {
  beforeEach(() => {
    useAppLayoutMock.mockReturnValue({
      account: null,
      error: null,
      handleLogout: vi.fn(),
      isPending: false,
      primaryItems: [],
      secondaryItems: [],
    })
  })

  it('keeps manager-only destinations out of the Operator navigation', () => {
    expect(
      getSidebarItems(UserProfile.Manager).some(
        (item) => item.route === 'accompanimentTypes',
      ),
    ).toBe(false)
    expect(
      getSidebarItems(UserProfile.Operator).some(
        (item) => item.route === 'accompanimentTypes',
      ),
    ).toBe(false)
    expect(
      getSidebarItems(UserProfile.Manager).some((item) => item.route === 'salesChannels'),
    ).toBe(true)
    expect(
      getSidebarItems(UserProfile.Operator).some(
        (item) => item.route === 'salesChannels',
      ),
    ).toBe(false)
    const products = getSidebarItems(UserProfile.Operator).find(
      (item) => item.route === 'products',
    )
    expect(products?.activePrefixes).toContain('/products/')
  })

  it('keeps active navigation accessible when routes include trailing slashes', () => {
    const managerItems = getSidebarItems(UserProfile.Manager)
    const products = managerItems.find((item) => item.route === 'products')

    expect(products && isSidebarItemActive('/products/portion-1/', products)).toBe(true)
    expect(products && isSidebarItemActive('/products-old/', products)).toBe(false)
  })

  it('keeps the notification dropdown in the authenticated header composition', () => {
    render(
      <AppLayout>
        <p>Conteúdo autenticado</p>
      </AppLayout>,
    )

    expect(screen.getByRole('button', { name: 'Notificações' })).not.toBeNull()
    expect(screen.getByText('Conteúdo autenticado')).not.toBeNull()
  })
})
