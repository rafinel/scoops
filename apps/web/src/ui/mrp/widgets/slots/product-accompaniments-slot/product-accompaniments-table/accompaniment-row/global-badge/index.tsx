import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'

export const GlobalBadge = () => (
  <Badge className='h-auto gap-1 bg-accent px-2 py-[3px] text-[11px] font-bold text-accent-foreground'>
    <Icon name='globe' />
    Global
  </Badge>
)
