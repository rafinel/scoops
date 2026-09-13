import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type RecipeIngredientDialogHeaderProps = {
  isEdit: boolean
  isRefreshing: boolean
}

export const RecipeIngredientDialogHeader = ({
  isEdit,
  isRefreshing,
}: RecipeIngredientDialogHeaderProps) => {
  return (
    <>
      <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
          <Icon name={isEdit ? 'pencil' : 'plus'} />
        </span>
        <div className='min-w-0'>
          <DialogTitle>
            {isEdit ? 'Editar ingrediente' : 'Adicionar ingrediente'}
          </DialogTitle>
          <DialogDescription className='mt-1'>
            {isEdit
              ? 'Trocar o insumo? Remova esta linha e adicione outra.'
              : 'Compõe a receita e afeta CMV, custo unitário e máximo produzível.'}
          </DialogDescription>
        </div>
      </DialogHeader>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </>
  )
}
