import { AuthLayout } from '@/ui/identity/widgets/layouts/auth-layout'
import { OnboardingProgress } from '@/ui/identity/widgets/components/onboarding-progress'
import { OnboardingRecoveryPanel } from '@/ui/identity/widgets/components/onboarding-recovery-panel'

import { OnboardingPendingConfirmation } from './onboarding-pending-confirmation'
import { OnboardingRegistrationForm } from './onboarding-registration-form'
import { useOnboardingPage } from './use-onboarding-page'

export const OnboardingPage = () => {
  const {
    state,
    error,
    onboarding,
    form,
    correction,
    feedbackMessage,
    isPasswordVisible,
    isCorrectionPasswordVisible,
    correctionTriggerRef,
    emailInputRef,
    isPending,
    togglePasswordVisibility,
    toggleCorrectionPasswordVisibility,
    updateForm,
    updateCorrection,
    handleSubmit,
    handleResend,
    handleCorrectionSubmit,
    handleStartCorrection,
    handleCancelCorrection,
    handleRestart,
  } = useOnboardingPage()
  const visual =
    state === 'pending' || state === 'correcting' || state === 'resending'
      ? 'onboarding-pending'
      : state === 'expired'
        ? 'onboarding-unavailable'
        : 'onboarding-create'

  return (
    <AuthLayout
      headerAction={{ prompt: 'Já tem uma conta?', label: 'Entrar', route: 'login' }}
      visual={visual}
    >
      {state === 'restoring' ? (
        <section aria-live='polite' className='flex flex-col gap-5' role='status'>
          <OnboardingProgress
            currentStep='confirmation'
            trailingLabel='Restaurando cadastro'
          />
          <h1 className='text-[30px] font-extrabold'>Retomando seu cadastro…</h1>
          <p className='text-[15px] leading-6 text-muted-foreground'>
            Estamos verificando o estado seguro da sua confirmação.
          </p>
        </section>
      ) : state === 'form' || state === 'submitting' || state === 'error' ? (
        <section aria-labelledby='onboarding-title' className='flex flex-col gap-6'>
          <div>
            <OnboardingProgress
              currentStep='registration'
              trailingLabel='Sua sorveteria'
            />
            <h1
              className='mt-3 text-[32px] font-extrabold leading-9 tracking-[-1.2px]'
              id='onboarding-title'
            >
              Crie sua sorveteria
            </h1>
            <p className='mt-2 text-[15px] leading-6 text-muted-foreground'>
              Comece com os dados da operação e do primeiro gerente.
            </p>
          </div>
          <OnboardingRegistrationForm
            errorMessage={error ?? undefined}
            isPasswordVisible={isPasswordVisible}
            isSubmitting={isPending}
            onChange={(field, value) =>
              updateForm(field === 'passwordConfirmation' ? 'confirmation' : field, value)
            }
            onSubmit={handleSubmit}
            onTogglePasswordVisibility={togglePasswordVisibility}
            values={{
              ...form,
              passwordConfirmation: form.confirmation,
            }}
          />
        </section>
      ) : state === 'expired' ? (
        <OnboardingRecoveryPanel
          actions={[
            {
              kind: 'primary',
              label: 'Começar novamente',
              onSelect: handleRestart,
            },
          ]}
          description='Esse cadastro não pode mais ser confirmado. Comece novamente para receber um novo link.'
          details={[]}
          isBusy={isPending}
          progressTrailingLabel='Cadastro expirado'
          state='expired-continuation'
          title='Cadastro expirado'
        />
      ) : onboarding ? (
        state === 'correcting' ? (
          <OnboardingPendingConfirmation
            correctionFormProps={{
              email: correction.email,
              emailInputRef,
              errorMessage: error ?? undefined,
              isPasswordVisible: isCorrectionPasswordVisible,
              isSubmitting: isPending,
              onCancel: handleCancelCorrection,
              onEmailChange: (email) => updateCorrection('email', email),
              onPasswordChange: (password) => updateCorrection('password', password),
              onSubmit: handleCorrectionSubmit,
              onTogglePasswordVisibility: toggleCorrectionPasswordVisibility,
              password: correction.password,
            }}
            correctionTriggerRef={correctionTriggerRef}
            errorMessage={error ?? undefined}
            feedbackMessage={feedbackMessage ?? undefined}
            isCorrecting={true}
            isResending={isPending}
            onOpenCorrection={handleStartCorrection}
            onResend={() => void handleResend()}
            onboarding={onboarding}
          />
        ) : (
          <OnboardingPendingConfirmation
            correctionTriggerRef={correctionTriggerRef}
            errorMessage={error ?? undefined}
            feedbackMessage={feedbackMessage ?? undefined}
            isCorrecting={false}
            isResending={isPending}
            onOpenCorrection={handleStartCorrection}
            onResend={() => void handleResend()}
            onboarding={onboarding}
          />
        )
      ) : null}
    </AuthLayout>
  )
}
