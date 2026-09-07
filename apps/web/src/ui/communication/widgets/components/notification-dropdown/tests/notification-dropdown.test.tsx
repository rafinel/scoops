import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ROUTES } from '@/constants/routes'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../use-notification-dropdown', () => ({
  useNotificationDropdown: vi.fn(),
}))

vi.mock('../../notification-list/use-notification-list', () => ({
  useNotificationList: vi.fn(({ notifications }) => ({
    dateGroups: [
      {
        key: 'today',
        label: 'HOJE',
        notifications,
      },
    ],
    isMarkingRead: false,
    listRef: { current: null },
  })),
}))

import { NotificationDropdown } from '../index'
import { useNotificationDropdown } from '../use-notification-dropdown'

const useNotificationDropdownMock = vi.mocked(useNotificationDropdown)

describe('NotificationDropdown', () => {
  afterEach(cleanup)

  const createDropdownState = () => ({
    handleClose: vi.fn(),
    handleOpenAll: vi.fn(),
    handleToggle: vi.fn(),
    isLoadingRecentNotifications: false,
    isOpen: true,
    panelRef: createRef<HTMLDivElement>(),
    recentNotifications: [
      NotificationFaker.fake({
        id: 'notification-1',
        title: 'Estoque abaixo do ideal',
        message: 'Morango está com 1.200 g disponíveis.',
      }),
    ],
    recentNotificationsError: null,
    refetchRecentNotifications: vi.fn(),
    triggerRef: createRef<HTMLButtonElement>(),
    unreadCount: 1,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationDropdownMock.mockReturnValue(createDropdownState() as never)
  })

  it('renders the unread indicator, populated row, close action, and footer navigation', () => {
    render(<NotificationDropdown />)

    expect(
      screen
        .getByRole('button', { name: 'Notificações, 1 não lidas' })
        .getAttribute('aria-expanded'),
    ).toBe('true')
    expect(screen.getByRole('dialog', { name: 'Notificações' })).not.toBeNull()
    expect(screen.queryByRole('heading', { name: 'HOJE' })).toBeNull()
    expect(screen.getByText('Estoque abaixo do ideal')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Fechar notificações' })).not.toBeNull()
    expect(
      screen
        .getByRole('link', { name: 'Ver todas as notificações' })
        .getAttribute('href'),
    ).toBe(ROUTES.notifications)
  })

  it('exposes loading, empty, and retryable error states without hiding dismissal controls', () => {
    useNotificationDropdownMock.mockReturnValueOnce({
      ...createDropdownState(),
      isLoadingRecentNotifications: true,
      recentNotifications: [],
      recentNotificationsError: null,
    } as never)
    const { rerender } = render(<NotificationDropdown />)
    expect(screen.getByRole('status', { name: 'Carregando notificações' })).not.toBeNull()

    useNotificationDropdownMock.mockReturnValueOnce({
      ...createDropdownState(),
      isLoadingRecentNotifications: false,
      recentNotifications: [],
      recentNotificationsError: null,
    } as never)
    rerender(<NotificationDropdown />)
    expect(screen.getByText('Nenhuma notificação ainda')).not.toBeNull()

    const errorState = createDropdownState()
    useNotificationDropdownMock.mockReturnValueOnce({
      ...errorState,
      isLoadingRecentNotifications: false,
      recentNotifications: [],
      recentNotificationsError: new Error('unavailable'),
    } as never)
    rerender(<NotificationDropdown />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(errorState.refetchRecentNotifications).toBeDefined()
    expect(screen.getByRole('button', { name: 'Fechar notificações' })).not.toBeNull()
  })
})
