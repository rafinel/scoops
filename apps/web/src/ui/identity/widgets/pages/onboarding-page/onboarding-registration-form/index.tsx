import type { FormEvent } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
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
          <Label
            className='text-[13px] font-bold leading-[18px]'
            htmlFor={`onboarding-${field}`}
          >
            {label}
          </Label>
          <div className='relative mt-[9px]'>
            <Input
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
              className={`h-12 rounded-xl bg-card px-[14px] text-sm font-medium text-foreground placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-ring/25 ${isPassword ? 'pr-12' : ''}`}
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
              <Button
                aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={isPasswordVisible}
                className='absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40'
                disabled={isSubmitting}
                onClick={onTogglePasswordVisibility}
                type='button'
                variant='ghost'
              >
                <Icon
                  className='size-[18px]'
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                />
              </Button>
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
    <Button
      aria-busy={isSubmitting}
      className='mt-2 h-12 rounded-[10px] text-sm font-bold shadow-primary hover:brightness-105'
      disabled={isSubmitting}
      type='submit'
    >
      <Icon className='size-4' name='arrow' />
      {isSubmitting ? 'Criando…' : 'Criar sorveteria'}
    </Button>
  </form>
)
