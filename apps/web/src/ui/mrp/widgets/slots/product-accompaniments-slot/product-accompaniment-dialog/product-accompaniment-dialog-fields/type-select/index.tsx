import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type TypeSelectProps = {
  state: ProductAccompanimentDialogState
}

export const TypeSelect = ({ state }: TypeSelectProps) => (
  <Select
    onValueChange={(value) => state.handleValueChange('accompanimentTypeId', value)}
    value={state.typeId || null}
  >
    <SelectTrigger aria-label='Tipo' className='w-full'>
      <SelectValue placeholder='Selecione um tipo'>
        {state.typeId ? (state.selectedTypeName ?? 'Carregando tipo…') : undefined}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {state.types.map(({ type }) => (
        <SelectItem key={type.id} value={type.id}>
          {type.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
