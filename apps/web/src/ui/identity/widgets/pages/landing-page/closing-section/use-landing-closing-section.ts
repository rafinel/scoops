import { useAnimate, useInView, useScroll } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useClosingEnvironment } from './use-closing-environment'

export function useLandingClosingSection() {
  const [scope, animate] = useAnimate<HTMLElement>()
  const { isReducedMotion, isDocumentVisible, canHighlight } = useClosingEnvironment()
  const isInView = useInView(scope, { amount: 0.1 })
  const { scrollYProgress } = useScroll({
    target: scope,
    offset: ['start 0.95', 'center center'],
  })
  const animationsRef = useRef<ReturnType<typeof animate>[]>([])
  const canAnimate = isInView && isDocumentVisible && canHighlight

  useEffect(() => {
    const animations = [0, 1, 2].map((groupIndex) =>
      animate(
        `[data-closing-star-layer="${groupIndex}"]`,
        {
          x: [0, groupIndex % 2 === 0 ? 8 : -8, 0],
          y: [0, -12 - groupIndex * 4, 0],
          opacity: [0.45, 0.8, 0.45],
        },
        { duration: 8 + groupIndex * 2, repeat: Infinity, ease: 'easeInOut' },
      ),
    )
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

  return { scope, scrollYProgress, canHighlight, isReducedMotion, canAnimate }
}
