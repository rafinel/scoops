import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { ProductPricingError } from './product-pricing-error'
import { ProductPricingLoading } from './product-pricing-loading'
import { ProductResaleSettingsCard } from './product-resale-settings-card'
import { ProductSizesCard } from './product-sizes-card'
import { ProductPricingActionDialogs } from './action-dialogs'
import { useProductPricingSlot } from './use-product-pricing-slot'

export type ProductPricingSlotProps = {
  productId: string
}

export const ProductPricingSlot = ({ productId }: ProductPricingSlotProps) => {
  const { account } = useAuthContext()
  const canManage = account?.profile === UserProfile.Manager
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
    isRefreshingPricing,
    pricing,
    selectedAction,
  } = useProductPricingSlot(productId)

  return (
    <ProductDetailsPage
      onBack={handleBack}
      product={pricing?.product}
      selectedTab='prices'
    >
      <QueryRefreshStatus isRefreshing={isRefreshingPricing} />
      {isLoadingPricing ? <ProductPricingLoading /> : null}
      {pricingError ? <ProductPricingError onRetry={handleRetry} /> : null}
      {pricing && !isLoadingPricing && !pricingError ? (
        <>
          {pricing.mode === 'portion' ? (
            <ProductSizesCard
              canManage={canManage}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onRemove={handleRemove}
              sizes={pricing.sizes}
              unit={pricing.product.unit}
            />
          ) : (
            <ProductResaleSettingsCard
              canManage={canManage}
              details={pricing}
              productId={productId}
            />
          )}

          {canManage ? (
            <ProductPricingActionDialogs
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              productId={productId}
              selectedAction={selectedAction}
              unit={pricing.product.unit}
            />
          ) : null}
        </>
      ) : null}
    </ProductDetailsPage>
  )
}
