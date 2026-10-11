import type { ShowcasePanelContent } from '../content'

export type ShowcaseHeadingProps = { panel: ShowcasePanelContent; titleId: string }

export const ShowcaseHeading = ({ panel, titleId }: ShowcaseHeadingProps) => (
  <div className='relative z-10 mx-auto max-w-3xl text-center'>
    <h2
      id={titleId}
      className='text-3xl leading-tight font-medium tracking-tight md:text-5xl lg:text-6xl'
    >
      {panel.title}
    </h2>
    <p className='mx-auto mt-5 max-w-xl text-sm leading-relaxed opacity-90 md:text-base'>
      {panel.description}
    </p>
  </div>
)
