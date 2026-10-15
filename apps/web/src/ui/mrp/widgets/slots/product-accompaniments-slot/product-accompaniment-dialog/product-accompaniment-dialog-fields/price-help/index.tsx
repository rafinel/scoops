import { PriceSuggestion } from '../price-suggestion'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceHelpProps = {
  state: ProductAccompanimentDialogState
}

export const PriceHelp = ({ state }: PriceHelpProps) => (
  <span
    className='text-xs font-normal text-muted-foreground'
    id='accompaniment-price-help'
  >
    Este preço vale para todos os vínculos e tamanhos.
    {state.accompanimentPriceIsSaved ? (
      <span className='block'>Preço já configurado para este produto.</span>
    ) : state.accompanimentPriceSuggestion !== null ? (
      <PriceSuggestion mode={state.accompanimentPriceSuggestionMode} />
    ) : null}
  </span>
)
