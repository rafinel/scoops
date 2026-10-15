import { Label } from '@/ui/shadcn/label'

import { PriceFeedback } from '../price-feedback'
import { PriceHelp } from '../price-help'
import { PriceInput } from '../price-input'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceFieldProps = {
  state: ProductAccompanimentDialogState
}

export const PriceField = ({ state }: PriceFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Preço do acompanhamento
    <PriceInput state={state} />
    <PriceHelp state={state} />
    <PriceFeedback state={state} />
  </Label>
)
