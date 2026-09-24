import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { UserProfile } from '@scoops/core/identity/domain/structures'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import type { NotificationDropdownProps } from '@/ui/communication/widgets/components/notification-dropdown'
import { getSidebarItems } from '@/constants/sidebar-items'
import { ROUTES } from '@/constants/routes'
import { isSidebarItemActive } from '../index'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/ui/shared/hooks/use-url-pathname', () => ({
  useUrlPathname: vi.fn(),
}))

vi.mock('../use-app-layout', () => ({
  useAppLayout: vi.fn(),
}))

vi.mock('@/ui/communication/widgets/components/notification-dropdown', () => ({
  NotificationDropdown: (_props: NotificationDropdownProps) => (
    <button type='button'>Notificações</button>
  ),
}))

vi.mock(
  '@/ui/communication/contexts/notification-shell-context/use-notification-shell-provider',
  () => ({
    useNotificationShellProvider: vi.fn(),
  }),
)

vi.mock('@/ui/communication/hooks/use-notification-realtime', () => ({
  useNotificationRealtime: vi.fn(),
}))

import { AppLayout } from '../index'
import { useAppLayout } from '../use-app-layout'
import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { useNotificationShellProvider } from '@/ui/communication/contexts/notification-shell-context/use-notification-shell-provider'

const useAppLayoutMock = vi.mocked(useAppLayout)
const useUrlPathnameMock = vi.mocked(useUrlPathname)
const useNotificationShellProviderMock = vi.mocked(useNotificationShellProvider)

describe('AppLayout', () => {
  beforeEach(() => {
    useUrlPathnameMock.mockReturnValue({ pathname: '/' })
    useAppLayoutMock.mockReturnValue({
      account: null,
      error: null,
      handleLogout: vi.fn(),
      handleMobileSidebarNavigate: vi.fn(),
      handleMobileSidebarOpenChange: vi.fn(),
      isPending: false,
      isMobileSidebarOpen: false,
      primaryItems: [],
      secondaryItems: [],
    })
    useNotificationShellProviderMock.mockReturnValue({
      account: null,
      clearSelectedNotification: vi.fn(),
      closeNotifications: vi.fn(),
      dismissNotification: vi.fn(),
      isEligible: false,
      isLeader: false,
      isNotificationsOpen: false,
      notificationChannel: null,
      onNotification: vi.fn(),
      openNotification: vi.fn(),
      openNotifications: vi.fn(),
      queuedNotifications: [],
      selectedNotification: null,
      visibleNotifications: [],
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
      getSidebarItems(UserProfile.Manager).some((item) => item.route === 'app'),
    ).toBe(true)
    expect(
      getSidebarItems(UserProfile.Operator).some((item) => item.route === 'app'),
    ).toBe(false)
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

  it('marks exact and nested routes active and normalizes trailing slashes', () => {
    const managerItems = getSidebarItems(UserProfile.Manager)
    const products = managerItems.find((item) => item.route === 'products')
    const home = managerItems.find((item) => item.route === 'app')

    expect(products && isSidebarItemActive('/products/portion-1/', products)).toBe(true)
    expect(products && isSidebarItemActive('/products-old/', products)).toBe(false)
    expect(home && isSidebarItemActive('/', home)).toBe(true)
    expect(home && isSidebarItemActive('/nested', home)).toBe(false)
  })

  it('exposes the current route through accessible navigation state', () => {
    const managerItems = getSidebarItems(UserProfile.Manager)
    useUrlPathnameMock.mockReturnValue({ pathname: '/products/portion-1/' })
    useAppLayoutMock.mockReturnValue({
      account: null,
      error: null,
      handleLogout: vi.fn(),
      handleMobileSidebarNavigate: vi.fn(),
      handleMobileSidebarOpenChange: vi.fn(),
      isPending: false,
      isMobileSidebarOpen: false,
      primaryItems: managerItems,
      secondaryItems: [],
    })

    render(<AppLayout />)

    const productsLinks = screen.getAllByRole('link', { name: 'Produtos' })
    expect(
      productsLinks.some((link) => link.getAttribute('aria-current') === 'page'),
    ).toBe(true)
  })

  it('keeps the notification dropdown in the authenticated header composition', () => {
    render(
      <AppLayout>
        <p>Conteúdo autenticado</p>
      </AppLayout>,
    )

    expect(screen.getAllByRole('button', { name: 'Notificações' })).not.toHaveLength(0)
    expect(screen.getByText('Conteúdo autenticado')).not.toBeNull()
  })
})
