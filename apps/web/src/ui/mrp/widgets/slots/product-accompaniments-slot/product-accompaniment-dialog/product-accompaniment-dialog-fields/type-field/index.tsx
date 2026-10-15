import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Label } from '@/ui/shadcn/label'

import { TypeFeedback } from '../type-feedback'
import { TypeSelect } from '../type-select'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type TypeFieldProps = {
  state: ProductAccompanimentDialogState
}

export const TypeField = ({ state }: TypeFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    <span className='flex items-center justify-between gap-3'>
      Tipo
      <Anchor className='text-xs font-bold text-primary' route='accompanimentTypes'>
        Gerenciar tipos →
      </Anchor>
    </span>
    <TypeSelect state={state} />
    <TypeFeedback state={state} />
  </Label>
)
