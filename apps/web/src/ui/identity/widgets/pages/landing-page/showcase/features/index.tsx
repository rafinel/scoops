import { motion } from 'motion/react'
import { Button } from '@/ui/shadcn/button'
import type { ShowcasePanelContent } from '../content'
import type { useShowcasePanel } from '../panel/use-showcase-panel'

export type ShowcaseFeaturesProps = {
  panel: ShowcasePanelContent
  controller: Pick<
    ReturnType<typeof useShowcasePanel>,
    | 'activeIndex'
    | 'progress'
    | 'isPaused'
    | 'isReducedMotion'
    | 'handleSelectFeature'
    | 'handleTogglePause'
  >
}

export const ShowcaseFeatures = ({ panel, controller }: ShowcaseFeaturesProps) => (
  <div className='showcase-bottom'>
    <div className='grid gap-5 md:grid-cols-3 md:gap-10'>
      {panel.features.map((feature, featureIndex) => (
        <Button
          key={feature.title}
          variant='ghost'
          aria-pressed={controller.activeIndex === featureIndex}
          onClick={() => controller.handleSelectFeature(featureIndex)}
          className='showcase-feature h-auto min-w-0 flex-col items-start gap-3 rounded-none px-0 pt-1 pb-7 text-left whitespace-normal'
        >
          <span className='text-base leading-tight font-semibold md:text-lg'>
            {feature.title}
          </span>
          <span className='text-sm leading-relaxed font-normal'>
            {feature.description}
          </span>
          <span aria-hidden='true' className='showcase-progress'>
            {controller.activeIndex === featureIndex && (
              <motion.span style={{ scaleX: controller.progress }} />
            )}
          </span>
        </Button>
      ))}
    </div>
    <div className='mt-5 flex justify-end'>
      <Button
        variant='ghost'
        size='sm'
        disabled={controller.isReducedMotion}
        onClick={controller.handleTogglePause}
        className='showcase-pause'
      >
        {controller.isReducedMotion
          ? 'Movimento reduzido'
          : controller.isPaused
            ? 'Retomar prévias'
            : 'Pausar prévias'}
      </Button>
    </div>
  </div>
)
