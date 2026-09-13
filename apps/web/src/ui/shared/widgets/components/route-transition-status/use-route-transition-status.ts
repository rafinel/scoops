import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

const ROUTE_TRANSITION_DELAY = 300

export type RouteTransitionStatusState = {
  isReducedMotion: boolean
  isVisible: boolean
}

export function useRouteTransitionStatus(): RouteTransitionStatusState {
  const routerStatus = useRouterState({
    select: (state) => state.status,
  })
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsHydrated(true)

    if (typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    function handleChange() {
      setIsReducedMotion(mediaQuery.matches)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (routerStatus !== 'pending') {
      setIsVisible(false)
      return
    }

    const timeout = window.setTimeout(() => setIsVisible(true), ROUTE_TRANSITION_DELAY)
    return () => window.clearTimeout(timeout)
  }, [routerStatus])

  return {
    isReducedMotion,
    isVisible: isHydrated && isVisible,
  }
}

export { ROUTE_TRANSITION_DELAY }
