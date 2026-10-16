import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Label } from '@/ui/shadcn/label'

import { TypeFeedback } from '../type-feedback'
import { TypeSelect } from '../type-select'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type TypeFieldProps = {
  handleValueChange: ProductAccompanimentDialogState['handleValueChange']
  selectedTypeName: ProductAccompanimentDialogState['selectedTypeName']
  typeError?: string
  typeId: ProductAccompanimentDialogState['typeId']
  types: ProductAccompanimentDialogState['types']
  typesError: boolean
  typesLoading: boolean
}

export const TypeField = ({
  handleValueChange,
  selectedTypeName,
  typeError,
  typeId,
  types,
  typesError,
  typesLoading,
}: TypeFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    <span className='flex items-center justify-between gap-3'>
      Tipo
      <Anchor className='text-xs font-bold text-primary' route='accompanimentTypes'>
        Gerenciar tipos →
      </Anchor>
    </span>
    <TypeSelect
      handleValueChange={handleValueChange}
      selectedTypeName={selectedTypeName}
      typeId={typeId}
      types={types}
    />
    <TypeFeedback
      typeError={typeError}
      typesError={typesError}
      typesLoading={typesLoading}
    />
  </Label>
)
