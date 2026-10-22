import { Label } from '@/ui/shadcn/label'
import { Switch } from '@/ui/shadcn/switch'

import { GlobalFieldText } from './global-field-text'
import { GlobalReplacementNotice } from '../global-replacement-notice'
import { type UseGlobalFieldProps, useGlobalField } from './use-global-field'

export type AccompanimentGlobalFieldProps = UseGlobalFieldProps & {
  isGlobal: boolean
}

export const AccompanimentGlobalField = (props: AccompanimentGlobalFieldProps) => {
  const {
    describedBy,
    handleCheckedChange,
    helpId,
    helpText,
    labelId,
    replacementNoticeId,
  } = useGlobalField(props)

  return (
    <div className='grid gap-3'>
      <Label className='items-start gap-3 rounded-[10px] border border-border bg-card px-3.5 py-3 leading-normal'>
        <Switch
          aria-describedby={describedBy}
          aria-labelledby={labelId}
          checked={props.isGlobal}
          className='mt-0.5'
          onCheckedChange={handleCheckedChange}
        />
        <GlobalFieldText helpId={helpId} helpText={helpText} labelId={labelId} />
      </Label>
      <GlobalReplacementNotice
        id={replacementNoticeId}
        isVisible={props.shouldShowReplacementNotice}
        wording='portion-side'
      />
    </div>
  )
}
