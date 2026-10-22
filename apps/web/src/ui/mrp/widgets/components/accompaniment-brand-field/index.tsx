import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { StockLoadError } from './stock-load-error'

export type AccompanimentBrandFieldProps = {
  brandName: string
  retrySelectedStock: () => unknown
  selectedStockError: boolean
}

export const AccompanimentBrandField = ({
  brandName,
  retrySelectedStock,
  selectedStockError,
}: AccompanimentBrandFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Marca atual
    {selectedStockError ? <StockLoadError onRetry={retrySelectedStock} /> : null}
    <Input aria-label='Marca atual' disabled value={brandName} />
  </Label>
)
