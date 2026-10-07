import { RouteTransitionStatusArtwork } from './route-transition-status-artwork'

type RouteTransitionStatusIndicatorProps = {
  isReducedMotion: boolean
}

export const RouteTransitionStatusIndicator = ({
  isReducedMotion,
}: RouteTransitionStatusIndicatorProps) => {
  if (isReducedMotion) return null

  return <RouteTransitionStatusArtwork />
}
