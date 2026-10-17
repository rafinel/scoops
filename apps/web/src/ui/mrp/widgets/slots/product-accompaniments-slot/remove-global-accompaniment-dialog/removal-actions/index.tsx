import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/ui/shadcn/alert-dialog'
import { cn } from '@/ui/shared/lib/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RemovalActionsProps = {
  actionLabel: string
  isPending: boolean
  onConfirm: () => void
  removeAll: boolean
}

export const RemovalActions = ({
  actionLabel,
  isPending,
  onConfirm,
  removeAll,
}: RemovalActionsProps) => (
  <AlertDialogFooter className='border-t-0 bg-transparent px-6 pt-5 pb-6'>
    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
    <AlertDialogAction
      className={cn(
        removeAll
          ? 'bg-danger text-destructive-foreground hover:bg-danger/90'
          : 'border-danger text-danger hover:bg-danger-bg hover:text-danger',
      )}
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault()
        onConfirm()
      }}
      variant={removeAll ? 'default' : 'outline'}
    >
      <Icon name='trash-2' />
      {actionLabel}
    </AlertDialogAction>
  </AlertDialogFooter>
)
