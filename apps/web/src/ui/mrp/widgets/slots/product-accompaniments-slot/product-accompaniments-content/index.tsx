import type { ProductAccompanimentsDetails } from '@scoops/core/mrp/domain/structures'
import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { AccompanimentsEmptyState } from '../accompaniments-empty-state'
import { ProductAccompanimentsCard } from '../product-accompaniments-card'

export type ProductAccompanimentsContentProps = {
  canManage: boolean
  details: ProductAccompanimentsDetails
  onAdd: () => void
  onEdit: (item: ProductAccompanimentDetails) => void
  onRemove: (item: ProductAccompanimentDetails) => void
}

export const ProductAccompanimentsContent = ({
  canManage,
  details,
  onAdd,
  onEdit,
  onRemove,
}: ProductAccompanimentsContentProps) => {
  if (details.accompaniments.length === 0) {
    return canManage ? (
      <AccompanimentsEmptyState onAdd={onAdd} />
    ) : (
      <section
        className='rounded-2xl border border-dashed p-12 text-center'
        role='status'
      >
        <h2 className='text-lg font-extrabold'>Nenhum acompanhamento vinculado</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Os acompanhamentos deste produto aparecerão aqui.
        </p>
      </section>
    )
  }

  return (
    <ProductAccompanimentsCard
      canManage={canManage}
      details={details}
      onAdd={onAdd}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  )
}
