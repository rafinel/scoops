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
      isReducedMotion: false,
      isVisible: false,
    })

    render(<RouteTransitionStatus />)

    expect(screen.queryByRole('status')).toBeNull()
    expect(document.querySelector('[data-route-transition-indicator]')).toBeNull()
  })

  it('renders an accessible top progress indicator during navigation', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isReducedMotion: false,
      isVisible: true,
    })

    render(<RouteTransitionStatus />)

    const status = screen.getByRole('status', { name: 'Carregando página…' })
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(status.querySelector('[data-route-transition-indicator]')).not.toBeNull()
    expect(status.querySelectorAll('button,a,input')).toHaveLength(0)
  })

  it('renders a static top progress indicator for reduced-motion clients', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isReducedMotion: true,
      isVisible: true,
    })

    render(<RouteTransitionStatus />)

    expect(
      screen.getByRole('status', { name: 'Carregando página…' }).getAttribute('role'),
    ).toBe('status')
    expect(screen.getByText('Carregando página…').textContent).toBe('Carregando página…')
    const indicator = document.querySelector<HTMLElement>(
      '[data-route-transition-indicator]',
    )
    expect(indicator?.style.transform).toBe('scaleX(0.84)')
  })
})
