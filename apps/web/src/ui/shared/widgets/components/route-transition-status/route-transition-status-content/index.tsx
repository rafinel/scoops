const LOADING_LABEL = 'Carregando página…'
const ROUTE_TRANSITION_STATUS_PROPS = {
  'aria-busy': 'true',
  'aria-label': LOADING_LABEL,
  'aria-valuemax': 100,
  'aria-valuemin': 0,
  className: 'pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]',
  role: 'progressbar',
} as const

export const RouteTransitionStatusContent = () => {
  return (
    <div {...ROUTE_TRANSITION_STATUS_PROPS} data-route-transition-status>
      <div className='h-full origin-left bg-primary' data-route-transition-indicator />
    </div>
  )
}
