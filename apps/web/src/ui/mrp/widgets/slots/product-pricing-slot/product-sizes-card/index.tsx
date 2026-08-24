import type { ProductSizePricing } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ProductSizesEmptyState } from './product-sizes-empty-state'
import { ProductSizesTable } from './product-sizes-table'

export type ProductSizesCardProps = {
  sizes: readonly ProductSizePricing[]
  unit: string
  onAdd: (target: HTMLElement) => void
  onEdit: (size: ProductSizePricing, target: HTMLElement) => void
  onRemove: (size: ProductSizePricing, target: HTMLElement) => void
}

export const ProductSizesCard = ({
  sizes,
  unit,
  onAdd,
  onEdit,
  onRemove,
}: ProductSizesCardProps) => (
  <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <h2 className='text-lg font-extrabold'>Tamanhos e preços</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {sizes.length}{' '}
          {sizes.length === 1 ? 'tamanho configurado' : 'tamanhos configurados'}
        </p>
      </div>
      {sizes.length > 0 ? (
        <Button
          className='w-full sm:w-auto'
          onClick={(event) => onAdd(event.currentTarget)}
        >
          <Icon name='plus' /> Adicionar tamanho
        </Button>
      ) : null}
    </div>
    <div className='mt-6'>
      {sizes.length === 0 ? (
        <ProductSizesEmptyState onAdd={onAdd} />
      ) : (
        <ProductSizesTable
          onEdit={onEdit}
          onRemove={onRemove}
          sizes={sizes}
          unit={unit}
        />
      )}
    </div>
  </section>
)
