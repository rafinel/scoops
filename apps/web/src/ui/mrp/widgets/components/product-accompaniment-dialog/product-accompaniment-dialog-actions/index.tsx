import { Button } from '@/ui/shadcn/button'
import { DialogFooter } from '@/ui/shadcn/dialog'

export type ProductAccompanimentDialogActionsProps = {
  canSave: boolean
  isPending: boolean
  onCancel: () => void
  submitLabel: string
}

export const ProductAccompanimentDialogActions = ({
  canSave,
  isPending,
  onCancel,
  submitLabel,
}: ProductAccompanimentDialogActionsProps) => (
  <DialogFooter className='p-4 sm:p-6'>
    <Button disabled={isPending} onClick={onCancel} type='button' variant='outline'>
      Cancelar
    </Button>
    <Button disabled={isPending || !canSave} type='submit'>
      {isPending ? 'Salvando…' : submitLabel}
    </Button>
  </DialogFooter>
)
