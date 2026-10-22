import { Label } from '@/ui/shadcn/label'
import { Switch } from '@/ui/shadcn/switch'
import { cn } from '@/ui/shared/lib/utils'

export type RemovalScopeFieldProps = {
  helpText: string
  isDisabled: boolean
  isLocked?: boolean
  onRemoveAllChange: (checked: boolean) => void
  removeAll: boolean
}

export const RemovalScopeField = ({
  helpText,
  isDisabled,
  isLocked = false,
  onRemoveAllChange,
  removeAll,
}: RemovalScopeFieldProps) => (
  <Label
    className={cn(
      'items-start gap-3 rounded-[10px] border bg-card px-3.5 py-3 leading-normal',
      removeAll ? 'border-danger!' : 'border-border',
      isLocked && 'opacity-60',
    )}
  >
    <Switch
      aria-describedby='remove-global-scope-help'
      aria-labelledby='remove-global-scope-label'
      {...(isLocked ? { 'aria-disabled': true } : {})}
      checked={removeAll}
      className='mt-0.5'
      disabled={isDisabled && !isLocked}
      onCheckedChange={(checked) => onRemoveAllChange(checked)}
      readOnly={isLocked}
      tone='destructive'
    />
    <span className='grid gap-0.5'>
      <span className='text-sm font-bold text-foreground' id='remove-global-scope-label'>
        Remover de todas as porções
      </span>
      <span
        className='text-xs font-medium text-muted-foreground'
        id='remove-global-scope-help'
      >
        {helpText}
      </span>
    </span>
  </Label>
)
