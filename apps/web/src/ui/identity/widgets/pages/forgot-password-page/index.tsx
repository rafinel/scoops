import { AuthLayout } from '@/ui/identity/widgets/layouts/auth-layout'
import { useForgotPasswordPage } from './use-forgot-password-page'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

export const ForgotPasswordPage = () => {
  const {
    error,
    isPending,
    isSubmitted,
    validationError,
    handleRequestAgain,
    handleSubmit,
    register,
  } = useForgotPasswordPage()
  const hasError = Boolean(validationError || error)

  return (
    <AuthLayout visual={isSubmitted ? 'verify-email' : 'recovery'}>
      <section aria-labelledby='forgot-password-title'>
        <p className='text-xs font-extrabold uppercase tracking-[0.16em] text-primary'>
          Recuperar acesso
        </p>
        <h1
          id='forgot-password-title'
          className='mt-3 text-3xl font-extrabold tracking-tight'
        >
          Recupere seu acesso
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Informe seu email e enviaremos as instruções para definir uma nova senha.
        </p>

        {isSubmitted ? (
          <div className='mt-8 space-y-5' role='status' aria-live='polite'>
            <div className='rounded-lg border bg-accent p-4'>
              <h2 className='text-sm font-extrabold'>
                Confira seu email para continuar.
              </h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                Se houver uma conta para este endereço, você receberá um link de
                recuperação.
              </p>
            </div>
            <Anchor
              route='login'
              className='block text-center text-sm font-extrabold text-primary underline-offset-4 hover:underline'
            >
              Voltar para entrar
            </Anchor>
            <Button
              type='button'
              onClick={handleRequestAgain}
              variant='outline'
              className='h-12 w-full bg-card px-4 text-sm font-extrabold hover:bg-muted'
            >
              Tentar com outro email
            </Button>
          </div>
        ) : (
          <form className='mt-8 space-y-5' onSubmit={handleSubmit} noValidate>
            <div>
              <Label className='mb-2 block text-sm font-bold' htmlFor='recovery-email'>
                Email
              </Label>
              <Input
                {...register('email')}
                id='recovery-email'
                name='email'
                type='email'
                autoComplete='email'
                inputMode='email'
                className='h-12 rounded-md bg-card px-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-ring/25'
                placeholder='voce@empresa.com'
                disabled={isPending}
                required
              />
            </div>
            {hasError && (
              <p
                className='rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive'
                role='alert'
              >
                {validationError ??
                  'Não foi possível enviar o email agora. Tente novamente.'}
              </p>
            )}
            <Button
              type='submit'
              className='h-12 w-full rounded-md px-4 text-sm font-extrabold shadow-primary hover:brightness-105'
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? 'Enviando…' : 'Enviar instruções'}
            </Button>
            <Anchor
              route='login'
              className='block text-center text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
            >
              Voltar para entrar
            </Anchor>
          </form>
        )}
      </section>
    </AuthLayout>
  )
}
