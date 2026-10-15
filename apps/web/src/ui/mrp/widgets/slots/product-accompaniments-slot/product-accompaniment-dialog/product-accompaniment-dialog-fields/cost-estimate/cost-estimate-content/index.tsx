import { CostEstimateDetails } from '../cost-estimate-details'
import { CostEstimateValue } from '../cost-estimate-value'
import type { CostEstimateViewModel } from '../use-cost-estimate'
import type { ProductAccompanimentDialogState } from '../../../use-product-accompaniment-dialog'

export type CostEstimateContentProps = {
  estimate: CostEstimateViewModel
  state: ProductAccompanimentDialogState
}

export const CostEstimateContent = ({ estimate, state }: CostEstimateContentProps) => (
  <div className='flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
    <CostEstimateValue estimate={estimate.estimate} />
    <CostEstimateDetails
      formattedQuantity={estimate.formattedQuantity}
      formattedUnitCost={estimate.formattedUnitCost}
      state={state}
      unit={estimate.unit}
    />
  </div>
)
