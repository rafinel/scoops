import { Label } from '@/ui/shadcn/label'
import { Switch } from '@/ui/shadcn/switch'
import { cn } from '@/ui/shared/lib/utils'

import { GlobalReplacementNotice } from '../global-replacement-notice'
import { type UseGlobalFieldProps, useGlobalField } from './use-global-field'

export type GlobalFieldProps = UseGlobalFieldProps & {
  isGlobal: boolean
}

export const GlobalField = ({
  handleGlobalChange,
  isGlobal,
  isLocked,
  shouldShowReplacementNotice,
}: GlobalFieldProps) => {
  const {
    describedBy,
    handleCheckedChange,
    helpId,
    helpText,
    labelId,
    replacementNoticeId,
  } = useGlobalField({ handleGlobalChange, isLocked, shouldShowReplacementNotice })

  return (
    <div className='grid gap-3'>
      <Label
        className={cn(
          'items-start gap-3 rounded-[10px] border border-border bg-card px-3.5 py-3 leading-normal',
          isLocked && 'opacity-60',
        )}
      >
        <Switch
          aria-describedby={describedBy}
          aria-disabled={isLocked || undefined}
          aria-labelledby={labelId}
          checked={isGlobal}
          className='mt-0.5'
          onCheckedChange={handleCheckedChange}
          readOnly={isLocked}
        />
        <span className='grid gap-0.5'>
          <span className='text-sm font-bold text-foreground' id={labelId}>
            Disponível para todas as porções
          </span>
          <span className='text-xs font-medium text-muted-foreground' id={helpId}>
            {helpText}
          </span>
        </span>
      </Label>
      <GlobalReplacementNotice
        id={replacementNoticeId}
        isVisible={shouldShowReplacementNotice}
      />
    </div>
  )
}
