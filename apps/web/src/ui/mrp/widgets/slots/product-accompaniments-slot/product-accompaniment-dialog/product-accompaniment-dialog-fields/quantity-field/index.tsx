import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type QuantityFieldProps = {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}

export const QuantityField = ({ item, state }: QuantityFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Quantidade por porção
    <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
      <Input
        {...state.register('quantityPerPortion')}
        aria-invalid={Boolean(state.errors.quantityPerPortion)}
        className='h-10 border-0 shadow-none focus-visible:ring-0'
        inputMode='decimal'
        type='text'
      />
      <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-bold text-muted-foreground'>
        {item?.unit ?? state.selectedProduct?.unit ?? 'un'}
      </span>
    </div>
    {state.errors.quantityPerPortion ? (
      <span className='text-sm font-semibold text-destructive'>
        {state.errors.quantityPerPortion.message}
      </span>
    ) : null}
  </Label>
)
