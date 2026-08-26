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
  const {
    details,
    handleActionOpenChange,
    handleActionSuccess,
    handleAddAction,
    handleBack,
    handleEditAction,
    handleRemoveAction,
    handleRetry,
    isError,
    isLoading,
    product,
    selectedAction,
  } = useProductAccompanimentsSlot(productId)
  return (
    <ProductDetailsPage
      onBack={handleBack}
      product={product}
      selectedTab='accompaniments'
    >
      {isLoading ? <ProductAccompanimentsLoading /> : null}
      {isError ? <ProductAccompanimentsError onRetry={handleRetry} /> : null}
      {details && !isLoading && !isError ? (
        details.accompaniments.length === 0 ? (
          <AccompanimentsEmptyState onAdd={handleAddAction} />
        ) : (
          <>
            <ProductAccompanimentsCard
              details={details}
              onAdd={handleAddAction}
              onEdit={handleEditAction}
              onRemove={handleRemoveAction}
            />
            {selectedAction?.kind === 'add' || selectedAction?.kind === 'edit' ? (
              <ProductAccompanimentDialog
                item={selectedAction.kind === 'edit' ? selectedAction.item : undefined}
                onOpenChange={handleActionOpenChange}
                onSuccess={handleActionSuccess}
                open
                productId={productId}
              />
            ) : null}
            {selectedAction?.kind === 'remove' ? (
              <RemoveProductAccompanimentDialog
                item={selectedAction.item}
                onOpenChange={handleActionOpenChange}
                onSuccess={handleActionSuccess}
                open
                productId={productId}
              />
            ) : null}
          </>
        )
      ) : null}
      {details &&
      details.accompaniments.length === 0 &&
      selectedAction?.kind === 'add' ? (
        <ProductAccompanimentDialog
          onOpenChange={handleActionOpenChange}
          onSuccess={handleActionSuccess}
          open
          productId={productId}
        />
      ) : null}
    </ProductDetailsPage>
  )
}
