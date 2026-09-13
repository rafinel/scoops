import type { Product } from '@scoops/core/mrp/domain/entities'
import type { ProductRemovalImpact } from '@scoops/core/mrp/domain/structures'

import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type RemoveProductDialogHeaderProps = {
  impact: ProductRemovalImpact | undefined
  isRefreshing: boolean
  product: Product
}

export const RemoveProductDialogHeader = ({
  impact,
  isRefreshing,
  product,
}: RemoveProductDialogHeaderProps) => {
  return (
    <>
      <DialogHeader className='grid gap-3 border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
        <span className='grid size-11 place-items-center rounded-xl bg-danger/10 text-danger'>
          <Icon className='size-5' name='trash-2' />
        </span>
        <div>
          <DialogTitle>Remover produto?</DialogTitle>
          <DialogDescription className='mt-1'>
            {impact?.productName ?? product.name} será removido do catálogo.
          </DialogDescription>
        </div>
      </DialogHeader>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </>
  )
}
