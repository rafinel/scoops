import { Icon } from '@/ui/shared/widgets/components/icon'

import { CostEstimateContent } from '../cost-estimate-content'
import type { CostEstimateViewModel } from '../use-cost-estimate'
import type { ProductAccompanimentDialogState } from '../../../use-product-accompaniment-dialog'

export type CostEstimateCardProps = {
  estimate: CostEstimateViewModel
  state: ProductAccompanimentDialogState
}

export const CostEstimateCard = ({ estimate, state }: CostEstimateCardProps) => (
  <div className='flex items-center gap-3 rounded-xl bg-muted p-4 text-sm'>
    <Icon className='size-5 text-muted-foreground' name='calculator' />
    <CostEstimateContent estimate={estimate} state={state} />
  </div>
)
