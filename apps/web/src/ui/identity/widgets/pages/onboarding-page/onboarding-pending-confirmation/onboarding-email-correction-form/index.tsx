import type { FormEvent, RefObject } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'

export type OnboardingEmailCorrectionFormProps = {
  emailInputRef?: RefObject<HTMLInputElement | null>
  email: string
  errorMessage?: string
  isPasswordVisible: boolean
  isSubmitting: boolean
  password: string
  onCancel: () => void
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onTogglePasswordVisibility: () => void
}

export const OnboardingEmailCorrectionForm = ({
  emailInputRef,
  email,
  errorMessage,
  isPasswordVisible,
  isSubmitting,
  password,
  onCancel,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onTogglePasswordVisibility,
}: OnboardingEmailCorrectionFormProps) => (
  <form className='flex flex-col gap-3' onSubmit={onSubmit} noValidate>
    <div className='flex min-h-[75px] flex-col'>
      <label className='text-[13px] font-bold leading-[18px]' htmlFor='correction-email'>
        Novo e-mail
      </label>
      <input
        ref={emailInputRef}
        aria-invalid={Boolean(errorMessage)}
        autoComplete='email'
        className='mt-[9px] h-12 rounded-xl border bg-card px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'
        disabled={isSubmitting}
        id='correction-email'
        inputMode='email'
        onChange={(event) => onEmailChange(event.target.value)}
        required
        type='email'
        value={email}
      />
    </div>
    <div className='flex min-h-[75px] flex-col'>
      <label
        className='text-[13px] font-bold leading-[18px]'
        htmlFor='correction-password'
      >
        Senha cadastrada
      </label>
      <div className='relative mt-[9px]'>
        <input
          autoComplete='current-password'
          className='h-12 w-full rounded-xl border bg-card px-3.5 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'
          disabled={isSubmitting}
          id='correction-password'
          onChange={(event) => onPasswordChange(event.target.value)}
          required
          type={isPasswordVisible ? 'text' : 'password'}
          value={password}
        />
        <button
          aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={isPasswordVisible}
          className='absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50'
          disabled={isSubmitting}
          onClick={onTogglePasswordVisibility}
          type='button'
        >
          <Icon className='size-[18px]' name={isPasswordVisible ? 'eye-off' : 'eye'} />
        </button>
      </div>
    </div>
    {errorMessage ? (
      <p
        className='rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'
        role='alert'
      >
        {errorMessage}
      </p>
    ) : null}
    <button
      aria-busy={isSubmitting}
      className='h-12 rounded-[10px] bg-primary text-sm font-bold text-primary-foreground shadow-primary disabled:cursor-not-allowed disabled:opacity-60'
      disabled={isSubmitting}
      type='submit'
    >
      {isSubmitting ? 'Enviando…' : 'Enviar nova confirmação'}
    </button>
    <button
      className='h-10 text-sm font-bold text-muted-foreground hover:text-foreground'
      disabled={isSubmitting}
      onClick={onCancel}
      type='button'
    >
      Cancelar
    </button>
  </form>
)
