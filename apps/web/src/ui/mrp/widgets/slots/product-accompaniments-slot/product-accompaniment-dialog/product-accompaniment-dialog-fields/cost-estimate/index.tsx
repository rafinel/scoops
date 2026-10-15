import { Icon } from '@/ui/shared/widgets/components/icon'

import { type CostEstimateProps, useCostEstimate } from './use-cost-estimate'

export type { CostEstimateProps }

export const CostEstimate = ({ item, state }: CostEstimateProps) => {
  const { estimate, formattedQuantity, formattedUnitCost, unit } = useCostEstimate({
    item,
    state,
  })

  return (
    <div className='flex items-center gap-3 rounded-xl bg-muted p-4 text-sm'>
      <Icon className='size-5 text-muted-foreground' name='calculator' />
      <div className='flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-xs font-semibold text-muted-foreground'>CUSTO POR PORÇÃO</p>
          <p className='font-extrabold'>{estimate}</p>
        </div>
        {state.source?.unitCost !== undefined && state.numericQuantity > 0 ? (
          <p className='break-words text-xs text-muted-foreground sm:text-right'>
            {formattedQuantity} × R$ {formattedUnitCost}/{unit}
          </p>
        ) : null}
      </div>
    </div>
  )
}
