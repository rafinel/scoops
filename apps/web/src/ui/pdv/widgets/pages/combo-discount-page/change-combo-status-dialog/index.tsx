import type { Combo } from '@scoops/core/pdv/domain/entities'
import type { DiscountStatus } from '@scoops/core/pdv/domain/structures'

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

import { useChangeComboStatusDialog } from './use-change-combo-status-dialog'

export type ChangeComboStatusDialogViewProps = {
  combo: Combo
  expectedUpdatedAt: Date
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void | Promise<void>
  open: boolean
  targetStatus: DiscountStatus
}

export const ChangeComboStatusDialog = ({
  combo,
  expectedUpdatedAt,
  onOpenChange,
  onSuccess,
  open,
  targetStatus,
}: ChangeComboStatusDialogViewProps) => {
  const { actionError, handleConfirm, isPending } = useChangeComboStatusDialog({
    combo,
    expectedUpdatedAt,
    onSuccess,
    targetStatus,
  })
  const isInactivating = targetStatus === 'inactive'

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className='sm:max-w-[440px]'>
        <AlertDialogHeader className='p-6 pr-14'>
          <AlertDialogMedia
            className={
              isInactivating
                ? 'bg-destructive/10 text-destructive'
                : 'bg-success-soft text-success'
            }
          >
            <Icon name={isInactivating ? 'link-off' : 'circle-check'} />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isInactivating ? 'Inativar combo?' : 'Reativar combo?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isInactivating
              ? `O combo ${combo.name} não aparecerá em novas vendas. O histórico será preservado.`
              : `O combo ${combo.name} voltará a aparecer no PDV, desde que seus produtos estejam disponíveis.`}
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
            variant={isInactivating ? 'destructive' : 'default'}
          >
            <Icon name={isInactivating ? 'link-off' : 'circle-check'} />
            {isPending
              ? 'Salvando…'
              : isInactivating
                ? 'Inativar combo'
                : 'Reativar combo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
