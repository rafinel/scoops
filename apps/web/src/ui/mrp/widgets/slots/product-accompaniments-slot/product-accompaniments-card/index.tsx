import type {
  ProductAccompanimentDetails,
  ProductAccompanimentsDetails,
} from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ProductAccompanimentsTable } from '../product-accompaniments-table'

export type ProductAccompanimentsCardProps = {
  details: ProductAccompanimentsDetails
  onAdd: () => void
  onEdit: (item: ProductAccompanimentDetails) => void
  onRemove: (item: ProductAccompanimentDetails) => void
}

export const ProductAccompanimentsCard = ({
  details,
  onAdd,
  onEdit,
  onRemove,
}: ProductAccompanimentsCardProps) => (
  <Card className='overflow-hidden rounded-2xl shadow-card'>
    <CardHeader className='flex flex-col gap-3 border-b border-border-soft px-5 py-5 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <h2 className='text-lg font-extrabold'>
          Acompanhamentos{' '}
          <span className='text-sm font-semibold text-muted-foreground'>
            ({details.accompaniments.length})
          </span>
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Itens oferecidos junto a este produto no PDV.
        </p>
      </div>
      <Button className='min-h-10 shadow-primary' onClick={onAdd} type='button'>
        <Icon name='plus' /> Vincular acompanhamento
      </Button>
    </CardHeader>
    <CardContent className='p-0'>
      <ProductAccompanimentsTable
        items={details.accompaniments}
        onEdit={onEdit}
        onRemove={onRemove}
      />
    </CardContent>
  </Card>
)
