import { Label } from '@/ui/shadcn/label'

import { PriceFeedback } from '../price-feedback'
import { PriceHelp } from '../price-help'
import { PriceInput } from '../price-input'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceFieldProps = {
  accompanimentPriceError: boolean
  accompanimentPriceIsSaved: boolean
  accompanimentPriceLoading: boolean
  accompanimentPriceSuggestion: number | null
  accompanimentPriceSuggestionMode: ProductAccompanimentDialogState['accompanimentPriceSuggestionMode']
  priceError?: string
  register: ProductAccompanimentDialogState['register']
  retryAccompanimentPrice: ProductAccompanimentDialogState['retryAccompanimentPrice']
}

export const PriceField = ({
  accompanimentPriceError,
  accompanimentPriceIsSaved,
  accompanimentPriceLoading,
  accompanimentPriceSuggestion,
  accompanimentPriceSuggestionMode,
  priceError,
  register,
  retryAccompanimentPrice,
}: PriceFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Preço do acompanhamento
    <PriceInput
      accompanimentPriceError={accompanimentPriceError}
      priceError={priceError}
      register={register}
    />
    <PriceHelp
      accompanimentPriceIsSaved={accompanimentPriceIsSaved}
      accompanimentPriceSuggestion={accompanimentPriceSuggestion}
      accompanimentPriceSuggestionMode={accompanimentPriceSuggestionMode}
    />
    <PriceFeedback
      accompanimentPriceError={accompanimentPriceError}
      accompanimentPriceLoading={accompanimentPriceLoading}
      priceError={priceError}
      retryAccompanimentPrice={retryAccompanimentPrice}
    />
  </Label>
)
