import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { StockLoadError } from '../stock-load-error'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type BrandFieldProps = {
  item?: ProductAccompanimentDetails
  retrySelectedStock: ProductAccompanimentDialogState['retrySelectedStock']
  selectedProductUnit?: NonNullable<
    ProductAccompanimentDialogState['selectedProduct']
  >['unit']
  selectedStockError: boolean
  selectedStockLoading: boolean
  sourceName?: string
}

export const BrandField = ({
  item,
  retrySelectedStock,
  selectedProductUnit,
  selectedStockError,
  selectedStockLoading,
  sourceName,
}: BrandFieldProps) => (
  <Label className='grid gap-2 font-bold'>
    Marca atual
    {selectedStockError ? <StockLoadError onRetry={retrySelectedStock} /> : null}
    <Input
      aria-label='Marca atual'
      disabled
      value={getBrandName(item, selectedProductUnit, selectedStockLoading, sourceName)}
    />
  </Label>
)

function getBrandName(
  item: ProductAccompanimentDetails | undefined,
  selectedProductUnit: BrandFieldProps['selectedProductUnit'],
  selectedStockLoading: boolean,
  sourceName: string | undefined,
) {
  if (selectedStockLoading && selectedProductUnit) return 'Carregando…'
  return sourceName ?? item?.brandName ?? 'Não disponível'
}
