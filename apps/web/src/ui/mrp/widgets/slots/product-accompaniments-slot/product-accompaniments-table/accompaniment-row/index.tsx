import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { GlobalBadge } from '@/ui/mrp/widgets/components/global-badge'
import { Button } from '@/ui/shadcn/button'
import { TableCell, TableRow } from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type AccompanimentRowProps = {
  canManage: boolean
  formatCurrency: (value: number) => string
  formatQuantity: (value: number, unit: string) => string
  item: ProductAccompanimentDetails
  onEdit: (item: ProductAccompanimentDetails) => void
  onRemove: (item: ProductAccompanimentDetails) => void
}

export const AccompanimentRow = ({
  canManage,
  formatCurrency,
  formatQuantity,
  item,
  onEdit,
  onRemove,
}: AccompanimentRowProps) => (
  <TableRow>
    <TableCell className='px-6 py-4 font-bold'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <span>{item.accompanimentProductName}</span>
        {item.isGlobal ? <GlobalBadge /> : null}
      </div>
    </TableCell>
    <TableCell>{item.accompanimentTypeName}</TableCell>
    <TableCell>
      {item.brandName ?? <span className='text-muted-foreground'>Indisponível</span>}
    </TableCell>
    <TableCell>{formatQuantity(item.quantityPerPortion, item.unit)}</TableCell>
    <TableCell>
      {item.salePrice === null ? (
        <span className='text-muted-foreground'>Não configurado</span>
      ) : item.salePrice === 0 ? (
        <span>Grátis</span>
      ) : (
        formatCurrency(item.salePrice)
      )}
    </TableCell>
    {canManage ? (
      <TableCell>
        <div className='flex gap-2'>
          <Button
            aria-label={`Editar ${item.accompanimentProductName}`}
            onClick={() => onEdit(item)}
            size='sm'
            variant='outline'
          >
            <Icon name='pencil' /> Editar
          </Button>
          <Button
            aria-label={`Remover ${item.accompanimentProductName}`}
            className='!border-destructive/40 !text-destructive hover:!bg-destructive/5 hover:!text-destructive'
            onClick={() => onRemove(item)}
            size='sm'
            variant='outline'
          >
            <Icon name='trash-2' /> Remover
          </Button>
        </div>
      </TableCell>
    ) : null}
  </TableRow>
)
