import { UserProfile } from '@scoops/core/identity/domain/structures'

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
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { RadioGroup } from '@/ui/shadcn/radio-group'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useUserInviteDialog } from './use-user-invite-dialog'

const profileOptions = [
  {
    value: UserProfile.Operator,
    label: 'Operador',
    description: 'Cuida das vendas e da rotina operacional.',
    icon: 'user-plus' as const,
  },
  {
    value: UserProfile.Manager,
    label: 'Gerente',
    description: 'Gerencia usuários e configurações da sorveteria.',
    icon: 'shield' as const,
  },
]

export type UserInviteDialogProps = {
  open: boolean
  error: Error | null
  isPending: boolean
  onClose: () => void
  onSubmit: (input: {
    name: string
    email: string
    profile: UserProfile
  }) => Promise<void>
}

export const UserInviteDialog = ({
  open,
  error,
  isPending,
  onClose,
  onSubmit,
}: UserInviteDialogProps) => {
  const { handleProfileChange, handleSubmit, profile, errors, register } =
    useUserInviteDialog({ open, onSubmit })

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className='max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl p-0 shadow-dialog sm:max-h-[calc(100vh-3rem)] sm:w-[calc(100%-4.5rem)] sm:max-w-4xl'
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit}>
          <div className='px-6 pt-6 pb-7 sm:px-7 sm:pt-7'>
            <DialogHeader className='flex-row items-start justify-between gap-4'>
              <div className='flex min-w-0 items-start gap-3'>
                <div className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
                  <Icon name='user-plus' className='size-5' />
                </div>
                <div className='min-w-0 pt-0.5'>
                  <DialogTitle className='text-lg text-foreground sm:text-xl'>
                    Novo usuário
                  </DialogTitle>
                  <DialogDescription className='mt-1.5 text-sm leading-5'>
                    Envie um convite para fazer parte da sorveteria.
                  </DialogDescription>
                </div>
              </div>
              <DialogClose
                render={
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label='Fechar'
                    className='size-8 shrink-0 rounded-lg text-muted-foreground'
                  />
                }
              >
                <Icon name='x' className='size-4' />
              </DialogClose>
            </DialogHeader>

            <div className='mt-6 grid gap-4'>
              <Label className='grid gap-1.5 text-sm font-bold'>
                Nome
                <Input
                  {...register('name')}
                  aria-invalid={Boolean(errors.name)}
                  className='min-h-11 rounded-lg bg-card px-3 font-medium'
                />
                {errors.name ? (
                  <span className='text-xs font-semibold text-danger' role='alert'>
                    {errors.name.message}
                  </span>
                ) : null}
              </Label>
              <Label className='grid gap-1.5 text-sm font-bold'>
                E-mail
                <Input
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                  type='email'
                  className='min-h-11 rounded-lg bg-card px-3 font-medium'
                />
                {errors.email ? (
                  <span className='text-xs font-semibold text-danger' role='alert'>
                    {errors.email.message}
                  </span>
                ) : null}
              </Label>
            </div>

            <div className='mt-6'>
              <div className='mb-2 flex items-baseline gap-2'>
                <p className='text-sm font-bold'>Perfil</p>
              </div>
              <RadioGroup
                aria-label='Perfil do usuário'
                value={profile}
                onValueChange={(value) => handleProfileChange(value as UserProfile)}
                className='grid gap-3 sm:grid-cols-2'
              >
                {profileOptions.map((option) => {
                  const isSelected = profile === option.value

                  return (
                    <Button
                      key={option.value}
                      type='button'
                      variant='ghost'
                      role='radio'
                      aria-checked={isSelected}
                      onClick={() => handleProfileChange(option.value)}
                      className={`relative flex min-h-12 h-auto w-full flex-col items-stretch justify-start rounded-xl border p-4 text-left whitespace-normal transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 ${
                        isSelected
                          ? 'border-primary bg-accent hover:bg-accent'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-card'
                      }`}
                    >
                      <span
                        aria-hidden='true'
                        className={`absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-border bg-card'
                        }`}
                      >
                        {isSelected ? (
                          <span className='size-2.5 rounded-full bg-primary-foreground' />
                        ) : null}
                      </span>
                      <div className='flex items-center gap-3 pr-8'>
                        <Icon
                          name={option.icon}
                          className={`size-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <span
                          className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}
                        >
                          {option.label}
                        </span>
                      </div>
                      <p className='mt-3 max-w-[19rem] text-xs leading-5 text-muted-foreground'>
                        {option.description}
                      </p>
                    </Button>
                  )
                })}
              </RadioGroup>
            </div>

            <div className='mt-5 flex items-center gap-3 rounded-xl bg-info-soft px-4 py-3 text-info'>
              <Icon name='mail-check' className='size-5 shrink-0' />
              <p className='text-sm leading-5 font-semibold'>
                A pessoa receberá um e-mail para confirmar a conta e criar a senha.
              </p>
            </div>

            {error ? (
              <p className='mt-4 text-sm text-destructive' role='alert'>
                {error.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className='flex-col-reverse gap-2 rounded-none bg-card px-6 py-4 sm:flex-row sm:items-center sm:px-7'>
            <Button
              variant='outline'
              className='min-h-10 rounded-lg px-4 text-sm font-bold'
              type='button'
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className='min-h-10 rounded-lg px-4 text-sm font-bold shadow-primary'
              disabled={isPending}
              type='submit'
            >
              <Icon name='send' className='size-4' />
              {isPending ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
