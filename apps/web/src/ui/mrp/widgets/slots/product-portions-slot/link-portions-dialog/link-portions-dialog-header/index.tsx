import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type LinkPortionsDialogHeaderProps = {
  isRefreshing: boolean
}

export const LinkPortionsDialogHeader = ({
  isRefreshing,
}: LinkPortionsDialogHeaderProps) => (
  <div className='grid gap-2'>
    <DialogHeader className='border-b !border-[color:var(--border-soft)] p-4 pr-14 sm:p-6 sm:pr-14'>
      <DialogTitle>Vincular porções</DialogTitle>
      <DialogDescription className='mt-1'>
        Escolha as porções que oferecem este acompanhamento no PDV.
      </DialogDescription>
    </DialogHeader>
    <div className='px-4 sm:px-6'>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </div>
  </div>
)
