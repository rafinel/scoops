import type { ProductStockDetails } from '@scoops/core/mrp/domain/structures'

import { ProductBrandDialog } from '../product-brand-dialog'
import { RemoveProductBrandDialog } from '../remove-product-brand-dialog'
import { StockAdjustmentDialog } from '../stock-adjustment-dialog'
import { StockTransactionHistoryCard } from '../stock-transaction-history-card'
import type { ProductStockAction } from '../use-product-stock-slot'

export type ProductStockDialogsProps = {
  onActionOpenChange: (open: boolean) => void
  onActionSuccess: () => void
  productId: string
  productStock: ProductStockDetails
  selectedAction?: ProductStockAction
}

export const ProductStockDialogs = ({
  onActionOpenChange,
  onActionSuccess,
  productId,
  productStock,
  selectedAction,
}: ProductStockDialogsProps) => (
  <>
    <StockTransactionHistoryCard brands={productStock.brands} productId={productId} />
    <ProductBrandDialog
      brand={selectedAction?.kind === 'edit-brand' ? selectedAction.brand : undefined}
      onOpenChange={onActionOpenChange}
      onSuccess={onActionSuccess}
      open={selectedAction?.kind === 'add-brand' || selectedAction?.kind === 'edit-brand'}
      productId={productId}
      productName={productStock.product.name}
      unit={productStock.product.unit}
      variant={selectedAction?.kind === 'edit-brand' ? 'edit' : 'add'}
    />
    {selectedAction?.kind === 'delete-brand' ? (
      <RemoveProductBrandDialog
        brand={selectedAction.brand}
        hasSiblingBrands={productStock.brands.length > 1}
        onOpenChange={onActionOpenChange}
        onSuccess={onActionSuccess}
        open
        productId={productId}
      />
    ) : null}
    {selectedAction?.kind === 'entry' || selectedAction?.kind === 'write-off' ? (
      <StockAdjustmentDialog
        allowNegativeStock={productStock.product.allowNegativeStock ?? false}
        brand={selectedAction.brand}
        currentBalance={selectedAction.brand?.stockQuantity ?? productStock.stockQuantity}
        isOpen
        onOpenChange={onActionOpenChange}
        onSuccess={onActionSuccess}
        productId={productId}
        type={selectedAction.kind}
        unit={productStock.product.unit}
      />
    ) : null}
  </>
)
