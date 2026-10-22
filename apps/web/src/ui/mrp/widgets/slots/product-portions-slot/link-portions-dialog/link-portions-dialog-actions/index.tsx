import { Button } from '@/ui/shadcn/button'
import { DialogFooter } from '@/ui/shadcn/dialog'

export type LinkPortionsDialogActionsProps = {
  canSubmit: boolean
  isPending: boolean
  onCancel: () => void
  submitLabel: string
}

export const LinkPortionsDialogActions = ({
  canSubmit,
  isPending,
  onCancel,
  submitLabel,
}: LinkPortionsDialogActionsProps) => (
  <DialogFooter className='p-4 sm:p-6'>
    <Button disabled={isPending} onClick={onCancel} type='button' variant='outline'>
      Cancelar
    </Button>
    <Button disabled={isPending || !canSubmit} type='submit'>
      {isPending ? 'Vinculando…' : submitLabel}
    </Button>
  </DialogFooter>
)
