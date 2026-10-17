import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { RemovalActions } from './removal-actions'
import { RemovalConsequence } from './removal-consequence'
import { RemovalScopeField } from './removal-scope-field'
import { useRemoveGlobalAccompanimentDialog } from './use-remove-global-accompaniment-dialog'

export type RemoveGlobalAccompanimentDialogProps = {
  item: ProductAccompanimentDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  portionName?: string
  productId: string
}

export const RemoveGlobalAccompanimentDialog = ({
  item,
  onOpenChange,
  onSuccess,
  open,
  portionName,
  productId,
}: RemoveGlobalAccompanimentDialogProps) => {
  const {
    actionError,
    actionLabel,
    consequence,
    helpText,
    isPending,
    removeAll,
    handleConfirm,
    handleRemoveAllChange,
  } = useRemoveGlobalAccompanimentDialog({
    itemId: item.id,
    itemName: item.accompanimentProductName,
    onSuccess,
    open,
    portionName,
    productId,
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='w-[calc(100%-2rem)] data-[size=default]:max-w-[480px] data-[size=default]:sm:max-w-[480px]'>
        <AlertDialogHeader className='p-6 pr-14'>
          <AlertDialogMedia className='size-11 rounded-xl bg-danger-soft text-danger'>
            <Icon name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle>Remover {item.accompanimentProductName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {item.accompanimentProductName} é um acompanhamento global. Escolha onde ele
            deve ser removido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='grid gap-3 px-6 pt-0'>
          <RemovalScopeField
            helpText={helpText}
            isDisabled={isPending}
            onRemoveAllChange={handleRemoveAllChange}
            removeAll={removeAll}
          />
          <RemovalConsequence consequence={consequence} removeAll={removeAll} />
          {actionError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {actionError}
            </p>
          ) : null}
        </div>
        <RemovalActions
          actionLabel={actionLabel}
          isPending={isPending}
          onConfirm={() => void handleConfirm()}
          removeAll={removeAll}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
