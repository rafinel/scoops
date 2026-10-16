import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type TypeSelectProps = {
  handleValueChange: ProductAccompanimentDialogState['handleValueChange']
  selectedTypeName: ProductAccompanimentDialogState['selectedTypeName']
  typeId: ProductAccompanimentDialogState['typeId']
  types: ProductAccompanimentDialogState['types']
}

export const TypeSelect = ({
  handleValueChange,
  selectedTypeName,
  typeId,
  types,
}: TypeSelectProps) => (
  <Select
    onValueChange={(value) => handleValueChange('accompanimentTypeId', value)}
    value={typeId || null}
  >
    <SelectTrigger aria-label='Tipo' className='w-full'>
      <SelectValue placeholder='Selecione um tipo'>
        {typeId ? (selectedTypeName ?? 'Carregando tipo…') : undefined}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {types.map(({ type }) => (
        <SelectItem key={type.id} value={type.id}>
          {type.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
