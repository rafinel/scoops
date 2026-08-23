import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'

import { ProductAccompanimentsCard } from './product-accompaniments-card'
import { AccompanimentsEmptyState } from './accompaniments-empty-state'
import { ProductAccompanimentsError } from './product-accompaniments-error'
import { ProductAccompanimentsLoading } from './product-accompaniments-loading'
import { ProductAccompanimentDialog } from './product-accompaniment-dialog'
import { RemoveProductAccompanimentDialog } from './remove-product-accompaniment-dialog'
import { useProductAccompanimentsSlot } from './use-product-accompaniments-slot'

export type ProductAccompanimentsSlotProps = {
  productId: string
}

export const ProductAccompanimentsSlot = ({
  productId,
}: ProductAccompanimentsSlotProps) => {
  const slot = useProductAccompanimentsSlot(productId)
  return (
    <ProductDetailsPage
      onBack={slot.handleBack}
      product={slot.product}
      selectedTab='accompaniments'
    >
      {slot.isLoading ? <ProductAccompanimentsLoading /> : null}
      {slot.isError ? <ProductAccompanimentsError onRetry={slot.handleRetry} /> : null}
      {slot.details && !slot.isLoading && !slot.isError ? (
        slot.details.accompaniments.length === 0 ? (
          <AccompanimentsEmptyState
            onAdd={() => slot.setSelectedAction({ kind: 'add' })}
          />
        ) : (
          <>
            <ProductAccompanimentsCard
              details={slot.details}
              onAdd={() => slot.setSelectedAction({ kind: 'add' })}
              onEdit={(item) => slot.setSelectedAction({ kind: 'edit', item })}
              onRemove={(item) => slot.setSelectedAction({ kind: 'remove', item })}
            />
            {slot.selectedAction?.kind === 'add' ||
            slot.selectedAction?.kind === 'edit' ? (
              <ProductAccompanimentDialog
                item={
                  slot.selectedAction.kind === 'edit'
                    ? slot.selectedAction.item
                    : undefined
                }
                onOpenChange={slot.handleActionOpenChange}
                onSuccess={slot.handleActionSuccess}
                open
                productId={productId}
              />
            ) : null}
            {slot.selectedAction?.kind === 'remove' ? (
              <RemoveProductAccompanimentDialog
                item={slot.selectedAction.item}
                onOpenChange={slot.handleActionOpenChange}
                onSuccess={slot.handleActionSuccess}
                open
                productId={productId}
              />
            ) : null}
          </>
        )
      ) : null}
      {slot.details &&
      slot.details.accompaniments.length === 0 &&
      slot.selectedAction?.kind === 'add' ? (
        <ProductAccompanimentDialog
          onOpenChange={slot.handleActionOpenChange}
          onSuccess={slot.handleActionSuccess}
          open
          productId={productId}
        />
      ) : null}
    </ProductDetailsPage>
  )
}
