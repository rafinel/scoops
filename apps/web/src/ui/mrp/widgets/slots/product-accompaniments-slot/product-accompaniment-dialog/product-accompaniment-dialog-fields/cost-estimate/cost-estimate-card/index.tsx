import { Icon } from '@/ui/shared/widgets/components/icon'

import { CostEstimateContent } from '../cost-estimate-content'
import type { CostEstimateViewModel } from '../use-cost-estimate'

export type CostEstimateCardProps = {
  estimate: CostEstimateViewModel
}

export const CostEstimateCard = ({ estimate }: CostEstimateCardProps) => (
  <div className='flex items-center gap-3 rounded-xl bg-muted p-4 text-sm'>
    <Icon className='size-5 text-muted-foreground' name='calculator' />
    <CostEstimateContent estimate={estimate} />
  </div>
)
