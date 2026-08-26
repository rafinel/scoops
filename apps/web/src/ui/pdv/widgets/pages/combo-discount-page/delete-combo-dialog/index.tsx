import type { Combo } from '@scoops/core/pdv/domain/entities'

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

import { useDeleteComboDialog } from './use-delete-combo-dialog'

export type DeleteComboDialogProps = {
  combo: Combo
  expectedUpdatedAt: Date
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  open: boolean
}

export const DeleteComboDialog = ({
  combo,
  expectedUpdatedAt,
  onOpenChange,
  onSuccess,
  open,
}: DeleteComboDialogProps) => {
  const { actionError, handleConfirm, isPending } = useDeleteComboDialog({
    combo,
    expectedUpdatedAt,
    onSuccess,
  })

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className='sm:max-w-[440px]'>
        <AlertDialogHeader className='p-6 pr-14'>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <Icon name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir combo?</AlertDialogTitle>
          <AlertDialogDescription>
            O combo {combo.name} será excluído. O histórico de vendas será preservado e os
            pedidos em aberto serão revalidados.
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
            <Icon name='trash-2' />
            {isPending ? 'Excluindo…' : 'Excluir combo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
