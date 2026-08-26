import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DiscountType } from '@scoops/core/pdv/domain/structures'

import { useDiscountTypeDialog } from './use-discount-type-dialog'

export type DiscountTypeDialogProps = {
  onChoose: (type: DiscountType) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const DiscountTypeDialog = ({
  onChoose,
  onOpenChange,
  open,
}: DiscountTypeDialogProps) => {
  const { handleChooseCombo, handleOpenChange } = useDiscountTypeDialog({
    onChoose,
    onOpenChange,
    open,
  })

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[520px]'>
        <DialogHeader className='flex flex-col gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name='tags' className='size-5' />
          </span>
          <DialogTitle className='col-auto text-xl'>Criar desconto</DialogTitle>
          <DialogDescription className='col-auto'>
            Escolha o tipo de desconto para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3 p-6'>
          <button
            className='flex min-h-[76px] items-center gap-4 rounded-xl border border-primary bg-card p-4 text-left transition-colors hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring/40'
            onClick={handleChooseCombo}
            type='button'
          >
            <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
              <Icon name='tags' className='size-5' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block font-extrabold'>Combo</span>
              <span className='mt-1 block text-sm text-muted-foreground'>
                Combine dois ou mais produtos por um preço fixo.
              </span>
            </span>
            <Icon name='arrow' className='size-5 shrink-0 text-primary' />
          </button>
          <button
            aria-disabled='true'
            className='flex min-h-[76px] cursor-not-allowed items-center gap-4 rounded-xl border border-border-soft bg-muted/50 p-4 text-left opacity-60'
            disabled
            type='button'
          >
            <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'>
              <Icon name='sparkles' className='size-5' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block font-extrabold'>Leve X, pague Y</span>
              <span className='mt-1 block text-sm text-muted-foreground'>
                Defina quantos itens o cliente leva e quantos paga.
              </span>
            </span>
            <span className='shrink-0 rounded-full border bg-card px-2 py-1 text-xs font-bold text-muted-foreground'>
              Em breve
            </span>
          </button>
          <button
            aria-disabled='true'
            className='flex min-h-[76px] cursor-not-allowed items-center gap-4 rounded-xl border border-border-soft bg-muted/50 p-4 text-left opacity-60'
            disabled
            type='button'
          >
            <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'>
              <Icon name='credit-card' className='size-5' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block font-extrabold'>Forma de pagamento</span>
              <span className='mt-1 block text-sm text-muted-foreground'>
                Aplique um desconto conforme a forma de pagamento.
              </span>
            </span>
            <span className='shrink-0 rounded-full border bg-card px-2 py-1 text-xs font-bold text-muted-foreground'>
              Em breve
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
