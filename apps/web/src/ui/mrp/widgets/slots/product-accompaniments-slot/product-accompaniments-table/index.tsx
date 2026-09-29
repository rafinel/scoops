import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { AccompanimentRow } from './accompaniment-row'

export type ProductAccompanimentsTableProps = {
  canManage?: boolean
  items: readonly ProductAccompanimentDetails[]
  onEdit: (item: ProductAccompanimentDetails) => void
  onRemove: (item: ProductAccompanimentDetails) => void
}

export const ProductAccompanimentsTable = ({
  canManage = true,
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
            {[
              'ACOMPANHAMENTO',
              'TIPO',
              'MARCA',
              'QTD POR PORÇÃO',
              'PREÇO',
              ...(canManage ? ['AÇÕES'] : []),
            ].map((label) => (
              <TableHead
                className='px-6 py-3 text-xs font-semibold text-muted-foreground'
                key={label}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <AccompanimentRow
              canManage={canManage}
              formatQuantity={formatQuantity}
              item={item}
              key={item.id}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
