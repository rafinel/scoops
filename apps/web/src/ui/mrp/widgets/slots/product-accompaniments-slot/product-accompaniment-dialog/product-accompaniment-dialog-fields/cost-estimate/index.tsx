import { CostEstimateCard } from './cost-estimate-card'
import { type CostEstimateProps, useCostEstimate } from './use-cost-estimate'

export type { CostEstimateProps }

export const CostEstimate = ({ item, state }: CostEstimateProps) => {
  const estimate = useCostEstimate({ item, state })
  return <CostEstimateCard estimate={estimate} state={state} />
}
