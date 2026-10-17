import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type CandidateSelectProps = {
  candidates: ProductAccompanimentDialogState['candidates']
  candidatesLoading: boolean
  handleValueChange: ProductAccompanimentDialogState['handleValueChange']
  productIdValue: string
  selectedProductName?: string
}

export const CandidateSelect = ({
  candidates,
  candidatesLoading,
  handleValueChange,
  productIdValue,
  selectedProductName,
}: CandidateSelectProps) => (
  <Select
    disabled={candidatesLoading}
    onValueChange={(value) => handleValueChange('accompanimentProductId', value)}
    value={productIdValue || null}
  >
    <SelectTrigger aria-label='Acompanhamento' className='w-full'>
      <SelectValue placeholder='Selecione um acompanhamento'>
        {selectedProductName}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {candidates.map((candidate) => (
        <SelectItem key={candidate.productId} value={candidate.productId}>
          {candidate.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
