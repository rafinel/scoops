import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Label } from '@/ui/shadcn/label'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type HistoryJustificationDialogProps = {
  onClose: () => void
  selectedJustification: string | null
}

export const HistoryJustificationDialog = ({
  onClose,
  selectedJustification,
}: HistoryJustificationDialogProps) => (
  <Dialog
    open={selectedJustification !== null}
    onOpenChange={(open) => !open && onClose()}
  >
    <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
      <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-5 pr-14 sm:p-6 sm:pr-14'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'>
          <Icon name='clipboard-list' />
        </span>
        <div className='min-w-0'>
          <DialogTitle>Justificativa</DialogTitle>
          <DialogDescription className='mt-1'>
            Detalhes informados nesta movimentação.
          </DialogDescription>
        </div>
      </DialogHeader>
      <div className='p-5 sm:p-6'>
        <Label
          className='grid gap-2 text-sm font-bold'
          htmlFor='transaction-justification'
        >
          Justificativa
          <Textarea
            className='min-h-32 resize-y bg-muted/30 font-medium'
            id='transaction-justification'
            readOnly
            value={selectedJustification ?? ''}
          />
        </Label>
      </div>
      <DialogFooter>
        <DialogClose render={<Button type='button' variant='outline' />}>
          Fechar
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
