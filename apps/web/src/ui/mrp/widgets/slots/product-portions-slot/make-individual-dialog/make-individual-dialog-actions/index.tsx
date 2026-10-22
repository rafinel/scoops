import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type MakeIndividualDialogActionsProps = {
  isPending: boolean
  onConfirm: () => void
}

export const MakeIndividualDialogActions = ({
  isPending,
  onConfirm,
}: MakeIndividualDialogActionsProps) => (
  <AlertDialogFooter className='border-t-0 bg-transparent px-6 pt-5 pb-6'>
    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
    <AlertDialogAction
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault()
        onConfirm()
      }}
    >
      <Icon name='link' />
      {isPending ? 'Convertendo…' : 'Tornar individual'}
    </AlertDialogAction>
  </AlertDialogFooter>
)
