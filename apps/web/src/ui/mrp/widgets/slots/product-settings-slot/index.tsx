import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'

import { BasicInformationCard } from './basic-information-card'
import { ProductCategoriesCard } from './product-categories-card'
import { ProductDangerZone } from './product-danger-zone'
import { InternalNotesCard } from './internal-notes-card'
import { ProductSettingsError } from './product-settings-error'
import { ProductSettingsLoading } from './product-settings-loading'
import { RemoveProductDialog } from './remove-product-dialog'
import { StockControlCard } from './stock-control-card'
import {
  useProductSettingsSlot,
  type ProductSettingsSlotProps,
} from './use-product-settings-slot'
import { UnitChangeDialog } from './unit-change-dialog'

export type { ProductSettingsSlotProps }

export const ProductSettingsSlot = ({
  productId,
  retrySearch,
}: ProductSettingsSlotProps) => {
  const {
    settings,
    hasSettingsError,
    isLoadingSettings,
    targetUnit,
    isUnitDialogOpen,
    isRemovalDialogOpen,
    handleBack,
    handleRetry,
    handleUnitChange,
    handleUnitDialogOpenChange,
    handleOpenRemoval,
    handleRemovalOpenChange,
  } = useProductSettingsSlot(productId, retrySearch)

  const product = settings?.product

  return (
    <ProductDetailsPage onBack={handleBack} product={product} selectedTab='settings'>
      {isLoadingSettings && !settings ? <ProductSettingsLoading /> : null}
      {hasSettingsError && !settings ? (
        <ProductSettingsError onRetry={handleRetry} />
      ) : null}
      {product && !isLoadingSettings ? (
        <div className='grid gap-5'>
          <BasicInformationCard onUnitChange={handleUnitChange} product={product} />
          <StockControlCard product={product} />
          <ProductCategoriesCard product={product} retrySearch={retrySearch} />
          <InternalNotesCard product={product} />
          <ProductDangerZone onRemove={handleOpenRemoval} />
        </div>
      ) : null}

      {product && targetUnit ? (
        <UnitChangeDialog
          currentUnit={product.unit}
          onOpenChange={handleUnitDialogOpenChange}
          open={isUnitDialogOpen}
          product={product}
          targetUnit={targetUnit}
        />
      ) : null}
      {product ? (
        <RemoveProductDialog
          onOpenChange={handleRemovalOpenChange}
          open={isRemovalDialogOpen}
          product={product}
        />
      ) : null}
    </ProductDetailsPage>
  )
}
