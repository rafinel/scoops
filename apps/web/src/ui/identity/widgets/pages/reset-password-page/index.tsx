import { AuthLayout } from '@/ui/identity/widgets/layouts/auth-layout'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { MIN_PASSWORD_LENGTH, useResetPasswordPage } from './use-reset-password-page'

export const ResetPasswordPage = () => {
  const controller = useResetPasswordPage()

  return (
    <AuthLayout
      visual={
        controller.isResolving
          ? 'new-password'
          : !controller.isPasswordRecovery
            ? 'invalid-recovery'
            : controller.isSuccess
              ? 'password-updated'
              : 'new-password'
      }
    >
      <header>
        <h1 className='text-2xl font-extrabold tracking-tight'>Definir nova senha</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Escolha uma senha entre 8 e 64 caracteres.
        </p>
      </header>

      {controller.isResolving ? (
        <p
          aria-live='polite'
          className='mt-6 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground'
          role='status'
        >
          Validando seu link de recuperação…
        </p>
      ) : !controller.isPasswordRecovery ? (
        <div className='mt-6 space-y-4' role='alert'>
          <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
            Este link de recuperação expirou ou não é válido.
          </p>
          <Anchor
            className='block text-center text-sm font-bold text-primary underline-offset-4 hover:underline'
            route='forgotPassword'
          >
            Solicitar novo link
          </Anchor>
        </div>
      ) : controller.isSuccess ? (
        <p
          className='mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm'
          role='status'
        >
          Sua senha foi atualizada. Redirecionando para entrar…
        </p>
      ) : (
        <form className='mt-6 space-y-4' onSubmit={controller.handleSubmit} noValidate>
          {controller.validationError ? (
            <p
              className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'
              role='alert'
            >
              {controller.validationError}
            </p>
          ) : null}
          {controller.actionError ? (
            <p
              className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'
              role='alert'
            >
              Não foi possível atualizar sua senha. Solicite um novo link e tente
              novamente.
            </p>
          ) : null}
          <div className='space-y-2'>
            <label className='text-sm font-bold' htmlFor='new-password'>
              Nova senha
            </label>
            <div className='relative'>
              <input
                autoComplete='new-password'
                className='min-h-11 w-full rounded-lg border bg-background px-3 pr-12 text-sm'
                id='new-password'
                minLength={MIN_PASSWORD_LENGTH}
                name='new-password'
                onChange={(event) => controller.handlePasswordChange(event.target.value)}
                required
                type={controller.isPasswordVisible ? 'text' : 'password'}
                value={controller.password}
              />
              <button
                aria-label={
                  controller.isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'
                }
                aria-pressed={controller.isPasswordVisible}
                className='absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50'
                disabled={controller.isPending}
                onClick={controller.handleTogglePasswordVisibility}
                type='button'
              >
                <Icon
                  className='size-[18px]'
                  name={controller.isPasswordVisible ? 'eye-off' : 'eye'}
                />
              </button>
            </div>
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-bold' htmlFor='confirm-password'>
              Confirmar nova senha
            </label>
            <div className='relative'>
              <input
                autoComplete='new-password'
                className='min-h-11 w-full rounded-lg border bg-background px-3 pr-12 text-sm'
                id='confirm-password'
                minLength={MIN_PASSWORD_LENGTH}
                name='confirm-password'
                onChange={(event) =>
                  controller.handleConfirmationChange(event.target.value)
                }
                required
                type={controller.isConfirmationVisible ? 'text' : 'password'}
                value={controller.confirmation}
              />
              <button
                aria-label={
                  controller.isConfirmationVisible ? 'Ocultar senha' : 'Mostrar senha'
                }
                aria-pressed={controller.isConfirmationVisible}
                className='absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50'
                disabled={controller.isPending}
                onClick={controller.handleToggleConfirmationVisibility}
                type='button'
              >
                <Icon
                  className='size-[18px]'
                  name={controller.isConfirmationVisible ? 'eye-off' : 'eye'}
                />
              </button>
            </div>
          </div>
          <button
            className='min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground shadow-primary disabled:opacity-60'
            disabled={controller.isPending}
            type='submit'
          >
            {controller.isPending ? 'Atualizando…' : 'Atualizar senha'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
