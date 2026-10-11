import { useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { type RefObject, useState } from 'react'
import { SHOWCASE_PANELS } from '../content'

export function useShowcaseStacking(
  anchorScope: RefObject<HTMLDivElement | null>,
  index: number,
  canStack: boolean,
) {
  const [isBehind, setIsBehind] = useState(false)
  const { scrollYProgress } = useScroll({
    target: anchorScope,
    offset: ['start start', 'start -1'],
  })
  const scale = useTransform(scrollYProgress, [0, 0.65, 1], [1, 1, 0.88])
  const rotateX = useTransform(scrollYProgress, [0, 0.65, 1], [0, 0, 7])
  const rotateY = useTransform(scrollYProgress, [0, 0.65, 1], [0, 0, -2])
  const opacity = useTransform(scrollYProgress, [0.65, 0.85], [1, 0])
  const hasNextPanel = index < SHOWCASE_PANELS.length - 1
  const isCovered = canStack && hasNextPanel && isBehind

  useMotionValueEvent(scrollYProgress, 'change', (value) => setIsBehind(value > 0.85))

  return {
    isCovered,
    opacity: canStack && hasNextPanel ? opacity : 1,
    scale: canStack ? scale : 1,
    rotateX: canStack ? rotateX : 0,
    rotateY: canStack ? rotateY : 0,
  }
}
