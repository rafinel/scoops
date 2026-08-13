import type { FormEvent } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'

export type OnboardingRegistrationValues = {
  establishmentName: string
  managerName: string
  email: string
  password: string
  passwordConfirmation: string
}

export type OnboardingRegistrationFormProps = {
  errors?: Partial<Record<keyof OnboardingRegistrationValues, string>>
  errorMessage?: string
  isPasswordVisible: boolean
  isSubmitting: boolean
  values: OnboardingRegistrationValues
  onChange: (field: keyof OnboardingRegistrationValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onTogglePasswordVisibility: () => void
}

const fields: readonly [keyof OnboardingRegistrationValues, string, string, string][] = [
  ['establishmentName', 'Nome da sorveteria', 'Minha sorveteria', 'text'],
  ['managerName', 'Seu nome', 'Nome completo', 'text'],
  ['email', 'E-mail', 'voce@exemplo.com', 'email'],
  ['password', 'Senha', 'Mínimo de 8 caracteres', 'password'],
  ['passwordConfirmation', 'Confirme sua senha', 'Digite novamente', 'password'],
]

export const OnboardingRegistrationForm = ({
  errors = {},
  errorMessage,
  isPasswordVisible,
  isSubmitting,
  values,
  onChange,
  onSubmit,
  onTogglePasswordVisibility,
}: OnboardingRegistrationFormProps) => (
  <form className='flex flex-col gap-3' onSubmit={onSubmit} noValidate>
    {errorMessage ? (
      <p
        className='rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'
        role='alert'
      >
        {errorMessage}
      </p>
    ) : null}
    {fields.map(([field, label, placeholder, type]) => {
      const isPassword = type === 'password'
      const inputType = isPassword && isPasswordVisible ? 'text' : type
      const errorId = `onboarding-${field}-error`
      return (
        <div className='flex min-h-[75px] flex-col' key={field}>
          <label
            className='text-[13px] font-bold leading-[18px]'
            htmlFor={`onboarding-${field}`}
          >
            {label}
          </label>
          <div className='relative mt-[9px]'>
            <input
              aria-describedby={errors[field] ? errorId : undefined}
              aria-invalid={Boolean(errors[field])}
              autoComplete={
                field === 'email'
                  ? 'email'
                  : field === 'password' || field === 'passwordConfirmation'
                    ? 'new-password'
                    : field === 'managerName'
                      ? 'name'
                      : 'organization'
              }
              className={`h-12 w-full rounded-xl border bg-card px-[14px] text-sm font-medium text-foreground outline-none transition placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-ring/25 ${isPassword ? 'pr-12' : ''}`}
              disabled={isSubmitting}
              id={`onboarding-${field}`}
              inputMode={field === 'email' ? 'email' : undefined}
              onChange={(event) => onChange(field, event.target.value)}
              placeholder={placeholder}
              required
              type={inputType}
              value={values[field]}
            />
            {isPassword ? (
              <button
                aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={isPasswordVisible}
                className='absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50'
                disabled={isSubmitting}
                onClick={onTogglePasswordVisibility}
                type='button'
              >
                <Icon
                  className='size-[18px]'
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                />
              </button>
            ) : null}
          </div>
          {errors[field] ? (
            <span className='mt-1 text-xs font-semibold text-danger' id={errorId}>
              {errors[field]}
            </span>
          ) : null}
        </div>
      )
    })}
    <button
      aria-busy={isSubmitting}
      className='mt-2 flex h-12 items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-primary-foreground shadow-primary transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60'
      disabled={isSubmitting}
      type='submit'
    >
      <Icon className='size-4' name='arrow' />
      {isSubmitting ? 'Criando…' : 'Criar sorveteria'}
    </button>
  </form>
)
