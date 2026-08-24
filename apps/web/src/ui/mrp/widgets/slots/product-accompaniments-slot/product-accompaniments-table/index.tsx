import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductAccompanimentsTableProps = {
  items: readonly ProductAccompanimentDetails[]
  onEdit: (item: ProductAccompanimentDetails) => void
  onRemove: (item: ProductAccompanimentDetails) => void
}

export const ProductAccompanimentsTable = ({
  items,
  onEdit,
  onRemove,
}: ProductAccompanimentsTableProps) => {
  const formatQuantity = useFormatQuantity()

  return (
    <section
      aria-label='Tabela de acompanhamentos'
      className='overflow-x-auto rounded-xl p-6'
    >
      <Table className='min-w-[780px]'>
        <TableCaption className='sr-only'>Acompanhamentos vinculados</TableCaption>
        <TableHeader className='bg-muted [&_tr]:border-0'>
          <TableRow className='border-1 hover:bg-transparent'>
            {['ACOMPANHAMENTO', 'TIPO', 'MARCA', 'QTD POR PORÇÃO', 'PREÇO', 'AÇÕES'].map(
              (label) => (
                <TableHead
                  className='px-6 py-3 text-xs font-semibold text-muted-foreground'
                  key={label}
                >
                  {label}
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className='p-6 font-bold'>
                {item.accompanimentProductName}
              </TableCell>
              <TableCell>{item.accompanimentTypeName}</TableCell>
              <TableCell>
                {item.brandName ?? (
                  <span className='text-muted-foreground'>Indisponível</span>
                )}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
