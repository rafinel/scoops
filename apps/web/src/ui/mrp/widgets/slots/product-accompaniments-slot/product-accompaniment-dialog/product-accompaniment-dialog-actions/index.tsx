import { Button } from '@/ui/shadcn/button'
import { DialogFooter } from '@/ui/shadcn/dialog'

export type ProductAccompanimentDialogActionsProps = {
  isEdit: boolean
  isPending: boolean
  onCancel: () => void
  canSave: boolean
}

export const ProductAccompanimentDialogActions = ({
  isEdit,
  isPending,
  onCancel,
  canSave,
}: ProductAccompanimentDialogActionsProps) => (
  <DialogFooter className='p-4 sm:p-6'>
    <Button disabled={isPending} onClick={onCancel} type='button' variant='outline'>
      Cancelar
    </Button>
    <Button disabled={isPending || !canSave} type='submit'>
      {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Vincular'}
    </Button>
  </DialogFooter>
)
