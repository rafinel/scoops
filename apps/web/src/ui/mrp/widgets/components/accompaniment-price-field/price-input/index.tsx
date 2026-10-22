import type { UseFormRegisterReturn } from 'react-hook-form'

import { Input } from '@/ui/shadcn/input'

export type PriceInputProps = {
  accompanimentPriceError: boolean
  ariaDescribedBy: string
  priceError?: string
  priceRegistration: UseFormRegisterReturn
}

export const PriceInput = ({
  accompanimentPriceError,
  ariaDescribedBy,
  priceError,
  priceRegistration,
}: PriceInputProps) => (
  <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
    <span className='grid min-w-12 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'>
      R$
    </span>
    <Input
      {...priceRegistration}
      aria-describedby={ariaDescribedBy}
      aria-invalid={Boolean(priceError || accompanimentPriceError)}
      aria-label='Preço do acompanhamento'
      className='h-10 border-0 shadow-none focus-visible:ring-0'
      inputMode='decimal'
      type='text'
    />
  </div>
)
