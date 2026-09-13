import { DotLottieReact } from '@lottiefiles/dotlottie-react'

import { useRouteTransitionStatus } from './use-route-transition-status'

const LOADING_LABEL = 'Carregando página…'
const LOADING_ASSET = '/assets/lotties/ice-cream-loading.lottie'

export const RouteTransitionStatus = () => {
  const { isReducedMotion, isVisible } = useRouteTransitionStatus()

  if (!isVisible) return null

  return (
    <div
      aria-busy='true'
      aria-label={LOADING_LABEL}
      aria-live='polite'
      className='pointer-events-none fixed inset-0 z-50 grid items-end justify-items-center pb-6 sm:place-items-center sm:pb-0'
      data-route-transition-status
      role='status'
    >
      <div
        className='flex flex-col items-center gap-3 rounded-2xl bg-card/95 px-6 py-5 text-sm font-extrabold text-foreground shadow-card'
        data-route-transition-card
      >
        {isReducedMotion ? null : (
          <DotLottieReact
            aria-hidden='true'
            autoplay
            data-route-transition-artwork
            loop
            src={LOADING_ASSET}
            style={{ height: 96, width: 96 }}
          />
        )}
        <span>{LOADING_LABEL}</span>
      </div>
    </div>
  )
}
