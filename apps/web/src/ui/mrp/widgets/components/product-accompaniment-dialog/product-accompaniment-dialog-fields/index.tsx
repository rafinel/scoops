import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { AccompanimentBrandField } from '@/ui/mrp/widgets/components/accompaniment-brand-field'
import { AccompanimentCostEstimate } from '@/ui/mrp/widgets/components/accompaniment-cost-estimate'
import { AccompanimentGlobalField } from '@/ui/mrp/widgets/components/accompaniment-global-field'
import { AccompanimentPriceField } from '@/ui/mrp/widgets/components/accompaniment-price-field'
import { AccompanimentQuantityField } from '@/ui/mrp/widgets/components/accompaniment-quantity-field'
import { AccompanimentTypeField } from '@/ui/mrp/widgets/components/accompaniment-type-field'
import { GlobalReplacementNotice } from '@/ui/mrp/widgets/components/global-replacement-notice'
import { GlobalScopeNotice } from '@/ui/mrp/widgets/components/global-scope-notice'

import type { ProductAccompanimentDialogState } from '../use-product-accompaniment-dialog'
import { ProductField } from './product-field'

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
  brandName,
  candidates,
  candidatesError,
  candidatesLoading,
  estimatedCost,
  handleGlobalChange,
  handleValueChange,
  hasGlobalSwitch,
  isGlobalLocked,
  isGlobalValue,
  item,
  numericQuantity,
  priceError,
  priceDescribedBy,
  productError,
  productIdValue,
  quantityError,
  readOnlyProductName,
  register,
  replacementNoticeWording,
  retryAccompanimentPrice,
  retryCandidates,
  retrySelectedStock,
  selectedProductUnit,
  selectedProductName,
  selectedStockError,
  selectedStockLoading,
  selectedTypeName,
  shouldShowReplacementNotice,
  sourceUnitCost,
  typeError,
  typeId,
  types,
  typesError,
  typesLoading,
  unit,
}: ProductAccompanimentDialogFieldsProps) => (
  <div className='grid min-h-0 gap-3 overflow-y-auto p-4 sm:gap-5 sm:p-6'>
    <GlobalScopeNotice explainsRemoval={isGlobalLocked} isGlobal={isGlobalValue} />
    <ProductField
      candidates={candidates}
      candidatesError={candidatesError}
      candidatesLoading={candidatesLoading}
      handleValueChange={handleValueChange}
      productError={productError}
      productIdValue={productIdValue}
      readOnlyProductName={readOnlyProductName}
      retryCandidates={retryCandidates}
      selectedProductName={selectedProductName}
    />
    {hasGlobalSwitch ? (
      <AccompanimentGlobalField
        handleGlobalChange={handleGlobalChange}
        isGlobal={isGlobalValue}
        shouldShowReplacementNotice={shouldShowReplacementNotice}
      />
    ) : (
      <GlobalReplacementNotice
        isVisible={shouldShowReplacementNotice}
        wording={replacementNoticeWording}
      />
    )}
    <AccompanimentTypeField
      onTypeChange={(value) => handleValueChange('accompanimentTypeId', value)}
      selectedTypeName={selectedTypeName}
      typeError={typeError}
      typeId={typeId}
      types={types}
      typesError={typesError}
      typesLoading={typesLoading}
    />
    <AccompanimentBrandField
      brandName={brandName}
      retrySelectedStock={retrySelectedStock}
      selectedStockError={selectedStockError}
    />
    <AccompanimentPriceField
      accompanimentPriceError={accompanimentPriceError}
      accompanimentPriceIsSaved={accompanimentPriceIsSaved}
      accompanimentPriceLoading={accompanimentPriceLoading}
      accompanimentPriceSuggestion={accompanimentPriceSuggestion}
      accompanimentPriceSuggestionMode={accompanimentPriceSuggestionMode}
      priceDescribedBy={priceDescribedBy}
      priceError={priceError}
      priceHelpVariant={isGlobalValue ? 'all-portions' : 'single-link'}
      priceRegistration={register('accompanimentPrice')}
      retryAccompanimentPrice={retryAccompanimentPrice}
    />
    <AccompanimentQuantityField
      quantityError={quantityError}
      quantityRegistration={register('quantityPerPortion')}
      unit={unit}
    />
    <AccompanimentCostEstimate
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
