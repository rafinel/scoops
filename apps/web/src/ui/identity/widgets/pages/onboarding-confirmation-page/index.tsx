import { AuthLayout } from '@/ui/identity/widgets/layouts/auth-layout'
import { OnboardingRecoveryPanel } from '@/ui/identity/widgets/components/onboarding-recovery-panel'

import { OnboardingConfirmationSuccess } from './onboarding-confirmation-success'
import { useOnboardingConfirmationPage } from './use-onboarding-confirmation-page'

export const OnboardingConfirmationPage = ({
  confirmationToken,
}: {
  confirmationToken?: string
}) => {
  const { state, error, onboarding, isPending, handleEnterApp, handleRestart } =
    useOnboardingConfirmationPage(confirmationToken)
  const visual =
    state === 'success'
      ? 'onboarding-success'
      : state === 'confirming'
        ? 'onboarding-pending'
        : 'onboarding-unavailable'

  return (
    <AuthLayout
      headerAction={{ prompt: 'Já tem uma conta?', label: 'Entrar', route: 'login' }}
      visual={visual}
    >
      {state === 'confirming' ? (
        <section aria-live='polite' className='flex flex-col gap-5' role='status'>
          <p className='text-xs font-extrabold uppercase tracking-[1.4px] text-warning'>
            2 de 3 · Confirmar e-mail
          </p>
          <h1 className='text-[30px] font-extrabold'>Confirmando seu cadastro…</h1>
          <p className='text-[15px] leading-6 text-muted-foreground'>
            Estamos validando o link. Aguarde um instante.
          </p>
        </section>
      ) : state === 'success' ? (
        <OnboardingConfirmationSuccess
          onboarding={onboarding}
          onEnterApp={() => void handleEnterApp()}
        />
      ) : (
        <OnboardingRecoveryPanel
          actions={[
            {
              kind: 'primary',
              label: 'Começar novamente',
              onSelect: handleRestart,
            },
          ]}
          description={
            error?.message ??
            'Esse link expirou, já foi usado ou não é válido. Seus dados continuam protegidos.'
          }
          details={[]}
          isBusy={isPending}
          progressTrailingLabel='Link indisponível'
          state='invalid-confirmation-link'
          title='Não foi possível confirmar'
        />
      )}
    </AuthLayout>
  )
}
