import type { UseFormRegisterReturn } from 'react-hook-form'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

export type AccompanimentQuantityFieldProps = {
  quantityError?: string
  quantityRegistration: UseFormRegisterReturn
  unit: string
}

export const AccompanimentQuantityField = ({
  quantityError,
  quantityRegistration,
  unit,
}: AccompanimentQuantityFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Quantidade por porção
    <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
      <Input
        {...quantityRegistration}
        aria-invalid={Boolean(quantityError)}
        className='h-10 border-0 shadow-none focus-visible:ring-0'
        inputMode='decimal'
        type='text'
      />
      <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-bold text-muted-foreground'>
        {unit}
      </span>
    </div>
    {quantityError ? (
      <span className='text-sm font-semibold text-destructive'>{quantityError}</span>
    ) : null}
  </Label>
)
