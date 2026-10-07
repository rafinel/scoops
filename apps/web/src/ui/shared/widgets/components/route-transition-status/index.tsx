import { useRouteTransitionStatus } from './use-route-transition-status'
import { RouteTransitionStatusContent } from './route-transition-status-content'

export const RouteTransitionStatus = () => {
  const { isReducedMotion, isVisible } = useRouteTransitionStatus()

  if (!isVisible) return null

  return <RouteTransitionStatusContent isReducedMotion={isReducedMotion} />
}
