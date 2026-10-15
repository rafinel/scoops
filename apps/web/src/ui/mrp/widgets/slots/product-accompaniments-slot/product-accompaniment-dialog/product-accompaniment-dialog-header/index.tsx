import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
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
      <DialogHeader className='border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
        <DialogTitle>
          {isEdit ? 'Editar acompanhamento' : 'Vincular acompanhamento'}
        </DialogTitle>
        <DialogDescription className='mt-1'>
          Configure como este item aparece no PDV.
        </DialogDescription>
      </DialogHeader>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </>
  )
}
