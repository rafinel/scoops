import { motion } from 'motion/react'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { TeamProfile } from '../content'

export type LandingTeamCardProps = {
  profile: TeamProfile
  position: number
  isSelected: boolean
  isReducedMotion: boolean
  onSelect: (id: TeamProfile['id']) => void
  onHover: (id: TeamProfile['id']) => void
}

export const LandingTeamCard = ({
  profile,
  position,
  isSelected,
  isReducedMotion,
  onSelect,
  onHover,
}: LandingTeamCardProps) => (
  <div
    className='landing-team-card-position'
    data-position={position}
    data-selected={isSelected}
  >
    <motion.div
      initial={false}
      animate={
        isReducedMotion
          ? { rotate: 0, y: 0 }
          : {
              rotate: isSelected ? (position - 1) * 8 : (position - 1) * 18,
              y: isSelected ? -24 : 12,
            }
      }
      transition={{ duration: isReducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      className='landing-team-card-motion'
    >
      <Button
        variant='ghost'
        className='landing-team-card'
        aria-label={`Explorar ${profile.name}`}
        aria-pressed={isSelected}
        aria-controls='landing-team-detail'
        onPointerEnter={() => onHover(profile.id)}
        onFocus={() => onSelect(profile.id)}
        onClick={() => onSelect(profile.id)}
      >
        <span className='landing-team-card-face'>
          <Icon name={profile.icon} className='landing-team-card-icon' />
          <span className='landing-team-card-name'>{profile.name}</span>
        </span>
        <span className='landing-team-card-tag'>{profile.tag}</span>
      </Button>
    </motion.div>
  </div>
)
