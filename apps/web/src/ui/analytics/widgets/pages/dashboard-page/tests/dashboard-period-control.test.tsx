import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DashboardPeriodControl } from '../dashboard-period-control'

describe('DashboardPeriodControl', () => {
  it('shows an accessible busy state while refreshing', () => {
    render(
      <DashboardPeriodControl
        period='last-30-days'
        onChange={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing
      />,
    )

    const refreshButton = screen.getByRole('button', { name: 'Atualizar' })

    expect(refreshButton.hasAttribute('disabled')).toBe(true)
    expect(refreshButton.getAttribute('aria-busy')).toBe('true')
    expect(
      refreshButton.querySelector('svg')?.classList.contains('motion-safe:animate-spin'),
    ).toBe(true)
  })
})
