import type { IconProps } from '../types'
import { ICONS } from './icons'

export const Icon = ({ name, className }: IconProps) => {
  const LucideIcon = ICONS[name]

  return <LucideIcon aria-hidden='true' className={className} />
}
