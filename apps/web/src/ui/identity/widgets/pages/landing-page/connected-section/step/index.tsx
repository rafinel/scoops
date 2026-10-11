import { Icon } from '@/ui/shared/widgets/components/icon'
import type { IconName } from '@/ui/shared/widgets/components/icon/types/icon-name'

export type LandingConnectedStepProps = {
  title: string
  icon: IconName
  description: string
  position: number
}

export const LandingConnectedStep = ({
  title,
  icon,
  description,
  position,
}: LandingConnectedStepProps) => (
  <li className='landing-connected-step' data-connected-enter={position}>
    <div className='landing-connected-marker-row' aria-hidden='true'>
      <span className='landing-connected-icon-tile'>
        <Icon name={icon} />
      </span>
      {position < 3 && (
        <span className='landing-connected-flow-rail'>
          <span
            className='landing-connected-flow-pulse'
            data-connected-pulse={position}
          />
        </span>
      )}
      <Icon name='arrow' className='landing-connected-flow-arrow' />
    </div>
    <div className='landing-connected-step-copy'>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </li>
)
