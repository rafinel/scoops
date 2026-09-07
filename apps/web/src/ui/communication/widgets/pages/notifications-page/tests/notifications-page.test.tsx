import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'
import { ROUTES } from '@/constants/routes'
import type { BackLinkProps } from '@/ui/shared/widgets/components/back-link'

vi.mock('../use-notifications-page', () => ({
  useNotificationsPage: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/back-link', () => ({
  BackLink: ({ children = 'Voltar', route = 'products', ...props }: BackLinkProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../../../components/notification-list/use-notification-list', () => ({
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

import { NotificationsPage } from '../index'
import { useNotificationsPage } from '../use-notifications-page'

const useNotificationsPageMock = vi.mocked(useNotificationsPage)

const basePageState = {
  hasHistory: true,
  hasLoadedNotifications: true,
  hasNextPage: true,
  bounds: {},
  isLoadingNextNotifications: false,
  isLoadingNotifications: false,
  isNextNotificationsError: false,
  notifications: [
    NotificationFaker.fake({
      id: 'notification-1',
      title: 'Estoque zerado',
      message: 'Granola está sem estoque disponível.',
    }),
  ],
  notificationsError: null,
  period: 'last-30-days' as const,
  handleBack: vi.fn(),
  handleLoadMore: vi.fn(),
  handlePeriodChange: vi.fn(),
  handleResetPeriod: vi.fn(),
  handleRetry: vi.fn(),
}

describe('NotificationsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationsPageMock.mockReturnValue(basePageState)
  })

  it('renders the design hierarchy, period control, grouped content, and load-more action', () => {
    render(<NotificationsPage />)

    fireEvent.click(screen.getByRole('link', { name: 'Voltar para página anterior' }))
    expect(basePageState.handleBack).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Notificações' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Todas as notificações' })).not.toBeNull()
    expect(
      screen.getByRole('combobox', { name: 'Filtrar por período' }).textContent,
    ).toContain('Últimos 30 dias')
    expect(screen.getByText('Estoque zerado')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais' }))
    expect(basePageState.handleLoadMore).toHaveBeenCalledTimes(1)
  })

  it('keeps filtered empty, initial error, and next-page recovery states visible', () => {
    useNotificationsPageMock.mockReturnValueOnce({
      ...basePageState,
      hasLoadedNotifications: true,
      hasNextPage: false,
      hasHistory: true,
      notifications: [],
      period: 'last-7-days',
    })
    const { rerender } = render(<NotificationsPage />)
    expect(screen.getByText('Nenhuma notificação neste período')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ver últimos 30 dias' }))
    expect(basePageState.handleResetPeriod).toHaveBeenCalledTimes(1)

    useNotificationsPageMock.mockReturnValueOnce({
      ...basePageState,
      hasHistory: false,
      hasLoadedNotifications: true,
      hasNextPage: false,
      notifications: [],
      period: 'all',
    })
    rerender(<NotificationsPage />)
    expect(screen.getByText('Nenhuma notificação ainda')).not.toBeNull()

    useNotificationsPageMock.mockReturnValueOnce({
      ...basePageState,
      hasLoadedNotifications: false,
      hasNextPage: false,
      notifications: [],
      notificationsError: new Error('unavailable'),
    })
    rerender(<NotificationsPage />)
    expect(screen.getByRole('alert')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(basePageState.handleRetry).toHaveBeenCalledTimes(1)

    useNotificationsPageMock.mockReturnValueOnce({
      ...basePageState,
      hasNextPage: false,
      isNextNotificationsError: true,
    })
    rerender(<NotificationsPage />)
    expect(
      screen.getByText('Não foi possível carregar mais notificações.'),
    ).not.toBeNull()
  })
})
