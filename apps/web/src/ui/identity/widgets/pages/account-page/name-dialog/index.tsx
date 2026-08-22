import type { RefObject } from 'react'
import type { UseFormRegister } from 'react-hook-form'

import { Icon } from '@/ui/shared/widgets/components/icon'
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

export type NameDialogProps = {
  error: string | null
  feedbackRef: RefObject<HTMLParagraphElement | null>
  handleNameDialogOpenChange: (isOpen: boolean) => void
  handleNameSubmit: () => void
  isNameDialogOpen: boolean
  isPending: boolean
  register: UseFormRegister<{ name: string }>
}

export const NameDialog = ({
  error,
  feedbackRef,
  handleNameDialogOpenChange,
  handleNameSubmit,
  isNameDialogOpen,
  isPending,
  register,
}: NameDialogProps) => {
  return (
    <Dialog open={isNameDialogOpen} onOpenChange={handleNameDialogOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='pencil' className='size-5' />
          </span>
          <div className='min-w-0'>
            <DialogTitle>Corrigir meu nome</DialogTitle>
            <DialogDescription className='mt-1'>
              Atualize o nome exibido na sua conta.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='grid gap-4 p-6' onSubmit={handleNameSubmit}>
          <Label className='grid gap-2 text-xs font-extrabold'>
            Nome completo
            <Input
              {...register('name')}
              aria-invalid={Boolean(error)}
              autoFocus
              className='h-12 rounded-xl px-3 text-sm font-semibold'
            />
          </Label>
          <div className='flex items-start gap-2.5 rounded-xl bg-info-soft px-3.5 py-3 text-xs font-semibold leading-[1.35] text-info'>
            <Icon name='clock' className='mt-0.5 size-4 shrink-0' />
            <p>
              A alteração vale para usos futuros. Registros anteriores preservam o nome
              usado na época.
            </p>
          </div>
          {error ? (
            <p
              ref={feedbackRef}
              className='text-sm font-semibold text-destructive'
              role='alert'
              tabIndex={-1}
            >
              {error}
            </p>
          ) : null}
          <DialogFooter className='-mx-6 -mb-6 bg-card p-4 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              className='h-10 rounded-lg px-5 font-bold'
              onClick={() => handleNameDialogOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              className='h-10 rounded-lg px-5 font-bold shadow-primary'
              disabled={isPending}
            >
              <Icon name='check' className='size-4' />
              {isPending ? 'Salvando…' : 'Salvar alteração'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
