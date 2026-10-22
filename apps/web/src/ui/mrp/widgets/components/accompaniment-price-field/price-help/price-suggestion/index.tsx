import type { ProductPricingDetails } from '@scoops/core/mrp/domain/structures'

export type PriceSuggestionProps = {
  mode?: ProductPricingDetails['mode']
}

export const PriceSuggestion = ({ mode }: PriceSuggestionProps) => (
  <span className='block'>
    Sugestão baseada no preço de revenda
    {mode === 'resale-by-brand' ? ' da marca principal' : ' único'}.
  </span>
)
