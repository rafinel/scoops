import type { AccompanimentTypeListItem } from '@scoops/core/mrp/domain/structures'

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

import { useRemoveAccompanimentTypeDialog } from './use-remove-accompaniment-type-dialog'

export type RemoveAccompanimentTypeDialogProps = {
  item: AccompanimentTypeListItem
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
}

export const RemoveAccompanimentTypeDialog = ({
  item,
  onOpenChange,
  onSuccess,
  open,
}: RemoveAccompanimentTypeDialogProps) => {
  const dialog = useRemoveAccompanimentTypeDialog({ onSuccess, typeId: item.type.id })
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className='p-6'>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <Icon name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle>Remover tipo de acompanhamento?</AlertDialogTitle>
          <AlertDialogDescription>
            O tipo {item.type.name} será removido permanentemente. Tipos em uso não podem
            ser removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {dialog.actionError ? (
          <p className='px-6 pb-4 text-sm font-semibold text-destructive' role='alert'>
            {dialog.actionError}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={dialog.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={dialog.isPending}
            onClick={(event) => {
              event.preventDefault()
              void dialog.handleConfirm()
            }}
            variant='destructive'
          >
            {dialog.isPending ? 'Removendo…' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
