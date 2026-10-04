import { useRouteTransitionStatus } from './use-route-transition-status'

const LOADING_LABEL = 'Carregando página…'
export const RouteTransitionStatus = () => {
  const { isReducedMotion, isVisible } = useRouteTransitionStatus()

  if (!isVisible) return null

  return (
    <div
      aria-busy='true'
      aria-label={LOADING_LABEL}
      aria-live='polite'
      className='pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]'
      data-route-transition-status
      role='status'
    >
      <span className='sr-only'>{LOADING_LABEL}</span>
      <span
        aria-hidden='true'
        className='block h-full origin-left bg-primary'
        data-route-transition-indicator
        style={
          isReducedMotion
            ? { transform: 'scaleX(0.84)' }
            : {
                animation:
                  'route-transition-progress 640ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
              }
        }
      />
    </div>
  )
}
