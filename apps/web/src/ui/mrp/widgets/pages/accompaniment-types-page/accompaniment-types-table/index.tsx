import type { AccompanimentTypeListItem } from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type AccompanimentTypesTableProps = {
  items: readonly AccompanimentTypeListItem[]
  onEdit: (item: AccompanimentTypeListItem) => void
  onRemove: (item: AccompanimentTypeListItem) => void
}

export const AccompanimentTypesTable = ({
  items,
  onEdit,
  onRemove,
}: AccompanimentTypesTableProps) => (
  <section
    aria-label='Tabela de tipos de acompanhamento'
    className='overflow-x-auto rounded-xl p-6'
  >
    <Table className='min-w-[680px]'>
      <caption className='sr-only'>Tipos de acompanhamento cadastrados</caption>
      <TableHeader className='bg-muted [&_tr]:border-0'>
        <TableRow className='border-0 hover:bg-transparent'>
          <TableHead className='p-3 text-xs font-semibold text-muted-foreground'>
            Nome
          </TableHead>
          <TableHead className='text-xs font-semibold text-muted-foreground'>
            Uso
          </TableHead>
          <TableHead className='text-xs font-semibold text-muted-foreground'>
            Status
          </TableHead>
          <TableHead className='p-3 text-right text-xs font-semibold text-muted-foreground'>
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isUsed = item.usageCount > 0
          return (
            <TableRow key={item.type.id}>
              <TableCell className='flex items-center gap-2 p-4 font-bold'>
                <Icon name='tag' className='size-4 text-primary' />
                {item.type.name}
              </TableCell>
              <TableCell>
                {isUsed
                  ? `${item.usageCount} vínculo${item.usageCount === 1 ? '' : 's'}`
                  : 'Sem vínculos'}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    isUsed
                      ? 'bg-warning-soft text-warning-foreground'
                      : 'bg-success-soft text-success'
                  }
                  variant='secondary'
                >
                  <Icon name={isUsed ? 'lock' : 'check'} />
                  {isUsed ? 'Em uso' : 'Disponível'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className='flex justify-end gap-2'>
                  <Button
                    aria-label={`Editar ${item.type.name}`}
                    onClick={() => onEdit(item)}
                    size='sm'
                    variant='outline'
                  >
                    <Icon name='pencil' /> Editar
                  </Button>
                  <Button
                    aria-label={`Remover ${item.type.name}`}
                    className={
                      isUsed
                        ? 'border-border bg-muted text-destructive hover:bg-muted hover:text-destructive disabled:opacity-50'
                        : 'border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive'
                    }
                    disabled={isUsed}
                    onClick={() => onRemove(item)}
                    size='sm'
                    variant='outline'
                  >
                    <Icon name='trash-2' /> Remover
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </section>
)
