import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

const ROUTE_TRANSITION_DELAY = 300

export type RouteTransitionStatusState = {
  isVisible: boolean
}

export function useRouteTransitionStatus(): RouteTransitionStatusState {
  const routerStatus = useRouterState({
    select: (state) => state.status,
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
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
    isVisible: isHydrated && isVisible,
  }
}

export { ROUTE_TRANSITION_DELAY }
