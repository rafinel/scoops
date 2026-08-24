import type { ProductSizePricing } from '@scoops/core/mrp/domain/structures'

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
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductSizesTableProps = {
  sizes: readonly ProductSizePricing[]
  unit: string
  onEdit: (size: ProductSizePricing, target: HTMLElement) => void
  onRemove: (size: ProductSizePricing, target: HTMLElement) => void
}

export const ProductSizesTable = ({
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
            <TableHead className='text-right px-6 py-3'>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sizes.map((pricing) => (
            <TableRow key={pricing.size.id}>
              <TableCell className='font-bold p-6'>{pricing.size.name}</TableCell>
              <TableCell>{formatQuantity(pricing.size.quantity, unit)}</TableCell>
              <TableCell className='font-bold'>
                {formatCurrency(pricing.size.price)}
              </TableCell>
              <TableCell
                aria-label={
                  pricing.operatingCost === undefined ? 'Indisponível' : undefined
                }
              >
                {pricing.operatingCost === undefined
                  ? '—'
                  : formatCurrency(pricing.operatingCost)}
              </TableCell>
              <TableCell
                aria-label={pricing.profit === undefined ? 'Indisponível' : undefined}
              >
                {pricing.profit === undefined ? '—' : formatCurrency(pricing.profit)}
              </TableCell>
              <TableCell
                aria-label={
                  pricing.marginPercentage === undefined ? 'Indisponível' : undefined
                }
              >
                {pricing.marginPercentage === undefined
                  ? '—'
                  : `${pricing.marginPercentage.toFixed(1).replace('.', ',')}%`}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    pricing.size.isActive
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-border bg-muted text-muted-foreground'
                  }
                  variant='outline'
                >
                  {pricing.size.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className='flex justify-end gap-2'>
                  <Button
                    aria-label={`Editar ${pricing.size.name}`}
                    onClick={(event) => onEdit(pricing, event.currentTarget)}
                    size='sm'
                    variant='outline'
                  >
                    <Icon name='pencil' /> Editar
                  </Button>
                  <Button
                    aria-label={`Remover ${pricing.size.name}`}
                    className='border-red-300 text-red-700 hover:bg-red-50'
                    onClick={(event) => onRemove(pricing, event.currentTarget)}
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
    </div>
  )
}
