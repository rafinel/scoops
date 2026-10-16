import { CostEstimateCard } from './cost-estimate-card'
import { type CostEstimateProps, useCostEstimate } from './use-cost-estimate'

export type { CostEstimateProps }

export const CostEstimate = (props: CostEstimateProps) => {
  const estimate = useCostEstimate(props)
  return <CostEstimateCard estimate={estimate} />
}
