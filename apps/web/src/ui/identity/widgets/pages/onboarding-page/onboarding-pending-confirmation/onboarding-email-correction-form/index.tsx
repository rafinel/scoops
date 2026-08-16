import type { FormEvent, RefObject } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
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
      <Label className='text-[13px] font-bold leading-[18px]' htmlFor='correction-email'>
        Novo e-mail
      </Label>
      <Input
        ref={emailInputRef}
        aria-invalid={Boolean(errorMessage)}
        autoComplete='email'
        className='mt-[9px] h-12 rounded-xl bg-card px-3.5 text-sm focus:border-primary focus:ring-2 focus:ring-ring/25'
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
      <Label
        className='text-[13px] font-bold leading-[18px]'
        htmlFor='correction-password'
      >
        Senha cadastrada
      </Label>
      <div className='relative mt-[9px]'>
        <Input
          autoComplete='current-password'
          className='h-12 rounded-xl bg-card px-3.5 pr-12 text-sm focus:border-primary focus:ring-2 focus:ring-ring/25'
          disabled={isSubmitting}
          id='correction-password'
          onChange={(event) => onPasswordChange(event.target.value)}
          required
          type={isPasswordVisible ? 'text' : 'password'}
          value={password}
        />
        <Button
          aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={isPasswordVisible}
          className='absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-md text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40'
          disabled={isSubmitting}
          onClick={onTogglePasswordVisibility}
          type='button'
          variant='ghost'
        >
          <Icon className='size-[18px]' name={isPasswordVisible ? 'eye-off' : 'eye'} />
        </Button>
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
    <Button
      aria-busy={isSubmitting}
      className='h-12 rounded-[10px] text-sm font-bold shadow-primary'
      disabled={isSubmitting}
      type='submit'
    >
      {isSubmitting ? 'Enviando…' : 'Enviar nova confirmação'}
    </Button>
    <Button
      variant='ghost'
      className='h-10 text-sm font-bold text-muted-foreground hover:bg-transparent hover:text-foreground'
      disabled={isSubmitting}
      onClick={onCancel}
      type='button'
    >
      Cancelar
    </Button>
  </form>
)
