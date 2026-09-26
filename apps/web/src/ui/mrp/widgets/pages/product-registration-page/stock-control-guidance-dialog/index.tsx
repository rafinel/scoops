import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type StockControlGuidanceDialogProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const StockControlGuidanceDialog = ({
  onOpenChange,
  open,
}: StockControlGuidanceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='flex-row items-start gap-6 border-b border-border-soft p-6 pr-14'>
          <Icon className='mt-1 size-5 shrink-0 text-primary' name='info' />
          <div className='min-w-0'>
            <DialogTitle>Controle de estoque</DialogTitle>
            <DialogDescription className='mt-1'>
              Escolha como organizar o saldo deste produto.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className='grid gap-3 px-6 py-4'>
          <div className='flex items-start gap-3 rounded-xl border border-border bg-card p-3.5'>
            <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-info-soft text-info'>
              <Icon className='size-5' name='box' />
            </span>
            <div className='min-w-0'>
              <h3 className='text-sm font-extrabold text-foreground'>Estoque único</h3>
              <p className='mt-1 text-sm leading-5 font-medium text-muted-foreground'>
                Use quando não precisa separar quantidades por marca. Todas as entradas e
                baixas atualizam o mesmo saldo do produto.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 rounded-xl border border-border bg-card p-3.5'>
            <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-info-soft text-info'>
              <Icon name='layers-3' className='size-5' />
            </span>
            <div className='min-w-0'>
              <h3 className='text-sm font-extrabold text-foreground'>Por marca</h3>
              <p className='mt-1 text-sm leading-5 font-medium text-muted-foreground'>
                Use quando precisa acompanhar cada marca separadamente. As entradas e
                baixas ficam ligadas à marca escolhida, e o total soma todas as marcas.
              </p>
            </div>
          </div>

          <div
            className='flex items-start gap-2.5 rounded-xl bg-primary-soft px-3.5 py-3 text-xs leading-5 font-semibold text-primary'
            role='note'
          >
            <Icon name='info' className='mt-0.5 size-4 shrink-0' />
            <p>
              Escolha antes de cadastrar: o modo de estoque não pode ser alterado depois.
            </p>
          </div>
        </div>

        <DialogFooter className='border-t-0 bg-card px-6 pt-0 pb-6 sm:flex-row'>
          <Button
            type='button'
            className='h-10 rounded-lg px-5 font-bold shadow-primary'
            onClick={() => onOpenChange(false)}
          >
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
