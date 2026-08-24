import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'

import { ProductPricingError } from './product-pricing-error'
import { ProductPricingLoading } from './product-pricing-loading'
import { ProductResaleSettingsCard } from './product-resale-settings-card'
import { ProductSizeDialog } from './product-size-dialog'
import { ProductSizesCard } from './product-sizes-card'
import { RemoveProductSizeDialog } from './remove-product-size-dialog'
import { useProductPricingSlot } from './use-product-pricing-slot'

export type ProductPricingSlotProps = {
  productId: string
}

export const ProductPricingSlot = ({ productId }: ProductPricingSlotProps) => {
  const {
    handleActionOpenChange,
    handleActionSuccess,
    handleAdd,
    handleBack,
    handleEdit,
    handleRemove,
    handleRetry,
    pricingError,
    isLoadingPricing,
    pricing,
    selectedAction,
  } = useProductPricingSlot(productId)

  return (
    <ProductDetailsPage
      onBack={handleBack}
      product={pricing?.product}
      selectedTab='prices'
    >
      {isLoadingPricing ? <ProductPricingLoading /> : null}
      {pricingError ? <ProductPricingError onRetry={handleRetry} /> : null}
      {pricing && !isLoadingPricing && !pricingError ? (
        <>
          {pricing.mode === 'portion' ? (
            <ProductSizesCard
              onAdd={handleAdd}
              onEdit={handleEdit}
              onRemove={handleRemove}
              sizes={pricing.sizes}
              unit={pricing.product.unit}
            />
          ) : (
            <ProductResaleSettingsCard details={pricing} productId={productId} />
          )}

          {selectedAction?.kind === 'add' || selectedAction?.kind === 'edit' ? (
            <ProductSizeDialog
              isOpen
              onOpenChange={handleActionOpenChange}
              onSuccess={() => void handleActionSuccess()}
              productId={productId}
              size={selectedAction.kind === 'edit' ? selectedAction.size : undefined}
              unit={pricing.product.unit}
            />
          ) : null}
          {selectedAction?.kind === 'remove' ? (
            <RemoveProductSizeDialog
              isOpen
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              productId={productId}
              size={selectedAction.size}
            />
          ) : null}
        </>
      ) : null}
    </ProductDetailsPage>
  )
}
