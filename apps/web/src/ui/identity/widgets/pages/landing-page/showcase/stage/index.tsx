import { motion } from 'motion/react'
import type { ShowcasePanelContent } from '../content'
import type { useShowcasePanel } from '../panel/use-showcase-panel'
import { LandingShowcasePreview } from '../preview'

export type ShowcaseStageProps = {
  panel: ShowcasePanelContent
  controller: Pick<
    ReturnType<typeof useShowcasePanel>,
    | 'activeIndex'
    | 'isReducedMotion'
    | 'previewScope'
    | 'previewHeight'
    | 'previewScale'
    | 'isCompact'
  >
}

export const ShowcaseStage = ({ panel, controller }: ShowcaseStageProps) => (
  <figure
    className='showcase-frame'
    aria-label={`Prévia ilustrativa: ${panel.features[controller.activeIndex].title}`}
  >
    <div
      ref={controller.previewScope}
      className='overflow-hidden rounded-xl bg-card'
      style={{ height: controller.isCompact ? 'auto' : controller.previewHeight }}
    >
      <motion.div
        aria-hidden='true'
        key={`${controller.activeIndex}-${controller.isReducedMotion}`}
        initial={false}
        animate={
          controller.isReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: [0, 1], y: [10, 0] }
        }
        transition={{ duration: controller.isReducedMotion ? 0 : 0.35 }}
        className='origin-top-left text-foreground'
        style={{ width: controller.isCompact ? '100%' : 960 }}
      >
        <div
          style={{
            width: controller.isCompact ? '100%' : 960,
            transform: controller.isCompact
              ? 'none'
              : `scale(${controller.previewScale})`,
            transformOrigin: 'top left',
          }}
        >
          <LandingShowcasePreview
            compact={controller.isCompact}
            kind={panel.kind}
            activeIndex={controller.activeIndex}
          />
        </div>
      </motion.div>
    </div>
  </figure>
)
