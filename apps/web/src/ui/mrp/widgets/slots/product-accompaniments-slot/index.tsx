import { UserProfile } from '@scoops/core/identity/domain/structures'

import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'

import { AccompanimentActionDialogs } from './action-dialogs'
import { ProductAccompanimentsContent } from './product-accompaniments-content'
import { ProductAccompanimentsError } from './product-accompaniments-error'
import { ProductAccompanimentsLoading } from './product-accompaniments-loading'
import { useProductAccompanimentsSlot } from './use-product-accompaniments-slot'

export type ProductAccompanimentsSlotProps = {
  productId: string
}

export const ProductAccompanimentsSlot = ({
  productId,
}: ProductAccompanimentsSlotProps) => {
  const { account } = useAuthContext()
  const canManage = account?.profile === UserProfile.Manager
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
    isRefreshing,
    product,
    selectedAction,
  } = useProductAccompanimentsSlot(productId)

  return (
    <ProductDetailsPage
      onBack={handleBack}
      product={product}
      selectedTab='accompaniments'
    >
      <QueryRefreshStatus isRefreshing={isRefreshing} />
      {isLoading ? <ProductAccompanimentsLoading /> : null}
      {isError ? <ProductAccompanimentsError onRetry={handleRetry} /> : null}
      {details && !isLoading && !isError ? (
        <>
          <ProductAccompanimentsContent
            canManage={canManage}
            details={details}
            onAdd={handleAddAction}
            onEdit={handleEditAction}
            onRemove={handleRemoveAction}
          />
          {canManage &&
          (details.accompaniments.length > 0 || selectedAction?.kind === 'add') ? (
            <AccompanimentActionDialogs
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              productId={productId}
              selectedAction={selectedAction}
            />
          ) : null}
        </>
      ) : null}
    </ProductDetailsPage>
  )
}
