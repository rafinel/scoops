import { cn } from '@/ui/shared/lib/utils'

import { getAvatarColor, getAvatarInitials } from './avatar-color'

export type AvatarProps = {
  name: string
  className?: string
}

export const Avatar = ({ name, className }: AvatarProps) => {
  const { backgroundClass, foregroundClass } = getAvatarColor(name)

  return (
    <span
      aria-hidden='true'
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-black',
        backgroundClass,
        foregroundClass,
        className,
      )}
    >
      {getAvatarInitials(name)}
    </span>
  )
}
