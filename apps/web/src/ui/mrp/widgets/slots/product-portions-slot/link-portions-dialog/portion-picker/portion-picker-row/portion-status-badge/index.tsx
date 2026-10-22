import { Badge } from '@/ui/shadcn/badge'
import { cn } from '@/ui/shared/lib/utils'

export type PortionStatusBadgeProps = {
  id: string
  isActive: boolean
}

export const PortionStatusBadge = ({ id, isActive }: PortionStatusBadgeProps) => (
  <Badge
    className={cn(
      'h-auto px-2.5 py-[3px] text-[11px] font-semibold',
      isActive
        ? 'bg-success-soft text-success'
        : 'border-border bg-muted text-muted-foreground',
    )}
    id={id}
    variant={isActive ? 'default' : 'outline'}
  >
    {isActive ? 'Ativo' : 'Inativo'}
  </Badge>
)
