import { cn } from '@/ui/shared/lib/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RemovalConsequenceProps = {
  consequence: string
  removeAll: boolean
}

export const RemovalConsequence = ({
  consequence,
  removeAll,
}: RemovalConsequenceProps) => (
  <div
    className={cn(
      'flex items-start gap-2.5 rounded-[10px] px-3.5 py-2.5 text-[13px] font-medium',
      removeAll ? 'bg-danger-soft text-danger' : 'bg-muted text-foreground',
    )}
    role='status'
  >
    <Icon
      className={cn(
        'mt-0.5 size-4 shrink-0',
        removeAll ? 'text-danger' : 'text-muted-foreground',
      )}
      name={removeAll ? 'triangle-alert' : 'info'}
    />
    <span>{consequence}</span>
  </div>
)
