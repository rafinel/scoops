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

import { useInvitationCorrectionDialog } from './use-invitation-correction-dialog'

export type InvitationCorrectionDialogProps = {
  email: string
  error: Error | null
  name: string
  onClose: () => void
  onSubmit: (input: { name: string; email: string }) => Promise<void>
  pending: boolean
}

export const InvitationCorrectionDialog = ({
  email,
  error,
  name,
  onClose,
  onSubmit,
  pending,
}: InvitationCorrectionDialogProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useInvitationCorrectionDialog({ email, name, onSubmit })

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='mail-check' className='size-5' />
          </span>
          <div className='min-w-0'>
            <DialogTitle>Corrigir convite</DialogTitle>
            <DialogDescription className='mt-1 leading-5'>
              Atualize os dados antes de reenviar o convite.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='p-6' onSubmit={handleSubmit} noValidate>
          <div className='grid gap-4'>
            <Label className='grid gap-1.5 text-sm font-bold'>
              Nome
              <Input
                {...register('name')}
                aria-invalid={Boolean(errors.name)}
                className='min-h-11 rounded-lg bg-card px-3'
              />
            </Label>
            <Label className='grid gap-1.5 text-sm font-bold'>
              E-mail
              <Input
                {...register('email')}
                aria-invalid={Boolean(errors.email)}
                className='min-h-11 rounded-lg bg-card px-3'
                type='email'
              />
            </Label>
            {errors.name?.message || errors.email?.message ? (
              <p className='text-sm text-destructive' role='alert'>
                {errors.name?.message ?? errors.email?.message}
              </p>
            ) : null}
          </div>
          {error ? (
            <p className='mt-4 text-sm text-destructive' role='alert'>
              {error.message}
            </p>
          ) : null}
          <DialogFooter className='mt-6 -mx-6 -mb-6 sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              className='min-h-10 rounded-lg px-4 font-bold'
              onClick={onClose}
              type='button'
            >
              Cancelar
            </Button>
            <Button
              className='min-h-10 rounded-lg px-4 font-bold'
              disabled={pending}
              type='submit'
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
