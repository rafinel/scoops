import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { TableCell, TableRow } from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type AccompanimentRowProps = {
  canManage: boolean
  formatQuantity: (value: number, unit: string) => string
  item: ProductAccompanimentDetails
  onEdit: (item: ProductAccompanimentDetails) => void
  onRemove: (item: ProductAccompanimentDetails) => void
}

export const AccompanimentRow = ({
  canManage,
  formatQuantity,
  item,
  onEdit,
  onRemove,
}: AccompanimentRowProps) => (
  <TableRow>
    <TableCell className='p-6 font-bold'>{item.accompanimentProductName}</TableCell>
    <TableCell>{item.accompanimentTypeName}</TableCell>
    <TableCell>
      {item.brandName ?? <span className='text-muted-foreground'>Indisponível</span>}
    </TableCell>
    <TableCell>{formatQuantity(item.quantityPerPortion, item.unit)}</TableCell>
    <TableCell>
      <span
        aria-label='Não disponível. O preço comercial é configurado por tamanho no PDV.'
        className='text-muted-foreground'
        role='img'
        title='O preço comercial é configurado por tamanho no PDV.'
      >
        Não disponível
      </span>
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
