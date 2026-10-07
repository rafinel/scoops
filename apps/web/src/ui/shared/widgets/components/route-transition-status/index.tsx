import { useRouteTransitionStatus } from './use-route-transition-status'
import { RouteTransitionStatusContent } from './route-transition-status-content'

export const RouteTransitionStatus = () => {
  const { isVisible } = useRouteTransitionStatus()

  if (!isVisible) return null

  return <RouteTransitionStatusContent />
}
