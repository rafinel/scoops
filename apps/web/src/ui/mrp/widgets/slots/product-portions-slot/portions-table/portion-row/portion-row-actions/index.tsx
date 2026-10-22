import type { AccompanimentPortionDetails } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { TableCell } from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PortionRowActionsProps = {
  inactiveNoticeId: string
  isActive: boolean
  item: AccompanimentPortionDetails
  onEdit: (item: AccompanimentPortionDetails) => void
  onRemove: (item: AccompanimentPortionDetails) => void
}

const REMOVE_CLASS =
  'h-7 gap-1 rounded-[6px] !border-destructive/40 px-2.5 text-xs leading-4 font-semibold !text-destructive hover:!bg-destructive/5 hover:!text-destructive'

export const PortionRowActions = ({
  inactiveNoticeId,
  isActive,
  item,
  onEdit,
  onRemove,
}: PortionRowActionsProps) => (
  <TableCell className='px-5 py-3'>
    <div className='flex gap-2'>
      {item.isGlobal ? null : (
        <Button
          aria-describedby={isActive ? undefined : inactiveNoticeId}
          aria-label={`Editar ${item.portionProductName}`}
          className='h-7 gap-1 rounded-[6px] px-2.5 text-xs leading-4 font-semibold text-muted-foreground'
          disabled={!isActive}
          onClick={() => onEdit(item)}
          type='button'
          variant='outline'
        >
          <Icon className='size-3' name='pencil' /> Editar
        </Button>
      )}
      <Button
        aria-label={
          item.isGlobal
            ? `Remover ${item.accompanimentProductName} desta porção: ${item.portionProductName}`
            : `Remover ${item.portionProductName}`
        }
        className={REMOVE_CLASS}
        onClick={() => onRemove(item)}
        type='button'
        variant='outline'
      >
        <Icon className='size-3' name='trash-2' />{' '}
        {item.isGlobal ? 'Remover desta porção' : 'Remover'}
      </Button>
    </div>
  </TableCell>
)
