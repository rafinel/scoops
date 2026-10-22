import { Icon } from '@/ui/shared/widgets/components/icon'

import { CostEstimateContent } from '../cost-estimate-content'

export type CostEstimateCardProps = {
  estimate: string
  formattedQuantity: string
  formattedUnitCost: string
  hasDetails: boolean
  unit: string
}

export const CostEstimateCard = ({
  estimate,
  formattedQuantity,
  formattedUnitCost,
  hasDetails,
  unit,
}: CostEstimateCardProps) => (
  <div className='flex items-center gap-3 rounded-xl bg-muted p-4 text-sm'>
    <Icon className='size-5 text-muted-foreground' name='calculator' />
    <CostEstimateContent
      estimate={estimate}
      formattedQuantity={formattedQuantity}
      formattedUnitCost={formattedUnitCost}
      hasDetails={hasDetails}
      unit={unit}
    />
  </div>
)
