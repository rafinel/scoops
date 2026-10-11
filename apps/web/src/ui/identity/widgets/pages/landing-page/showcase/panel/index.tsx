import { ShowcasePanelView } from './view'
import { useShowcasePanel } from './use-showcase-panel'
import type { ShowcasePanelContent } from '../content'

export type ShowcasePanelProps = { panel: ShowcasePanelContent; index: number }

export const ShowcasePanel = ({ panel, index }: ShowcasePanelProps) => {
  const {
    scope,
    anchorScope,
    isCovered,
    opacity,
    scale,
    rotateX,
    rotateY,
    activeIndex,
    progress,
    isPaused,
    isReducedMotion,
    previewScope,
    previewScale,
    previewHeight,
    isCompact,
    handleFocus,
    handleKeyboardInteraction,
    handlePointerInteraction,
    handleBlur,
    handleSelectFeature,
    handleTogglePause,
  } = useShowcasePanel(index)
  return (
    <ShowcasePanelView
      {...{
        panel,
        index,
        scope,
        anchorScope,
        isCovered,
        opacity,
        scale,
        rotateX,
        rotateY,
        activeIndex,
        progress,
        isPaused,
        isReducedMotion,
        previewScope,
        previewScale,
        previewHeight,
        isCompact,
        handleFocus,
        handleKeyboardInteraction,
        handlePointerInteraction,
        handleBlur,
        handleSelectFeature,
        handleTogglePause,
      }}
    />
  )
}
