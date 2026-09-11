import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'
import { NotificationKind } from '@scoops/core/communication/domain/structures'

import { NotificationToast } from '../index'

describe('NotificationToast', () => {
  afterEach(cleanup)

  it('renders full accessible content, clamped copy and sibling actions', () => {
    const notification = NotificationFaker.fake({
      title: 'Título muito longo que deve permanecer anunciado por completo',
      message: 'Mensagem contextual longa que também deve ser anunciada por completo.',
    })
    render(
      <NotificationToast
        notification={notification}
        onDismiss={vi.fn()}
        onOpen={vi.fn()}
      />,
    )

    const toast = screen.getByRole('status', {
      name: `${notification.title}. ${notification.message}`,
    })
    expect(toast).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Abrir notificação' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Fechar notificação' })).not.toBeNull()
    expect(screen.getByText(notification.title).className).toContain('line-clamp-2')
    expect(screen.getByText(notification.message).className).toContain('line-clamp-3')
  })

  it('renders every supported notification kind through the shared presentation contract', () => {
    render(
      <div>
        {Object.values(NotificationKind).map((kind) => (
          <NotificationToast
            key={kind}
            notification={NotificationFaker.fake({ kind })}
            onDismiss={vi.fn()}
            onOpen={vi.fn()}
          />
        ))}
      </div>,
    )

    expect(screen.getAllByRole('status')).toHaveLength(
      Object.values(NotificationKind).length,
    )
  })
})
