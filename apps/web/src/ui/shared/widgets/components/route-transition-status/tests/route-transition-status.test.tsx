import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RouteTransitionStatus } from '../index'
import { useRouteTransitionStatus } from '../use-route-transition-status'

vi.mock('../use-route-transition-status', () => ({
  useRouteTransitionStatus: vi.fn(),
}))

vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: (props: Record<string, unknown>) => <canvas {...props} />,
  setWasmUrl: vi.fn(),
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
    expect(document.querySelector('[data-route-transition-artwork]')).toBeNull()
  })

  it('renders accessible delayed feedback with looping artwork during navigation', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isReducedMotion: false,
      isVisible: true,
    })

    render(<RouteTransitionStatus />)

    const status = screen.getByRole('status', { name: 'Carregando página…' })
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(
      status.querySelector('[data-route-transition-artwork]')?.getAttribute('width'),
    ).toBe('96')
    expect(status.querySelector('[data-route-transition-card]')?.textContent).toContain(
      'Carregando página…',
    )
    expect(status.querySelectorAll('button,a,input')).toHaveLength(0)
  })

  it('renders static delayed feedback without artwork for reduced-motion clients', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isReducedMotion: true,
      isVisible: true,
    })

    render(<RouteTransitionStatus />)

    const status = screen.getByRole('status', { name: 'Carregando página…' })
    expect(status.getAttribute('role')).toBe('status')
    expect(screen.getByText('Carregando página…').textContent).toBe('Carregando página…')
    expect(status.querySelector('[data-route-transition-artwork]')).toBeNull()
    expect(status.querySelector('[data-route-transition-card]')).not.toBeNull()
  })
})
