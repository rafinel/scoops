import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

import type { CategoryDependencyDialogProps } from '../use-category-dependency-dialog'

export type CategoryDependencyDialogHeaderProps = CategoryDependencyDialogProps & {
  label: string
}

export const CategoryDependencyDialogHeader = ({
  canRemove,
  isLoading,
  isRefreshing,
  label,
  productName,
}: CategoryDependencyDialogHeaderProps) => {
  return (
    <>
      <DialogHeader className='grid gap-3 border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
        <span className='grid size-11 place-items-center rounded-xl bg-warning/10 text-warning'>
          <Icon className='size-5' name='link' />
        </span>
        <div>
          <DialogTitle>
            {isLoading
              ? 'Verificando vínculos…'
              : canRemove
                ? `Remover categoria ${label}?`
                : `${label} em uso`}
          </DialogTitle>
          <DialogDescription className='mt-1'>
            {isLoading
              ? 'Estamos verificando se existem cadastros que precisam de atenção.'
              : canRemove
                ? `A categoria será removida de ${productName}.`
                : `Revise os cadastros relacionados antes de remover ${label} deste produto.`}
          </DialogDescription>
        </div>
      </DialogHeader>
      <QueryRefreshStatus isRefreshing={Boolean(isRefreshing)} />
    </>
  )
}
