import { AccompanimentBrandField } from '@/ui/mrp/widgets/components/accompaniment-brand-field'
import { AccompanimentCostEstimate } from '@/ui/mrp/widgets/components/accompaniment-cost-estimate'
import { AccompanimentPriceField } from '@/ui/mrp/widgets/components/accompaniment-price-field'
import { AccompanimentQuantityField } from '@/ui/mrp/widgets/components/accompaniment-quantity-field'
import { AccompanimentTypeField } from '@/ui/mrp/widgets/components/accompaniment-type-field'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { PortionPicker } from '../portion-picker'
import type { LinkPortionsDialogState } from '../use-link-portions-dialog'

export type LinkPortionsDialogFieldsProps = Omit<
  LinkPortionsDialogState,
  'canSubmit' | 'handleSubmit' | 'isPending' | 'isRefreshing' | 'submitLabel'
>

export const LinkPortionsDialogFields = ({
  accompanimentName,
  accompanimentPriceError,
  accompanimentPriceIsSaved,
  accompanimentPriceLoading,
  accompanimentPriceSuggestion,
  accompanimentPriceSuggestionMode,
  actionError,
  brandName,
  candidates,
  candidatesError,
  candidatesLoading,
  errors,
  estimatedCost,
  numericQuantity,
  portionProductIds,
  priceDescribedBy,
  priceRegistration,
  quantityRegistration,
  selectedStockError,
  selectedStockLoading,
  selectedTypeName,
  sourceUnitCost,
  typeId,
  types,
  typesError,
  typesLoading,
  unit,
  handleSelectedIdsChange,
  handleTypeChange,
  retryAccompanimentPrice,
  retryCandidates,
  retrySelectedStock,
}: LinkPortionsDialogFieldsProps) => (
  <div className='grid min-h-0 gap-3 overflow-y-auto p-4 sm:gap-5 sm:p-6'>
    <Label className='grid gap-2 font-bold'>
      Acompanhamento
      <Input disabled value={accompanimentName} />
    </Label>
    <PortionPicker
      candidates={candidates}
      error={errors.portionProductIds?.message}
      isError={candidatesError}
      isLoading={candidatesLoading}
      onRetry={() => void retryCandidates()}
      onSelectedIdsChange={handleSelectedIdsChange}
      selectedIds={portionProductIds}
    />
    <AccompanimentTypeField
      onTypeChange={handleTypeChange}
      selectedTypeName={selectedTypeName}
      typeError={errors.accompanimentTypeId?.message}
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
      priceError={errors.accompanimentPrice?.message}
      priceHelpVariant='selected-portions'
      priceRegistration={priceRegistration}
      retryAccompanimentPrice={retryAccompanimentPrice}
    />
    <AccompanimentQuantityField
      quantityError={errors.quantityPerPortion?.message}
      quantityRegistration={quantityRegistration}
      unit={unit}
    />
    <AccompanimentCostEstimate
      estimatedCost={estimatedCost}
      numericQuantity={numericQuantity}
      selectedProductUnit={unit}
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
