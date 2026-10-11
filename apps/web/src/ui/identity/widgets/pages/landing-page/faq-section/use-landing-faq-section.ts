import { useAnimate, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { usePricingEnvironment } from '@/ui/identity/widgets/pages/landing-page/pricing-section/use-pricing-environment'
import type { LandingFaqQuestion } from './content'

export function useLandingFaqSection() {
  const [scope, animate] = useAnimate<HTMLElement>()
  const [activeId, setActiveId] = useState<LandingFaqQuestion['id']>('trial')
  const { isReducedMotion, isDocumentVisible } = usePricingEnvironment()
  const isInView = useInView(scope, { amount: 0.15 })
  const animationRef = useRef<ReturnType<typeof animate> | null>(null)
  const hasFinishedRef = useRef(false)
  const canAnimate = isInView && isDocumentVisible && !isReducedMotion

  useEffect(() => {
    const animation = animate(
      '[data-faq-arc]',
      {
        rotate: [-24, 10, 0],
        scale: [0.96, 1.01, 1],
        opacity: [0.35, 1, 0.85],
      },
      {
        duration: 4,
        ease: [0.16, 1, 0.3, 1],
        onComplete: () => {
          hasFinishedRef.current = true
        },
      },
    )
    animation.pause()
    animationRef.current = animation
    hasFinishedRef.current = false
    return () => {
      animation.stop()
      animationRef.current = null
    }
  }, [animate])

  useEffect(() => {
    if (isReducedMotion) animationRef.current?.complete()
    else if (canAnimate && !hasFinishedRef.current) animationRef.current?.play()
    else animationRef.current?.pause()
  }, [canAnimate, isReducedMotion])

  function handleSelectQuestion(id: LandingFaqQuestion['id']) {
    setActiveId(id)
  }

  return { scope, activeId, isReducedMotion, canAnimate, handleSelectQuestion }
}
