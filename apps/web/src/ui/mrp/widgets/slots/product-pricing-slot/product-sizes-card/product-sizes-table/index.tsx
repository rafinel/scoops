import type { ProductSizePricing } from '@scoops/core/mrp/domain/structures'

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { ProductSizeRow } from './product-size-row'

export type ProductSizesTableProps = {
  canManage?: boolean
  sizes: readonly ProductSizePricing[]
  unit: string
  onEdit: (size: ProductSizePricing, target: HTMLElement) => void
  onRemove: (size: ProductSizePricing, target: HTMLElement) => void
}

export const ProductSizesTable = ({
  canManage = true,
  sizes,
  unit,
  onEdit,
  onRemove,
}: ProductSizesTableProps) => {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()

  return (
    <div className='overflow-x-auto rounded-xl border border-border-soft'>
      <Table className='min-w-[760px]'>
        <TableHeader>
          <TableRow className='bg-muted/70 hover:bg-muted/70'>
            <TableHead className='px-6 py-3'>Nome</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Custo atual</TableHead>
            <TableHead>Lucro</TableHead>
            <TableHead>Margem</TableHead>
            <TableHead>Status</TableHead>
            {canManage ? (
              <TableHead className='text-right px-6 py-3'>Ações</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sizes.map((pricing) => (
            <ProductSizeRow
              canManage={canManage}
              formatCurrency={formatCurrency}
              formatQuantity={formatQuantity}
              key={pricing.size.id}
              onEdit={onEdit}
              onRemove={onRemove}
              pricing={pricing}
              unit={unit}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
