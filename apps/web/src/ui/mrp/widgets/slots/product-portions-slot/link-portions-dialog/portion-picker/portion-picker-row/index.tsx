import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import { Checkbox } from '@/ui/shadcn/checkbox'
import { Label } from '@/ui/shadcn/label'

import { PortionStatusBadge } from './portion-status-badge'
import { usePortionPickerRow } from './use-portion-picker-row'

export type PortionPickerRowProps = {
  candidate: AccompanimentPortionCandidate
  isSelected: boolean
  onToggle: (portionProductId: string, isSelected: boolean) => void
}

export const PortionPickerRow = (props: PortionPickerRowProps) => {
  const { isActive, nameId, statusId, handleCheckedChange, handleKeyDown } =
    usePortionPickerRow(props)

  return (
    <li className='border-b !border-[color:var(--border-soft)] last:border-b-0'>
      <Label className='flex min-h-[41px] cursor-pointer items-center gap-3 px-3.5 py-2'>
        <Checkbox
          aria-describedby={statusId}
          aria-labelledby={nameId}
          checked={props.isSelected}
          className='size-[18px] rounded-[5px]'
          onCheckedChange={handleCheckedChange}
          onKeyDown={handleKeyDown}
        />
        <span className='min-w-0 flex-1 truncate text-sm font-semibold' id={nameId}>
          {props.candidate.name}
        </span>
        <PortionStatusBadge id={statusId} isActive={isActive} />
      </Label>
    </li>
  )
}
