import { RouteTransitionStatusIndicator } from './route-transition-status-indicator'

const LOADING_LABEL = 'Carregando página…'
const ROUTE_TRANSITION_STATUS_PROPS = {
  'aria-busy': 'true',
  'aria-label': LOADING_LABEL,
  'aria-live': 'polite',
  className:
    'pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4 sm:inset-0 sm:items-center',
  role: 'status',
} as const

type RouteTransitionStatusContentProps = {
  isReducedMotion: boolean
}

export const RouteTransitionStatusContent = ({
  isReducedMotion,
}: RouteTransitionStatusContentProps) => {
  return (
    <div {...ROUTE_TRANSITION_STATUS_PROPS} data-route-transition-status>
      <div
        className='flex w-fit max-w-full flex-col items-center gap-2 rounded-xl border border-border bg-card px-5 py-4 text-center text-sm font-medium text-foreground shadow-lg'
        data-route-transition-card
      >
        <RouteTransitionStatusIndicator isReducedMotion={isReducedMotion} />
        <span>{LOADING_LABEL}</span>
      </div>
    </div>
  )
}
