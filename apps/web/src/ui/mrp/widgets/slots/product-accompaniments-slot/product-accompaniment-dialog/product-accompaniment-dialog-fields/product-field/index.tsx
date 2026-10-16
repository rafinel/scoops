import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { CandidateLoadError } from '../candidate-load-error'
import { CandidateSelect } from '../candidate-select'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type ProductFieldProps = {
  candidatesError: boolean
  candidatesLoading: boolean
  handleValueChange: ProductAccompanimentDialogState['handleValueChange']
  item?: ProductAccompanimentDetails
  productError?: string
  productIdValue: string
  retryCandidates: ProductAccompanimentDialogState['retryCandidates']
  selectedProductName?: string
  candidates: ProductAccompanimentDialogState['candidates']
}

export const ProductField = ({
  candidates,
  candidatesError,
  candidatesLoading,
  handleValueChange,
  item,
  productError,
  productIdValue,
  retryCandidates,
  selectedProductName,
}: ProductFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Acompanhamento
    {item ? (
      <Input disabled value={item.accompanimentProductName} />
    ) : candidatesError ? (
      <CandidateLoadError onRetry={retryCandidates} />
    ) : (
      <CandidateSelect
        candidates={candidates}
        candidatesLoading={candidatesLoading}
        handleValueChange={handleValueChange}
        productIdValue={productIdValue}
        selectedProductName={selectedProductName}
      />
    )}
    {candidatesLoading ? (
      <span aria-live='polite' className='text-xs text-muted-foreground'>
        Carregando acompanhamentos…
      </span>
    ) : null}
    {productError ? (
      <span className='text-sm font-semibold text-destructive'>{productError}</span>
    ) : null}
  </Label>
)
