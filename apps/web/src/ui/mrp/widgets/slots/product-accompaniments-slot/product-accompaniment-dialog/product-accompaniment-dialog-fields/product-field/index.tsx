import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { CandidateLoadError } from '../candidate-load-error'
import { CandidateSelect } from '../candidate-select'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type ProductFieldProps = {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}

export const ProductField = ({ item, state }: ProductFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Acompanhamento
    {item ? (
      <Input disabled value={item.accompanimentProductName} />
    ) : state.candidatesError ? (
      <CandidateLoadError onRetry={state.retryCandidates} />
    ) : (
      <CandidateSelect state={state} />
    )}
    {state.candidatesLoading ? (
      <span aria-live='polite' className='text-xs text-muted-foreground'>
        Carregando acompanhamentos…
      </span>
    ) : null}
    {state.errors.accompanimentProductId ? (
      <span className='text-sm font-semibold text-destructive'>
        {state.errors.accompanimentProductId.message}
      </span>
    ) : null}
  </Label>
)
