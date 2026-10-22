import { CostEstimateDetails } from '../cost-estimate-details'
import { CostEstimateValue } from '../cost-estimate-value'

export type CostEstimateContentProps = {
  estimate: string
  formattedQuantity: string
  formattedUnitCost: string
  hasDetails: boolean
  unit: string
}

export const CostEstimateContent = ({
  estimate,
  formattedQuantity,
  formattedUnitCost,
  hasDetails,
  unit,
}: CostEstimateContentProps) => (
  <div className='flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
    <CostEstimateValue estimate={estimate} />
    <CostEstimateDetails
      formattedQuantity={formattedQuantity}
      formattedUnitCost={formattedUnitCost}
      hasDetails={hasDetails}
      unit={unit}
    />
  </div>
)
