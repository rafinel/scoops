import type { ProductAccompanimentDialogState } from '../../../use-product-accompaniment-dialog'

export type CostEstimateDetailsProps = {
  formattedQuantity: string
  formattedUnitCost: string
  state: ProductAccompanimentDialogState
  unit: string
}

export const CostEstimateDetails = ({
  formattedQuantity,
  formattedUnitCost,
  state,
  unit,
}: CostEstimateDetailsProps) => (
  <p
    className='break-words text-xs text-muted-foreground sm:text-right'
    hidden={state.source?.unitCost === undefined || state.numericQuantity <= 0}
  >
    {formattedQuantity} × R$ {formattedUnitCost}/{unit}
  </p>
)
