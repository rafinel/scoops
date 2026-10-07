import { RouteTransitionStatusDotLottie } from './route-transition-status-dot-lottie'

export const RouteTransitionStatusArtwork = () => {
  return (
    <div aria-hidden='true' className='relative size-24'>
      <RouteTransitionStatusDotLottie />
      <img
        alt=''
        className='absolute inset-0 size-full animate-pulse'
        src='/assets/lotties/ice-cream-loading-illustration.svg'
      />
    </div>
  )
}
