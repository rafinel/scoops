import { useAnimate, type AnimationSequence } from 'motion/react'
import { useLayoutEffect, useRef } from 'react'

const ENTRANCE_SEQUENCE: AnimationSequence = [
  ['[data-landing-enter="navigation"]', { opacity: [0, 1], y: [-8, 0] }, { at: 0.1 }],
  ['[data-landing-enter="title"]', { opacity: [0, 1], y: [20, 0] }, { at: 0.35 }],
  ['[data-landing-enter="copy"]', { opacity: [0, 1], y: [14, 0] }, { at: 0.65 }],
  ['[data-landing-enter="actions"]', { opacity: [0, 1], y: [10, 0] }, { at: 0.95 }],
  [
    '[data-landing-enter="preview"]',
    {
      opacity: [0, 1],
      y: [28, 0],
      clipPath: ['inset(0 0 12% 0 round 12px)', 'inset(0 0 0% 0 round 12px)'],
    },
    { at: 1.25 },
  ],
]

export function useLandingPage() {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const entranceRef = useRef<ReturnType<typeof animate> | null>(null)

  useLayoutEffect(() => {
    if (!scope.current) return
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return
    const elements = scope.current.querySelectorAll<HTMLElement>('[data-landing-enter]')
    for (const element of elements) element.style.opacity = '0'
    const entrance = animate(ENTRANCE_SEQUENCE, {
      defaultTransition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    })
    entranceRef.current = entrance

    function handleMotionPreference() {
      if (reducedMotion.matches) entrance.complete()
    }

    reducedMotion.addEventListener('change', handleMotionPreference)
    return () => {
      reducedMotion.removeEventListener('change', handleMotionPreference)
      entrance.stop()
      for (const element of elements) element.style.removeProperty('opacity')
      entranceRef.current = null
    }
  }, [animate, scope])

  function handleEntranceComplete() {
    entranceRef.current?.complete()
  }

  return { scope, handleEntranceComplete }
}
