import { Input } from '@/ui/shadcn/input'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceInputProps = {
  accompanimentPriceError: boolean
  priceError?: string
  register: ProductAccompanimentDialogState['register']
}

export const PriceInput = ({
  accompanimentPriceError,
  priceError,
  register,
}: PriceInputProps) => (
  <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
    <span className='grid min-w-12 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'>
      R$
    </span>
    <Input
      {...register('accompanimentPrice')}
      aria-describedby={getPriceDescription(priceError, accompanimentPriceError)}
      aria-invalid={Boolean(priceError || accompanimentPriceError)}
      aria-label='Preço do acompanhamento'
      className='h-10 border-0 shadow-none focus-visible:ring-0'
      inputMode='decimal'
      type='text'
    />
  </div>
)

function getPriceDescription(priceError: string | undefined, hasReadError: boolean) {
  return `accompaniment-price-help${priceError ? ' accompaniment-price-validation-error' : ''}${hasReadError ? ' accompaniment-price-read-error' : ''}`
}
