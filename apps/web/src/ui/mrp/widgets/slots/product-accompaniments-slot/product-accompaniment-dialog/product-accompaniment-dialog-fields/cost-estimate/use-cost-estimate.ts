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
  props: CostEstimateProps,
  formatCurrency: (amount: number) => string,
  formatQuantity: (quantity: number, unit: string) => string,
): CostEstimateViewModel {
  const unit = props.item?.unit ?? props.selectedProductUnit ?? 'un'
  return {
    estimate: getEstimatedCostLabel(props, formatCurrency),
    ...getCostDetails(props, formatQuantity, unit),
  }
}

function getCostDetails(
  props: Pick<CostEstimateProps, 'numericQuantity' | 'sourceUnitCost'>,
  formatQuantity: (quantity: number, unit: string) => string,
  unit: string,
): Pick<
  CostEstimateViewModel,
  'formattedQuantity' | 'formattedUnitCost' | 'hasDetails' | 'unit'
> {
  return {
    formattedQuantity: formatQuantity(props.numericQuantity, unit),
    formattedUnitCost: UNIT_COST_FORMATTER.format(props.sourceUnitCost ?? 0),
    hasDetails: props.sourceUnitCost !== undefined && props.numericQuantity > 0,
    unit,
  }
}

function getEstimatedCostLabel(
  {
    estimatedCost,
    selectedProductUnit,
    selectedStockError,
    selectedStockLoading,
  }: CostEstimateProps,
  formatCurrency: (amount: number) => string,
) {
  const hasSelectedProduct = selectedProductUnit !== undefined
  if (selectedStockError && hasSelectedProduct)
    return 'Não foi possível carregar o custo.'
  if (selectedStockLoading && hasSelectedProduct) return 'Carregando…'
  if (estimatedCost === undefined) return 'Não disponível'
  return formatCurrency(estimatedCost)
}
