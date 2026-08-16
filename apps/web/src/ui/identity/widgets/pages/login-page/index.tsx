import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { AuthLayout } from '@/ui/identity/widgets/layouts/auth-layout'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { useLoginPage } from './use-login-page'

export type LoginPageProps = {
  returnTo?: string
}

export const LoginPage = ({ returnTo }: LoginPageProps) => {
  const {
    error,
    isPasswordVisible,
    isPending,
    validationError,
    handleSubmit,
    handleTogglePasswordVisibility,
    register,
  } = useLoginPage(returnTo)
  const errorMessage = error
    ? 'Não foi possível entrar. Confira seus dados e tente novamente.'
    : null

  return (
    <AuthLayout visual='login'>
      <section aria-labelledby='login-title' className='flex flex-col gap-[26px]'>
        <div className='flex flex-col gap-2.5'>
          <h1
            id='login-title'
            className='text-[32px] font-extrabold leading-9 tracking-[-1.2px] text-foreground sm:text-[36px] sm:leading-[39px]'
          >
            Entre no Scoops
          </h1>
          <p className='text-[15px] font-medium leading-[23px] text-muted-foreground'>
            Use seu e-mail e sua senha para acessar a sorveteria.
          </p>
        </div>

        <form className='flex flex-col gap-4' onSubmit={handleSubmit} noValidate>
          <div className='flex h-[75px] flex-col'>
            <Label className='text-[13px] font-bold leading-[18px]' htmlFor='login-email'>
              E-mail
            </Label>
            <Input
              {...register('identifier', {
                validate: (value) =>
                  value.trim().length > 0 || 'Informe seu email para continuar.',
              })}
              id='login-email'
              type='email'
              autoComplete='email'
              inputMode='email'
              className='mt-[9px] h-12 rounded-xl bg-card px-[14px] text-sm font-medium text-foreground shadow-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-ring/25'
              placeholder='voce@exemplo.com'
              disabled={isPending}
              required
            />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex h-[75px] flex-col'>
              <Label
                className='text-[13px] font-bold leading-[18px]'
                htmlFor='login-password'
              >
                Senha
              </Label>
              <div className='relative mt-[9px] h-12'>
                <Input
                  {...register('password', {
                    required: 'Informe sua senha para continuar.',
                  })}
                  id='login-password'
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete='current-password'
                  className='h-full rounded-xl bg-card px-[14px] pr-12 text-sm font-medium text-foreground shadow-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-ring/25'
                  placeholder='Digite sua senha'
                  disabled={isPending}
                  required
                />
                <Button
                  aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={isPasswordVisible}
                  className='absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40'
                  disabled={isPending}
                  onClick={handleTogglePasswordVisibility}
                  type='button'
                  variant='ghost'
                >
                  <Icon
                    className='size-[18px]'
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                  />
                </Button>
              </div>
            </div>
            <div className='flex justify-end'>
              <Anchor
                route='forgotPassword'
                className='text-xs font-extrabold text-primary underline-offset-4 hover:underline'
              >
                Esqueci minha senha
              </Anchor>
            </div>
          </div>

          {(validationError || errorMessage) && (
            <p
              className='rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'
              role='alert'
            >
              {validationError ?? errorMessage}
            </p>
          )}

          <Button
            type='submit'
            className='h-12 w-full rounded-[10px] px-[14px] text-sm font-bold shadow-primary hover:brightness-105'
            disabled={isPending}
            aria-busy={isPending}
          >
            <Icon className='size-4' name='arrow' />
            {isPending ? 'Entrando…' : 'Entrar no Scoops'}
          </Button>
        </form>
      </section>
    </AuthLayout>
  )
}
