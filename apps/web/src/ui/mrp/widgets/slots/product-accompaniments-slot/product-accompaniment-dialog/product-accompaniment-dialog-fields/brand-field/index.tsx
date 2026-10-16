import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { StockLoadError } from '../stock-load-error'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type BrandFieldProps = {
  brandName: ProductAccompanimentDialogState['fields']['brandName']
  retrySelectedStock: ProductAccompanimentDialogState['retrySelectedStock']
  selectedStockError: boolean
}

export const BrandField = ({
  brandName,
  retrySelectedStock,
  selectedStockError,
}: BrandFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Marca atual
    {selectedStockError ? <StockLoadError onRetry={retrySelectedStock} /> : null}
    <Input aria-label='Marca atual' disabled value={brandName} />
  </Label>
)
