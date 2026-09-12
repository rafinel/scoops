import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type ProductAccompanimentDialogHeaderProps = {
  isEdit: boolean
  isRefreshing: boolean
}

export const ProductAccompanimentDialogHeader = ({
  isEdit,
  isRefreshing,
}: ProductAccompanimentDialogHeaderProps) => {
  return (
    <>
      <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
          <Icon name={isEdit ? 'pencil' : 'plus'} />
        </span>
        <div>
          <DialogTitle>
            {isEdit ? 'Editar acompanhamento' : 'Vincular acompanhamento'}
          </DialogTitle>
          <DialogDescription className='mt-1'>
            Configure como este item aparece no PDV.
          </DialogDescription>
        </div>
      </DialogHeader>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </>
  )
}
