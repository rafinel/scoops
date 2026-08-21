import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { correctNameFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
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

type CorrectNameFormValues = z.infer<typeof correctNameFormSchema>

export type ActionDialogProps = {
  open: boolean
  title: string
  message: string
  pending: boolean
  error?: Error | null
  confirmLabel?: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}
export const ActionDialog = ({
  open,
  title,
  message,
  pending,
  error,
  confirmLabel = 'Confirmar',
  danger,
  onClose,
  onConfirm,
}: ActionDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader className='place-items-start gap-1.5 border-b border-border-soft p-6 pr-14 text-left'>
          <span
            className={`mb-2 grid size-11 shrink-0 place-items-center rounded-xl ${
              danger ? 'bg-danger-soft text-danger' : 'bg-accent text-primary'
            }`}
          >
            <Icon name={danger ? 'triangle-alert' : 'shield-check'} className='size-5' />
          </span>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className='text-sm leading-5'>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className='px-6 pt-4 text-sm text-destructive' role='alert'>
            {error.message}
          </p>
        ) : null}
        <AlertDialogFooter className='sm:flex-row sm:justify-end'>
          <AlertDialogCancel
            className='min-h-10 rounded-lg px-4 font-bold'
            onClick={onClose}
          >
            Cancelar
          </AlertDialogCancel>
          <Button
            variant={danger ? 'destructive' : 'default'}
            className='min-h-10 rounded-lg px-4 font-bold'
            disabled={pending}
            onClick={() => void onConfirm()}
            type='button'
          >
            {pending ? 'Salvando…' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export type CorrectNameDialogProps = {
  open: boolean
  initialName: string
  pending: boolean
  error?: Error | null
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}
export const CorrectNameDialog = ({
  open,
  initialName,
  pending,
  error,
  onClose,
  onSubmit,
}: CorrectNameDialogProps) => {
  const {
    register,
    reset,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<CorrectNameFormValues>({
    defaultValues: { name: initialName },
    resolver: zodResolver(correctNameFormSchema),
  })

  useEffect(() => {
    if (open) reset({ name: initialName })
  }, [initialName, open, reset])

  async function handleSubmit({ name }: CorrectNameFormValues) {
    await onSubmit(name.trim())
  }
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader className='border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='pencil' className='size-5' />
          </span>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription className='leading-5'>
            Atualize o nome exibido desta conta.
          </DialogDescription>
        </DialogHeader>
        <form className='p-6' onSubmit={submitForm(handleSubmit)} noValidate>
          <Label className='grid gap-1.5 text-sm font-bold'>
            Nome
            <Input
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              className='min-h-11 rounded-lg bg-card px-3'
            />
          </Label>
          {errors.name ? (
            <p className='mt-3 text-sm text-destructive' role='alert'>
              {errors.name.message}
            </p>
          ) : null}
          {error ? (
            <p className='mt-3 text-sm text-destructive' role='alert'>
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
              {pending ? 'Salvando…' : 'Salvar nome'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
