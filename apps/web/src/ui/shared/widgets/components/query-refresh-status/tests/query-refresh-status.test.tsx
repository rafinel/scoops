import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QueryRefreshStatus } from '../index'

describe('QueryRefreshStatus', () => {
  it('does not render while the owning query is idle', () => {
    render(<QueryRefreshStatus isRefreshing={false} />)

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders the localized polite status while refreshing', () => {
    render(<QueryRefreshStatus isRefreshing />)

    const status = screen.getByRole('status', { name: 'Atualizando…' })
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('accepts an owning-region label', () => {
    render(<QueryRefreshStatus isRefreshing label='Atualizando usuários…' />)

    expect(
      screen
        .getByRole('status', { name: 'Atualizando usuários…' })
        .getAttribute('aria-live'),
    ).toBe('polite')
  })
})
