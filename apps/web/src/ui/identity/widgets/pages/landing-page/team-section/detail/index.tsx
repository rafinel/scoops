import { Icon } from '@/ui/shared/widgets/components/icon'
import type { TeamProfile } from '../content'

export type LandingTeamDetailProps = { profile: TeamProfile }

export const LandingTeamDetail = ({ profile }: LandingTeamDetailProps) => (
  <div id='landing-team-detail' className='landing-team-detail'>
    <h3>{profile.title}</h3>
    <p>{profile.description}</p>
    {profile.id === 'history' && (
      <div className='landing-team-history'>
        <Icon name='user-check' className='size-5 shrink-0' />
        <div>
          <p>Marina promoveu Lucas a Gerente</p>
          <p>Operador → Gerente · Hoje, 10:42</p>
          <span>Exemplo ilustrativo</span>
        </div>
      </div>
    )}
  </div>
)
