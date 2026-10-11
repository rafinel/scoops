import { SHOWCASE_PANELS } from './content'
import { ShowcasePanel } from './panel'
import './showcase.css'

export const LandingShowcase = () => (
  <div className='showcase-stack'>
    {SHOWCASE_PANELS.map((panel, index) => (
      <ShowcasePanel key={panel.kind} panel={panel} index={index} />
    ))}
  </div>
)
