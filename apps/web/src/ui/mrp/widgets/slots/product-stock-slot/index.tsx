import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { ProductStockControls } from './product-stock-controls'
import { ProductStockDialogs } from './product-stock-dialogs'
import { ProductStockStatus } from './product-stock-status'
import { ProductStockSummary } from './product-stock-summary'
import { useProductStockSlot } from './use-product-stock-slot'

export type ProductStockSlotProps = { productId: string }

export const ProductStockSlot = ({ productId }: ProductStockSlotProps) => {
  const { account } = useAuthContext()
  const canManage = account?.profile === UserProfile.Manager
  const {
    productStock,
    selectedAction,
    isBrandActionPending,
    isError,
    isLoading,
    isRefreshing,
    handleAddBrand,
    handleActionOpenChange,
    handleActionSuccess,
    handleBack,
    handleEntry,
    handleDeleteBrand,
    handleEditBrand,
    handleRetry,
    handleSetPrimaryBrand,
    handleWriteOff,
  } = useProductStockSlot(productId)

  return (
    <ProductDetailsPage
      onBack={handleBack}
      product={productStock?.product}
      selectedTab='stock'
    >
      <ProductStockStatus
        {...{ isError, isLoading, isRefreshing, onRetry: handleRetry }}
      />
      {productStock && !isLoading && !isError ? (
        <>
          <ProductStockSummary
            idealStock={productStock.idealStock}
            stockQuantity={productStock.stockQuantity}
            stockSituation={productStock.stockSituation}
            unit={productStock.product.unit}
          />
          <ProductStockControls
            canManage={canManage}
            isBrandActionPending={isBrandActionPending}
            onAddBrand={handleAddBrand}
            onDeleteBrand={handleDeleteBrand}
            onEditBrand={handleEditBrand}
            onEntry={handleEntry}
            onSetPrimaryBrand={(brand) => void handleSetPrimaryBrand(brand)}
            onWriteOff={handleWriteOff}
            productStock={productStock}
          />
          <ProductStockDialogs
            canManage={canManage}
            onActionOpenChange={handleActionOpenChange}
            onActionSuccess={handleActionSuccess}
            productId={productId}
            productStock={productStock}
            selectedAction={selectedAction}
          />
        </>
      ) : null}
    </ProductDetailsPage>
  )
}
