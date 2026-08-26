import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

import { Button } from '@/ui/shadcn/button'
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

import { useChangeSalesChannelStatusDialog } from './use-change-sales-channel-status-dialog'

export type ChangeSalesChannelStatusDialogProps = {
  channel: SalesChannel
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  open: boolean
}

export const ChangeSalesChannelStatusDialog = ({
  channel,
  onOpenChange,
  onSuccess,
  open,
}: ChangeSalesChannelStatusDialogProps) => {
  const { actionError, handleConfirm, isPending } = useChangeSalesChannelStatusDialog({
    channel,
    onSuccess,
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='sm:max-w-[440px]'>
        <AlertDialogHeader className='p-6 pr-14'>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <Icon name='link-off' />
          </AlertDialogMedia>
          <AlertDialogTitle>Inativar canal?</AlertDialogTitle>
          <AlertDialogDescription>
            O canal {channel.name} não aparecerá em novas vendas. Os pedidos já
            registrados continuarão no histórico.
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
          <AlertDialogCancel disabled={isPending} render={<Button variant='outline' />}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              void handleConfirm()
            }}
            variant='destructive'
          >
            <Icon name='link-off' />
            {isPending ? 'Inativando…' : 'Inativar canal'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
