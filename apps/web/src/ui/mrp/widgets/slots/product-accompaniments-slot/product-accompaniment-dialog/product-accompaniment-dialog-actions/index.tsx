import { Button } from '@/ui/shadcn/button'
import { DialogFooter } from '@/ui/shadcn/dialog'

export function ProductAccompanimentDialogActions({
  isEdit,
  isPending,
  onCancel,
  canSave,
}: {
  isEdit: boolean
  isPending: boolean
  onCancel: () => void
  canSave: boolean
}) {
  return (
    <DialogFooter className='p-4 sm:p-6'>
      <Button disabled={isPending} onClick={onCancel} type='button' variant='outline'>
        Cancelar
      </Button>
      <Button disabled={isPending || !canSave} type='submit'>
        {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Vincular'}
      </Button>
    </DialogFooter>
  )
}
