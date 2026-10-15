import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { StockLoadError } from '../stock-load-error'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type BrandFieldProps = {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}

export const BrandField = ({ item, state }: BrandFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Marca atual
    {state.selectedStockError ? (
      <StockLoadError onRetry={state.retrySelectedStock} />
    ) : null}
    <Input aria-label='Marca atual' disabled value={getBrandName(item, state)} />
  </Label>
)

function getBrandName(
  item: ProductAccompanimentDetails | undefined,
  state: ProductAccompanimentDialogState,
) {
  if (state.selectedStockLoading && state.selectedProduct) return 'Carregando…'
  return state.source?.name ?? item?.brandName ?? 'Não disponível'
}
