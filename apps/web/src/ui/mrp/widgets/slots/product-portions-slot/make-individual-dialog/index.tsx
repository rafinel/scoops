import { AlertDialog, AlertDialogContent } from '@/ui/shadcn/alert-dialog'

import { MakeIndividualDialogActions } from './make-individual-dialog-actions'
import { MakeIndividualDialogBody } from './make-individual-dialog-body'
import { MakeIndividualDialogHeader } from './make-individual-dialog-header'
import { useMakeIndividualDialog } from './use-make-individual-dialog'

export type MakeIndividualDialogProps = {
  accompanimentName: string
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
}

export const MakeIndividualDialog = (props: MakeIndividualDialogProps) => {
  const { actionError, isPending, handleConfirm } = useMakeIndividualDialog(props)

  return (
    <AlertDialog onOpenChange={props.onOpenChange} open={props.open}>
      <AlertDialogContent className='w-[calc(100%-2rem)] data-[size=default]:max-w-[480px] data-[size=default]:sm:max-w-[480px]'>
        <MakeIndividualDialogHeader accompanimentName={props.accompanimentName} />
        <MakeIndividualDialogBody actionError={actionError} />
        <MakeIndividualDialogActions
          isPending={isPending}
          onConfirm={() => void handleConfirm()}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
