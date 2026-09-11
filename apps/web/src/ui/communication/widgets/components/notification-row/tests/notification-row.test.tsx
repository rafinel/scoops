import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'
import { NotificationKind } from '@scoops/core/communication/domain/structures'

import { NOTIFICATION_PRESENTATION } from '@/ui/communication/constants'

import { NotificationRow } from '../index'

describe('NotificationRow', () => {
  afterEach(cleanup)

  it('renders every scoped notification kind without exposing technical values', () => {
    const kinds = Object.values(NotificationKind)

    render(
      <ul>
        {kinds.map((kind, index) => (
          <NotificationRow
            key={kind}
            notification={NotificationFaker.fake({
              id: `notification-${index}`,
              kind,
              title: `Título ${kind}`,
              message: `Mensagem ${kind}`,
            })}
          />
        ))}
      </ul>,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(kinds.length)
    expect(screen.getByText('Mensagem stock-zero')).not.toBeNull()
    expect(screen.queryByText('billing')).toBeNull()
  })

  it('marks unread rows semantically and preserves read rows without a marker', () => {
    render(
      <ul>
        <NotificationRow
          notification={NotificationFaker.fake({
            id: 'unread-notification',
            title: 'Estoque zerado',
            readAt: undefined,
          })}
        />
        <NotificationRow
          notification={NotificationFaker.fake({
            id: 'read-notification',
            title: 'Usuário reativado',
            readAt: new Date('2026-01-01T00:05:00.000Z'),
          })}
        />
      </ul>,
    )

    expect(screen.getAllByRole('status', { name: 'Não lida' })).toHaveLength(1)
    expect(screen.getByText('Estoque zerado').className).toContain('font-extrabold')
    expect(screen.getByText('Usuário reativado').className).toContain('font-semibold')
  })

  it('uses the shared danger presentation for zero-stock notifications', () => {
    const kind = NotificationKind.StockZero
    const presentation = NOTIFICATION_PRESENTATION[kind]

    render(
      <ul>
        <NotificationRow notification={NotificationFaker.fake({ kind })} />
      </ul>,
    )

    const row = screen.getByRole('listitem')
    const iconContainer = row.querySelector('span[aria-hidden="true"]')
    const icon = iconContainer?.querySelector('svg')

    expect(iconContainer?.className).toContain(presentation.iconContainerClassName)
    expect(icon?.getAttribute('class')).toContain(presentation.iconClassName)
  })
})
