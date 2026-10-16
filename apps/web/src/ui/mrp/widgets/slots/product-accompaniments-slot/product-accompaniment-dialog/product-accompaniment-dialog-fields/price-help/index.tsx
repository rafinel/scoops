import { PriceSuggestion } from '../price-suggestion'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceHelpProps = {
  accompanimentPriceIsSaved: boolean
  accompanimentPriceSuggestion: number | null
  accompanimentPriceSuggestionMode: ProductAccompanimentDialogState['accompanimentPriceSuggestionMode']
}

export const PriceHelp = ({
  accompanimentPriceIsSaved,
  accompanimentPriceSuggestion,
  accompanimentPriceSuggestionMode,
}: PriceHelpProps) => (
  <span
    className='text-xs font-normal text-muted-foreground'
    id='accompaniment-price-help'
  >
    Este preço vale para todos os vínculos e tamanhos.
    {accompanimentPriceIsSaved ? (
      <span className='block'>Preço já configurado para este produto.</span>
    ) : accompanimentPriceSuggestion !== null ? (
      <PriceSuggestion mode={accompanimentPriceSuggestionMode} />
    ) : null}
  </span>
)
