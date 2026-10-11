import { animate, type AnimationScope, useInView } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePricingEnvironment } from '@/ui/identity/widgets/pages/landing-page/pricing-section/use-pricing-environment'

export function useConnectedFlow(scope: AnimationScope<HTMLElement>) {
  const { isReducedMotion, isDocumentVisible } = usePricingEnvironment()
  const isInView = useInView(scope, { amount: 0.3 })
  const [isDesktop, setIsDesktop] = useState(false)
  const animationsRef = useRef<ReturnType<typeof animate>[]>([])
  const canAnimate = isDesktop && isInView && isDocumentVisible && !isReducedMotion

  useLayoutEffect(() => {
    const desktop = matchMedia('(min-width: 1024px)')
    function handleViewportChange() {
      setIsDesktop(desktop.matches)
    }
    handleViewportChange()
    desktop.addEventListener('change', handleViewportChange)
    return () => desktop.removeEventListener('change', handleViewportChange)
  }, [])

  useEffect(() => {
    const pulses = scope.current?.querySelectorAll<HTMLElement>('[data-connected-pulse]')
    if (!pulses) return
    const animations = Array.from(pulses, (pulse, index) =>
      animate(
        pulse,
        { x: ['-100%', '250%'], opacity: [0, 1, 1, 0] },
        {
          duration: 1.6,
          delay: index * 1.8,
          repeat: Infinity,
          repeatDelay: 3.8,
          ease: 'linear',
        },
      ),
    )
    for (const animation of animations) animation.pause()
    animationsRef.current = animations
    return () => {
      for (const animation of animations) animation.stop()
      animationsRef.current = []
    }
  }, [scope])

  useEffect(() => {
    for (const animation of animationsRef.current) {
      if (canAnimate) animation.play()
      else animation.pause()
    }
  }, [canAnimate])
}
