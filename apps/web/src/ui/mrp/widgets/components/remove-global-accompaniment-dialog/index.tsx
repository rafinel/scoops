import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { AlertDialog, AlertDialogContent } from '@/ui/shadcn/alert-dialog'

import { RemovalHeader } from './removal-header'
import { RemovalActions } from './removal-actions'
import { RemovalConsequence } from './removal-consequence'
import { RemovalScopeField } from './removal-scope-field'
import { useRemoveGlobalAccompanimentDialog } from './use-remove-global-accompaniment-dialog'

export type RemoveGlobalAccompanimentDialogProps = {
  accompanimentName?: string
  isScopeLocked?: boolean
  item?: ProductAccompanimentDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  portionName?: string
  productId: string
}

export const RemoveGlobalAccompanimentDialog = (
  props: RemoveGlobalAccompanimentDialogProps,
) => {
  const { isScopeLocked = false, onOpenChange, open } = props
  const name = props.item?.accompanimentProductName ?? props.accompanimentName ?? ''
  const {
    actionError,
    actionLabel,
    consequence,
    description,
    helpText,
    isPending,
    removeAll,
    handleConfirm,
    handleRemoveAllChange,
  } = useRemoveGlobalAccompanimentDialog({
    ...props,
    isScopeLocked,
    itemId: props.item?.id,
    itemName: name,
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='w-[calc(100%-2rem)] data-[size=default]:max-w-[480px] data-[size=default]:sm:max-w-[480px]'>
        <RemovalHeader description={description} name={name} />
        <div className='grid gap-3 px-6 pt-0'>
          <RemovalScopeField
            helpText={helpText}
            isDisabled={isPending}
            isLocked={isScopeLocked}
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
