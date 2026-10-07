import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RouteTransitionStatus } from '../index'
import { useRouteTransitionStatus } from '../use-route-transition-status'

vi.mock('../use-route-transition-status', () => ({
  useRouteTransitionStatus: vi.fn(),
}))

const useRouteTransitionStatusMock = vi.mocked(useRouteTransitionStatus)

describe('RouteTransitionStatus', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders no status before the delayed threshold', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isVisible: false,
    })

    render(<RouteTransitionStatus />)

    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('renders an accessible progress bar at the top while navigating', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isVisible: true,
    })

    render(<RouteTransitionStatus />)

    const progressbar = screen.getByRole('progressbar', { name: 'Carregando página…' })
    expect(progressbar.getAttribute('aria-busy')).toBe('true')
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100')
    expect(progressbar.querySelector('[data-route-transition-indicator]')).not.toBeNull()
  })
})
