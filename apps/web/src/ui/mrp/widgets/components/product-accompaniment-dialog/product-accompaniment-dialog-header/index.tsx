import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type ProductAccompanimentDialogHeaderProps = {
  description: string
  isRefreshing: boolean
  title: string
}

export const ProductAccompanimentDialogHeader = ({
  description,
  isRefreshing,
  title,
}: ProductAccompanimentDialogHeaderProps) => {
  return (
    <div className='grid gap-2'>
      <DialogHeader className='border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className='mt-1'>{description}</DialogDescription>
      </DialogHeader>
      <div className='px-4 sm:px-6'>
        <QueryRefreshStatus isRefreshing={isRefreshing} />
      </div>
    </div>
  )
}
