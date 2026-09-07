import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'

vi.mock('../use-notification-list', () => ({
  useNotificationList: vi.fn(),
}))

import { NotificationList } from '../index'
import { useNotificationList } from '../use-notification-list'

const useNotificationListMock = vi.mocked(useNotificationList)

describe('NotificationList', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationListMock.mockReturnValue({
      dateGroups: [
        {
          key: '2026-01-01',
          label: 'HOJE',
          notifications: [
            NotificationFaker.fake({
              id: 'notification-today',
              title: 'Estoque abaixo do ideal',
            }),
          ],
        },
        {
          key: '2025-12-31',
          label: '31 DE DEZEMBRO DE 2025',
          notifications: [
            NotificationFaker.fake({
              id: 'notification-yesterday',
              title: 'Usuário inativado',
              occurredAt: new Date('2025-12-31T12:00:00.000Z'),
            }),
          ],
        },
      ],
      isMarkingRead: false,
      listRef: { current: null },
    })
  })

  it('renders ordered local-day sections as semantic notification lists', () => {
    render(<NotificationList isObservationEnabled notifications={[]} />)

    expect(screen.getByRole('heading', { name: 'HOJE' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: '31 DE DEZEMBRO DE 2025' })).not.toBeNull()
    expect(screen.getByRole('list', { name: 'Notificações de hoje' })).not.toBeNull()
    expect(screen.getByText('Estoque abaixo do ideal')).not.toBeNull()
    expect(screen.getByText('Usuário inativado')).not.toBeNull()
  })

  it('can omit date headings for the compact dropdown presentation', () => {
    render(
      <NotificationList
        isObservationEnabled
        notifications={[]}
        showDateHeadings={false}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'HOJE' })).toBeNull()
    expect(screen.queryByRole('heading', { name: '31 DE DEZEMBRO DE 2025' })).toBeNull()
    expect(screen.getByRole('list', { name: 'Notificações' })).not.toBeNull()
  })
})
