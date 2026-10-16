import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { BrandField } from './brand-field'
import { CostEstimate } from './cost-estimate'
import { PriceField } from './price-field'
import { ProductField } from './product-field'
import { QuantityField } from './quantity-field'
import { TypeField } from './type-field'
import type { ProductAccompanimentDialogState } from '../use-product-accompaniment-dialog'

export type ProductAccompanimentDialogFieldsProps = Omit<
  ProductAccompanimentDialogState['fields'],
  'canSave'
> & {
  item?: ProductAccompanimentDetails
}

export const ProductAccompanimentDialogFields = ({
  actionError,
  accompanimentPriceError,
  accompanimentPriceIsSaved,
  accompanimentPriceLoading,
  accompanimentPriceSuggestion,
  accompanimentPriceSuggestionMode,
  candidates,
  candidatesError,
  candidatesLoading,
  estimatedCost,
  handleValueChange,
  item,
  numericQuantity,
  priceError,
  productError,
  productIdValue,
  quantityError,
  register,
  retryAccompanimentPrice,
  retryCandidates,
  retrySelectedStock,
  selectedProductName,
  selectedProductUnit,
  selectedStockError,
  selectedStockLoading,
  selectedTypeName,
  sourceName,
  sourceUnitCost,
  typeError,
  typeId,
  types,
  typesError,
  typesLoading,
}: ProductAccompanimentDialogFieldsProps) => (
  <div className='grid min-h-0 gap-3 overflow-y-auto p-4 sm:gap-5 sm:p-6'>
    <ProductField
      candidates={candidates}
      candidatesError={candidatesError}
      candidatesLoading={candidatesLoading}
      handleValueChange={handleValueChange}
      item={item}
      productError={productError}
      productIdValue={productIdValue}
      retryCandidates={retryCandidates}
      selectedProductName={selectedProductName}
    />
    <TypeField
      handleValueChange={handleValueChange}
      selectedTypeName={selectedTypeName}
      typeError={typeError}
      typeId={typeId}
      types={types}
      typesError={typesError}
      typesLoading={typesLoading}
    />
    <BrandField
      item={item}
      retrySelectedStock={retrySelectedStock}
      selectedProductUnit={selectedProductUnit}
      selectedStockError={selectedStockError}
      selectedStockLoading={selectedStockLoading}
      sourceName={sourceName}
    />
    <PriceField
      accompanimentPriceError={accompanimentPriceError}
      accompanimentPriceIsSaved={accompanimentPriceIsSaved}
      accompanimentPriceLoading={accompanimentPriceLoading}
      accompanimentPriceSuggestion={accompanimentPriceSuggestion}
      accompanimentPriceSuggestionMode={accompanimentPriceSuggestionMode}
      priceError={priceError}
      register={register}
      retryAccompanimentPrice={retryAccompanimentPrice}
    />
    <QuantityField
      item={item}
      quantityError={quantityError}
      register={register}
      selectedProductUnit={selectedProductUnit}
    />
    <CostEstimate
      estimatedCost={estimatedCost}
      item={item}
      numericQuantity={numericQuantity}
      selectedProductUnit={selectedProductUnit}
      selectedStockError={selectedStockError}
      selectedStockLoading={selectedStockLoading}
      sourceUnitCost={sourceUnitCost}
    />
    {actionError ? (
      <p className='text-sm font-semibold text-destructive' role='alert'>
        {actionError}
      </p>
    ) : null}
  </div>
)
