import { CostEstimateCard } from './cost-estimate-card'
import { type CostEstimateProps, useCostEstimate } from './use-cost-estimate'

export type { CostEstimateProps }

export const CostEstimate = (props: CostEstimateProps) => {
  const { estimate, formattedQuantity, formattedUnitCost, hasDetails, unit } =
    useCostEstimate(props)

  return (
    <CostEstimateCard
      estimate={estimate}
      formattedQuantity={formattedQuantity}
      formattedUnitCost={formattedUnitCost}
      hasDetails={hasDetails}
      unit={unit}
    />
  )
}
