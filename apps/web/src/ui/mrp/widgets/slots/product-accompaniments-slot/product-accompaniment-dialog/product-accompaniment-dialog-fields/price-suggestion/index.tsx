import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceSuggestionProps = {
  mode: ProductAccompanimentDialogState['accompanimentPriceSuggestionMode']
}

export const PriceSuggestion = ({ mode }: PriceSuggestionProps) => (
  <span className='block'>
    Sugestão baseada no preço de revenda
    {mode === 'resale-by-brand' ? ' da marca principal' : ' único'}.
  </span>
)
