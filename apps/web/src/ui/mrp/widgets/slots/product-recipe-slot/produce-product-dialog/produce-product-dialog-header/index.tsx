import type { Product } from '@scoops/core/mrp/domain/entities'
import type { RecipeDetails } from '@scoops/core/mrp/domain/structures'

import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type ProduceProductDialogHeaderProps = {
  isRefreshing: boolean
  product: Product
  recipe: RecipeDetails
}

export const ProduceProductDialogHeader = ({
  isRefreshing,
  product,
  recipe,
}: ProduceProductDialogHeaderProps) => {
  return (
    <>
      <DialogHeader className='min-w-0 flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
          <Icon name='chef-hat' />
        </span>
        <div className='min-w-0'>
          <DialogTitle>Registrar produção</DialogTitle>
          <DialogDescription className='mt-1'>
            {product.name} · receita de {recipe.yieldQuantity} {product.unit}
          </DialogDescription>
        </div>
      </DialogHeader>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </>
  )
}
