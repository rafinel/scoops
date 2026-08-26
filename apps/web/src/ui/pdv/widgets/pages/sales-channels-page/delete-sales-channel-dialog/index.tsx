import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useDeleteSalesChannelDialog } from './use-delete-sales-channel-dialog'

export type DeleteSalesChannelDialogProps = {
  channel: SalesChannel
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  open: boolean
}

export const DeleteSalesChannelDialog = ({
  channel,
  onOpenChange,
  onSuccess,
  open,
}: DeleteSalesChannelDialogProps) => {
  const { actionError, handleConfirm, isPending } = useDeleteSalesChannelDialog({
    channel,
    onSuccess,
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='sm:max-w-[440px]'>
        <AlertDialogHeader className='p-6 pr-14'>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <Icon name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir canal?</AlertDialogTitle>
          <AlertDialogDescription>
            O canal será removido das novas vendas. Os pedidos já registrados continuarão
            no histórico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {actionError ? (
          <p
            aria-live='assertive'
            className='px-6 pb-4 text-sm font-semibold text-destructive'
            role='alert'
          >
            {actionError}
          </p>
        ) : null}
        <AlertDialogFooter className='border-0 bg-transparent p-6 pt-0'>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              void handleConfirm()
            }}
            variant='destructive'
          >
            <Icon name='trash-2' />
            {isPending ? 'Excluindo…' : 'Excluir canal'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
