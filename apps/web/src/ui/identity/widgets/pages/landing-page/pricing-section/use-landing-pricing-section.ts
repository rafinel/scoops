import { useAnimate, useInView } from 'motion/react'
import { useEffect, useRef } from 'react'
import { usePricingEnvironment } from './use-pricing-environment'
import { usePricingEntrance } from './use-pricing-entrance'

export function useLandingPricingSection() {
  const [scope, animate] = useAnimate<HTMLElement>()
  usePricingEntrance(scope)
  const isInView = useInView(scope, { amount: 0.15 })
  const { isReducedMotion, isDocumentVisible } = usePricingEnvironment()
  const animationsRef = useRef<ReturnType<typeof animate>[]>([])
  const canAnimate = isInView && isDocumentVisible && !isReducedMotion

  useEffect(() => {
    const animations = [
      animate(
        '[data-pricing-light="first"]',
        {
          x: [0, -420, 180, 0],
          y: [0, 150, -100, 0],
          scale: [1, 1.3, 0.8, 1],
          opacity: [0.5, 1, 0.4, 0.5],
        },
        { duration: 7, repeat: Infinity, ease: 'easeInOut' },
      ),
      animate(
        '[data-pricing-light="second"]',
        {
          x: [0, 320, -300, 0],
          y: [0, -180, 120, 0],
          scale: [1, 0.75, 1.25, 1],
          opacity: [1, 0.35, 1, 1],
        },
        { duration: 9, repeat: Infinity, ease: 'easeInOut' },
      ),
    ]
    for (const animation of animations) animation.pause()
    animationsRef.current = animations
    return () => {
      for (const animation of animations) animation.stop()
      animationsRef.current = []
    }
  }, [animate])

  useEffect(() => {
    for (const animation of animationsRef.current) {
      if (canAnimate) animation.play()
      else animation.pause()
    }
  }, [canAnimate])

  return { scope, isReducedMotion, canAnimate }
}
