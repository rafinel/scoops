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
  estimatedCost: ProductAccompanimentDialogState['estimatedCost']
  item?: ProductAccompanimentDetails
  numericQuantity: ProductAccompanimentDialogState['numericQuantity']
  selectedProductUnit?: NonNullable<
    ProductAccompanimentDialogState['selectedProduct']
  >['unit']
  selectedStockError: boolean
  selectedStockLoading: boolean
  sourceUnitCost?: number
}

export type CostEstimateViewModel = {
  estimate: string
  formattedQuantity: string
  formattedUnitCost: string
  hasDetails: boolean
  unit: string
}

export const useCostEstimate = (props: CostEstimateProps): CostEstimateViewModel => {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  return getCostEstimate(props, formatCurrency, formatQuantity)
}

function getCostEstimate(
  {
    estimatedCost,
    item,
    numericQuantity,
    selectedProductUnit,
    selectedStockError,
    selectedStockLoading,
    sourceUnitCost,
  }: CostEstimateProps,
  formatCurrency: (amount: number) => string,
  formatQuantity: (quantity: number, unit: string) => string,
): CostEstimateViewModel {
  const unit = item?.unit ?? selectedProductUnit ?? 'un'
  return {
    estimate: getEstimatedCostLabel(
      estimatedCost,
      selectedStockError,
      selectedStockLoading,
      selectedProductUnit !== undefined,
      formatCurrency,
    ),
    ...getCostDetails(numericQuantity, sourceUnitCost, formatQuantity, unit),
    hasDetails: sourceUnitCost !== undefined && numericQuantity > 0,
    unit,
  }
}

function getCostDetails(
  numericQuantity: number,
  sourceUnitCost: number | undefined,
  formatQuantity: (quantity: number, unit: string) => string,
  unit: string,
): Pick<CostEstimateViewModel, 'formattedQuantity' | 'formattedUnitCost'> {
  return {
    formattedQuantity: formatQuantity(numericQuantity, unit),
    formattedUnitCost: UNIT_COST_FORMATTER.format(sourceUnitCost ?? 0),
  }
}

function getEstimatedCostLabel(
  estimatedCost: number | undefined,
  selectedStockError: boolean,
  selectedStockLoading: boolean,
  hasSelectedProduct: boolean,
  formatCurrency: (amount: number) => string,
) {
  if (selectedStockError && hasSelectedProduct)
    return 'Não foi possível carregar o custo.'
  if (selectedStockLoading && hasSelectedProduct) return 'Carregando…'
  if (estimatedCost === undefined) return 'Não disponível'
  return formatCurrency(estimatedCost)
}
