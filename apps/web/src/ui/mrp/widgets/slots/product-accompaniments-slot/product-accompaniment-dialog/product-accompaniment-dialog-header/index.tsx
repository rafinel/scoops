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
    <div className='grid gap-2'>
      <DialogHeader className='border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
        <DialogTitle>
          {isEdit ? 'Editar Acompanhamento' : 'Vincular Acompanhamento'}
        </DialogTitle>
        <DialogDescription className='mt-1'>
          {isEdit
            ? 'Atualize como este item aparece no PDV.'
            : 'Configure como este item aparece no PDV.'}
        </DialogDescription>
      </DialogHeader>
      <div className='px-4 sm:px-6'>
        <QueryRefreshStatus isRefreshing={isRefreshing} />
      </div>
    </div>
  )
}
