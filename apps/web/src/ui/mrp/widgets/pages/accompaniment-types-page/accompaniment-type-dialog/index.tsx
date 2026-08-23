import type { AccompanimentTypeListItem } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useAccompanimentTypeDialog } from './use-accompaniment-type-dialog'

export type AccompanimentTypeDialogProps = {
  item?: AccompanimentTypeListItem
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
}

export const AccompanimentTypeDialog = ({
  item,
  onOpenChange,
  onSuccess,
  open,
}: AccompanimentTypeDialogProps) => {
  const form = useAccompanimentTypeDialog({ item, onSuccess, open })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name={form.isEdit ? 'pencil' : 'plus'} />
          </span>
          <div>
            <DialogTitle>
              {form.isEdit
                ? 'Editar tipo de acompanhamento'
                : 'Novo tipo de acompanhamento'}
            </DialogTitle>
            <DialogDescription className='mt-1'>
              {form.isEdit
                ? 'Atualize o nome usado para classificar acompanhamentos.'
                : 'Crie uma opção para classificar acompanhamentos.'}
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='grid gap-4 p-6' onSubmit={form.handleSubmit}>
          <Label className='grid gap-2 font-bold'>
            Nome do tipo
            <Input
              {...form.register('name')}
              aria-label='Nome do tipo'
              placeholder='Ex.: Cobertura'
            />
            <p className='text-xs font-normal text-muted-foreground'>
              Use um nome único e fácil de reconhecer no PDV.
            </p>
          </Label>
          {form.errors.name ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {form.errors.name.message}
            </p>
          ) : null}
          <div className='rounded-xl bg-primary-soft p-3 text-sm text-primary'>
            <Icon className='mr-2 inline size-4' name='info' />
            {form.isEdit
              ? 'A alteração será aplicada a todos os vínculos que usam este tipo.'
              : 'O tipo ficará disponível em todos os vínculos de acompanhamento desta sorveteria.'}
          </div>
          {form.actionError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {form.actionError}
            </p>
          ) : null}
          <DialogFooter className='-mx-6 -mb-6'>
            <Button
              disabled={form.isPending}
              onClick={() => onOpenChange(false)}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
            <Button disabled={form.isPending} type='submit'>
              {form.isPending
                ? 'Salvando…'
                : form.isEdit
                  ? 'Salvar alterações'
                  : 'Adicionar tipo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
