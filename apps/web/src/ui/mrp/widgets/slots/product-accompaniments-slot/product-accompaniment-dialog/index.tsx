import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Dialog, DialogContent } from '@/ui/shadcn/dialog'

import { ProductAccompanimentDialogActions } from './product-accompaniment-dialog-actions'
import { ProductAccompanimentDialogFields } from './product-accompaniment-dialog-fields'
import { ProductAccompanimentDialogHeader } from './product-accompaniment-dialog-header'
import { useProductAccompanimentDialog } from './use-product-accompaniment-dialog'

export type ProductAccompanimentDialogProps = {
  item?: ProductAccompanimentDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
}

export const ProductAccompanimentDialog = ({
  item,
  onOpenChange,
  onSuccess,
  open,
  productId,
}: ProductAccompanimentDialogProps) => {
  const {
    actionError,
    accompanimentPriceError,
    accompanimentPriceIsSaved,
    accompanimentPriceLoading,
    accompanimentPriceSuggestion,
    accompanimentPriceSuggestionMode,
    canSave,
    candidates,
    candidatesError,
    candidatesLoading,
    errors,
    estimatedCost,
    isEdit,
    isPending,
    isRefreshing,
    numericQuantity,
    productIdValue,
    selectedProduct,
    selectedStockError,
    selectedStockLoading,
    selectedTypeName,
    source,
    typeId,
    types,
    typesError,
    typesLoading,
    handleSubmit,
    handleValueChange,
    retryAccompanimentPrice,
    retryCandidates,
    retrySelectedStock,
    register,
  } = useProductAccompanimentDialog({ item, onSuccess, open, productId })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden sm:max-w-lg'>
        <ProductAccompanimentDialogHeader isEdit={isEdit} isRefreshing={isRefreshing} />
        <form
          className='grid min-h-0 grid-rows-[minmax(0,1fr)_auto]'
          onSubmit={handleSubmit}
        >
          <ProductAccompanimentDialogFields
            actionError={actionError}
            accompanimentPriceError={accompanimentPriceError}
            accompanimentPriceIsSaved={accompanimentPriceIsSaved}
            accompanimentPriceLoading={accompanimentPriceLoading}
            accompanimentPriceSuggestion={accompanimentPriceSuggestion}
            accompanimentPriceSuggestionMode={accompanimentPriceSuggestionMode}
            candidates={candidates}
            candidatesError={candidatesError}
            candidatesLoading={candidatesLoading}
            estimatedCost={estimatedCost}
            handleValueChange={handleValueChange}
            item={item}
            numericQuantity={numericQuantity}
            priceError={errors.accompanimentPrice?.message}
            productIdValue={productIdValue}
            productError={errors.accompanimentProductId?.message}
            quantityError={errors.quantityPerPortion?.message}
            register={register}
            retryAccompanimentPrice={retryAccompanimentPrice}
            retryCandidates={retryCandidates}
            retrySelectedStock={retrySelectedStock}
            selectedProductName={selectedProduct?.name}
            selectedProductUnit={selectedProduct?.unit}
            selectedStockError={selectedStockError}
            selectedStockLoading={selectedStockLoading}
            selectedTypeName={selectedTypeName}
            sourceName={source?.name}
            sourceUnitCost={source?.unitCost}
            typeError={errors.accompanimentTypeId?.message}
            typeId={typeId}
            types={types}
            typesError={typesError}
            typesLoading={typesLoading}
          />
          <ProductAccompanimentDialogActions
            canSave={canSave}
            isEdit={isEdit}
            isPending={isPending}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
