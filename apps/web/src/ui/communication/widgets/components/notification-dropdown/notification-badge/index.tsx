import { Badge } from '@/ui/shadcn/badge'

export type NotificationBadgeProps = {
  count: number
}

export const NotificationBadge = ({ count }: NotificationBadgeProps) => (
  <Badge
    aria-hidden='true'
    className='absolute top-1 right-1 h-4 min-w-4 rounded-full bg-danger px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-card'
  >
    {count}
  </Badge>
)
