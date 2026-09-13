import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RouteTransitionStatus } from '../index'
import { useRouteTransitionStatus } from '../use-route-transition-status'

vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: ({ autoplay, ...props }: Record<string, unknown>) => (
    <canvas
      data-testid='route-transition-artwork'
      data-autoplay={autoplay ? 'true' : 'false'}
      {...props}
    />
  ),
}))

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
    expect(screen.queryByTestId('route-transition-artwork')).toBeNull()
  })

  it('renders the looping artwork and accessible copy for motion-capable clients', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isReducedMotion: false,
      isVisible: true,
    })

    render(<RouteTransitionStatus />)

    expect(
      screen.getByRole('status', { name: 'Carregando página…' }).getAttribute('role'),
    ).toBe('status')
    const artwork = screen.getByTestId('route-transition-artwork')
    expect(artwork.getAttribute('src')).toBe('/assets/lotties/ice-cream-loading.lottie')
    expect(artwork.getAttribute('data-autoplay')).toBe('true')
    expect(artwork.getAttribute('loop')).toBe('')
    expect(screen.getByRole('status').className).toContain('pointer-events-none')
    expect(screen.getByRole('status').querySelectorAll('button,a,input')).toHaveLength(0)
  })

  it('renders static feedback without artwork for reduced-motion clients', () => {
    useRouteTransitionStatusMock.mockReturnValue({
      isReducedMotion: true,
      isVisible: true,
    })

    render(<RouteTransitionStatus />)

    expect(
      screen.getByRole('status', { name: 'Carregando página…' }).getAttribute('role'),
    ).toBe('status')
    expect(screen.getByText('Carregando página…').textContent).toBe('Carregando página…')
    expect(screen.queryByTestId('route-transition-artwork')).toBeNull()
  })
})
