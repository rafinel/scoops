import { useInView } from 'motion/react'
import { useRef } from 'react'
import { useShowcaseEnvironment } from './use-showcase-environment'
import { useShowcasePreviewSize } from './use-showcase-preview-size'
import { useShowcaseRotation } from './use-showcase-rotation'
import { useShowcaseStacking } from './use-showcase-stacking'

export function useShowcasePanel(index: number) {
  const scope = useRef<HTMLElement>(null)
  const anchorScope = useRef<HTMLDivElement>(null)
  const { isReducedMotion, canStack, isDocumentVisible } = useShowcaseEnvironment()
  const preview = useShowcasePreviewSize()
  const isInView = useInView(scope, { amount: 0.4 })
  const stacking = useShowcaseStacking(anchorScope, index, canStack)
  const rotation = useShowcaseRotation(
    isInView && !stacking.isCovered && isDocumentVisible && !isReducedMotion,
  )
  return {
    scope,
    anchorScope,
    ...preview,
    ...rotation,
    ...stacking,
    isReducedMotion,
  }
}
