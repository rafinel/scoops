import type { UseFormRegisterReturn } from 'react-hook-form'

import type { ProductPricingDetails } from '@scoops/core/mrp/domain/structures'

import { Label } from '@/ui/shadcn/label'

import { PriceFeedback } from './price-feedback'
import { PriceHelp, type PriceHelpVariant } from './price-help'
import { PriceInput } from './price-input'

export type { PriceHelpVariant }

export type AccompanimentPriceFieldProps = {
  accompanimentPriceError: boolean
  accompanimentPriceIsSaved: boolean
  accompanimentPriceLoading: boolean
  accompanimentPriceSuggestion: number | null
  accompanimentPriceSuggestionMode?: ProductPricingDetails['mode']
  priceDescribedBy: string
  priceError?: string
  priceHelpVariant: PriceHelpVariant
  priceRegistration: UseFormRegisterReturn
  retryAccompanimentPrice: () => unknown
}

export const AccompanimentPriceField = ({
  accompanimentPriceError,
  accompanimentPriceIsSaved,
  accompanimentPriceLoading,
  accompanimentPriceSuggestion,
  accompanimentPriceSuggestionMode,
  priceDescribedBy,
  priceError,
  priceHelpVariant,
  priceRegistration,
  retryAccompanimentPrice,
}: AccompanimentPriceFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Preço do acompanhamento
    <PriceInput
      ariaDescribedBy={priceDescribedBy}
      accompanimentPriceError={accompanimentPriceError}
      priceError={priceError}
      priceRegistration={priceRegistration}
    />
    <PriceHelp
      accompanimentPriceIsSaved={accompanimentPriceIsSaved}
      accompanimentPriceSuggestion={accompanimentPriceSuggestion}
      accompanimentPriceSuggestionMode={accompanimentPriceSuggestionMode}
      variant={priceHelpVariant}
    />
    <PriceFeedback
      accompanimentPriceError={accompanimentPriceError}
      accompanimentPriceLoading={accompanimentPriceLoading}
      priceError={priceError}
      retryAccompanimentPrice={retryAccompanimentPrice}
    />
  </Label>
)
