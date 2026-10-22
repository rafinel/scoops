import type { ProductPricingDetails } from '@scoops/core/mrp/domain/structures'

import { PriceSuggestion } from './price-suggestion'

export type PriceHelpVariant = 'all-portions' | 'selected-portions' | 'single-link'

const HELP_TEXT: Record<PriceHelpVariant, string> = {
  'all-portions': 'Este preço vale para todas as porções.',
  'selected-portions': 'Este preço vale para as porções selecionadas.',
  'single-link': 'Este preço vale só para este vínculo.',
}

export type PriceHelpProps = {
  accompanimentPriceIsSaved: boolean
  accompanimentPriceSuggestion: number | null
  accompanimentPriceSuggestionMode?: ProductPricingDetails['mode']
  variant: PriceHelpVariant
}

export const PriceHelp = ({
  accompanimentPriceIsSaved,
  accompanimentPriceSuggestion,
  accompanimentPriceSuggestionMode,
  variant,
}: PriceHelpProps) => (
  <span
    className='text-xs font-normal text-muted-foreground'
    id='accompaniment-price-help'
  >
    {HELP_TEXT[variant]}
    {accompanimentPriceIsSaved ? (
      <span className='block'>Preço já configurado.</span>
    ) : accompanimentPriceSuggestion !== null ? (
      <PriceSuggestion mode={accompanimentPriceSuggestionMode} />
    ) : null}
  </span>
)
