import type { AccompanimentTypeListItem } from '@scoops/core/mrp/domain/structures'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type TypeSelectProps = {
  onTypeChange: (typeId: string | null) => void
  selectedTypeName?: string
  typeId: string
  types: readonly AccompanimentTypeListItem[]
}

export const TypeSelect = ({
  onTypeChange,
  selectedTypeName,
  typeId,
  types,
}: TypeSelectProps) => (
  <Select onValueChange={onTypeChange} value={typeId || null}>
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
