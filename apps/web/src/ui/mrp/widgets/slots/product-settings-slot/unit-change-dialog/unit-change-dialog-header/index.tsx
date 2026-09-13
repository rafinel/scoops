import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type UnitChangeDialogHeaderProps = {
  isRefreshing: boolean
}

export const UnitChangeDialogHeader = ({ isRefreshing }: UnitChangeDialogHeaderProps) => {
  return (
    <>
      <DialogHeader className='grid gap-3 border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
        <span className='grid size-11 place-items-center rounded-xl bg-warning/10 text-warning'>
          <Icon className='size-5' name='arrow-down-up' />
        </span>
        <div>
          <DialogTitle>Alterar unidade de estoque</DialogTitle>
          <DialogDescription className='mt-1'>
            A nova unidade será aplicada sem alterar os valores numéricos existentes.
          </DialogDescription>
        </div>
      </DialogHeader>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </>
  )
}
