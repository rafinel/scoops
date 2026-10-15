import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'

import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

const UNIT_COST_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 5,
  minimumFractionDigits: 2,
  useGrouping: false,
})

export type CostEstimateProps = {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}

export const useCostEstimate = ({ item, state }: CostEstimateProps) => {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const unit = item?.unit ?? state.selectedProduct?.unit ?? 'un'

  return {
    estimate: getEstimatedCostLabel(state, formatCurrency),
    formattedQuantity: formatQuantity(state.numericQuantity, unit),
    formattedUnitCost: UNIT_COST_FORMATTER.format(state.source?.unitCost ?? 0),
    unit,
  }
}

function getEstimatedCostLabel(
  state: ProductAccompanimentDialogState,
  formatCurrency: (amount: number) => string,
) {
  if (state.selectedStockError && state.selectedProduct)
    return 'Não foi possível carregar o custo.'
  if (state.selectedStockLoading && state.selectedProduct) return 'Carregando…'
  if (state.estimatedCost === undefined) return 'Não disponível'
  return formatCurrency(state.estimatedCost)
}
