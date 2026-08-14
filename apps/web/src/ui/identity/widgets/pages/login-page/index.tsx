import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { AuthLayout } from '@/ui/identity/widgets/layouts/auth-layout'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useLoginPage } from './use-login-page'

export type LoginPageProps = {
  returnTo?: string
}

export const LoginPage = ({ returnTo }: LoginPageProps) => {
  const {
    error,
    identifier,
    isPasswordVisible,
    isPending,
    password,
    validationError,
    handleIdentifierChange,
    handlePasswordChange,
    handleSubmit,
    handleTogglePasswordVisibility,
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
            <label className='text-[13px] font-bold leading-[18px]' htmlFor='login-email'>
              E-mail
            </label>
            <input
              id='login-email'
              name='email'
              type='email'
              autoComplete='email'
              inputMode='email'
              value={identifier}
              onChange={(event) => handleIdentifierChange(event.target.value)}
              className='mt-[9px] h-12 w-full rounded-xl border bg-card px-[14px] text-sm font-medium text-foreground shadow-none outline-none transition placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-ring/25'
              placeholder='voce@exemplo.com'
              disabled={isPending}
              required
            />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex h-[75px] flex-col'>
              <label
                className='text-[13px] font-bold leading-[18px]'
                htmlFor='login-password'
              >
                Senha
              </label>
              <div className='relative mt-[9px] h-12'>
                <input
                  id='login-password'
                  name='password'
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete='current-password'
                  value={password}
                  onChange={(event) => handlePasswordChange(event.target.value)}
                  className='h-full w-full rounded-xl border bg-card px-[14px] pr-12 text-sm font-medium text-foreground shadow-none outline-none transition placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-ring/25'
                  placeholder='Digite sua senha'
                  disabled={isPending}
                  required
                />
                <button
                  aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={isPasswordVisible}
                  className='absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50'
                  disabled={isPending}
                  onClick={handleTogglePasswordVisibility}
                  type='button'
                >
                  <Icon
                    className='size-[18px]'
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                  />
                </button>
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

          <button
            type='submit'
            className='flex h-12 w-full items-center justify-center gap-1.5 rounded-[10px] bg-primary px-[14px] text-sm font-bold text-primary-foreground shadow-primary transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isPending}
            aria-busy={isPending}
          >
            <Icon className='size-4' name='arrow' />
            {isPending ? 'Entrando…' : 'Entrar no Scoops'}
          </button>
        </form>
      </section>
    </AuthLayout>
  )
}
