import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'

import { ProductStockControls } from './product-stock-controls'
import { ProductStockDialogs } from './product-stock-dialogs'
import { ProductStockStatus } from './product-stock-status'
import { ProductStockSummary } from './product-stock-summary'
import { useProductStockSlot } from './use-product-stock-slot'

export type ProductStockSlotProps = { productId: string }

export const ProductStockSlot = ({ productId }: ProductStockSlotProps) => {
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
