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

export type CostEstimateViewModel = {
  estimate: string
  formattedQuantity: string
  formattedUnitCost: string
  unit: string
}

export const useCostEstimate = ({
  item,
  state,
}: CostEstimateProps): CostEstimateViewModel => {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  return getCostEstimate(item, state, formatCurrency, formatQuantity)
}

function getCostEstimate(
  item: ProductAccompanimentDetails | undefined,
  state: ProductAccompanimentDialogState,
  formatCurrency: (amount: number) => string,
  formatQuantity: (quantity: number, unit: string) => string,
): CostEstimateViewModel {
  const unit = getCostUnit(item, state)
  return {
    estimate: getEstimatedCostLabel(state, formatCurrency),
    ...getCostDetails(state, formatQuantity, unit),
    unit,
  }
}

function getCostDetails(
  state: ProductAccompanimentDialogState,
  formatQuantity: (quantity: number, unit: string) => string,
  unit: string,
): Pick<CostEstimateViewModel, 'formattedQuantity' | 'formattedUnitCost'> {
  return {
    formattedQuantity: formatQuantity(state.numericQuantity, unit),
    formattedUnitCost: UNIT_COST_FORMATTER.format(state.source?.unitCost ?? 0),
  }
}

function getCostUnit(
  item: ProductAccompanimentDetails | undefined,
  state: ProductAccompanimentDialogState,
) {
  return item?.unit ?? state.selectedProduct?.unit ?? 'un'
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
