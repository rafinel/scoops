import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type CandidateSelectProps = {
  state: ProductAccompanimentDialogState
}

export const CandidateSelect = ({ state }: CandidateSelectProps) => (
  <Select
    disabled={state.candidatesLoading}
    onValueChange={(value) => state.handleValueChange('accompanimentProductId', value)}
    value={state.productIdValue || null}
  >
    <SelectTrigger aria-label='Acompanhamento' className='w-full'>
      <SelectValue placeholder='Selecione um acompanhamento'>
        {state.selectedProduct?.name}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {state.candidates.map((candidate) => (
        <SelectItem key={candidate.id} value={candidate.id}>
          {candidate.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
