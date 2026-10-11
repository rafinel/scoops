import { motion } from 'motion/react'
import { ShowcaseFeatures } from '../../features'
import { ShowcaseHeading } from '../../heading'
import { ShowcaseStage } from '../../stage'
import type { ShowcasePanelProps } from '..'
import type { useShowcasePanel } from '../use-showcase-panel'

export type ShowcasePanelViewProps = ShowcasePanelProps &
  Omit<ReturnType<typeof useShowcasePanel>, 'canStack'>

export const ShowcasePanelView = (props: ShowcasePanelViewProps) => {
  const titleId = `showcase-${props.panel.kind}-title`
  return (
    <>
      <div ref={props.anchorScope} aria-hidden='true' />
      <section
        ref={props.scope}
        inert={props.isCovered}
        aria-hidden={props.isCovered || undefined}
        data-covered={props.isCovered}
        aria-labelledby={titleId}
        className='showcase-position'
        style={{
          zIndex: props.index + 1,
          visibility: props.isCovered ? 'hidden' : 'visible',
        }}
      >
        <motion.div
          className={`showcase-panel showcase-${props.panel.kind}`}
          style={{
            opacity: props.opacity,
            scale: props.scale,
            rotateX: props.rotateX,
            rotateY: props.rotateY,
            transformOrigin: 'center top',
          }}
          onFocusCapture={props.handleFocus}
          onKeyDownCapture={props.handleKeyboardInteraction}
          onPointerDownCapture={props.handlePointerInteraction}
          onBlurCapture={props.handleBlur}
        >
          <div className='showcase-top'>
            <ShowcaseHeading panel={props.panel} titleId={titleId} />
            <ShowcaseStage
              panel={props.panel}
              controller={{
                activeIndex: props.activeIndex,
                isReducedMotion: props.isReducedMotion,
                previewScope: props.previewScope,
                previewScale: props.previewScale,
                previewHeight: props.previewHeight,
                isCompact: props.isCompact,
              }}
            />
          </div>
          <ShowcaseFeatures
            panel={props.panel}
            controller={{
              activeIndex: props.activeIndex,
              progress: props.progress,
              isPaused: props.isPaused,
              isReducedMotion: props.isReducedMotion,
              handleSelectFeature: props.handleSelectFeature,
              handleTogglePause: props.handleTogglePause,
            }}
          />
        </motion.div>
      </section>
    </>
  )
}
