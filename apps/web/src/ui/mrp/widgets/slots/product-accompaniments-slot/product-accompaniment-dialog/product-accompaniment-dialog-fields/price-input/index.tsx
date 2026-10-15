import { Input } from '@/ui/shadcn/input'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceInputProps = {
  state: ProductAccompanimentDialogState
}

export const PriceInput = ({ state }: PriceInputProps) => (
  <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
    <span className='grid min-w-12 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'>
      R$
    </span>
    <Input
      {...state.register('accompanimentPrice')}
      aria-describedby={getPriceDescription(state)}
      aria-invalid={Boolean(
        state.errors.accompanimentPrice || state.accompanimentPriceError,
      )}
      aria-label='Preço do acompanhamento'
      className='h-10 border-0 shadow-none focus-visible:ring-0'
      inputMode='decimal'
      type='text'
    />
  </div>
)

function getPriceDescription(state: ProductAccompanimentDialogState) {
  return `accompaniment-price-help${state.errors.accompanimentPrice ? ' accompaniment-price-validation-error' : ''}${state.accompanimentPriceError ? ' accompaniment-price-read-error' : ''}`
}
