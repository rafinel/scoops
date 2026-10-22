import type { AccompanimentTypeListItem } from '@scoops/core/mrp/domain/structures'

import { Label } from '@/ui/shadcn/label'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

import { TypeFeedback } from './type-feedback'
import { TypeSelect } from './type-select'

export type AccompanimentTypeFieldProps = {
  onTypeChange: (typeId: string | null) => void
  selectedTypeName?: string
  typeError?: string
  typeId: string
  types: readonly AccompanimentTypeListItem[]
  typesError: boolean
  typesLoading: boolean
}

export const AccompanimentTypeField = ({
  onTypeChange,
  selectedTypeName,
  typeError,
  typeId,
  types,
  typesError,
  typesLoading,
}: AccompanimentTypeFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    <span className='flex items-center justify-between gap-3'>
      Tipo
      <Anchor className='text-xs font-bold text-primary' route='accompanimentTypes'>
        Gerenciar tipos →
      </Anchor>
    </span>
    <TypeSelect
      onTypeChange={onTypeChange}
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
