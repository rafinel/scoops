import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import {
  OnboardingDetailList,
  type OnboardingDetailItem,
} from '@/ui/identity/widgets/components/onboarding-detail-list'
import { OnboardingProgress } from '@/ui/identity/widgets/components/onboarding-progress'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OnboardingConfirmationSuccessProps = {
  onboarding?: PendingIceCreamShopOnboarding
  onEnterApp: () => void
}

export const OnboardingConfirmationSuccess = ({
  onboarding,
  onEnterApp,
}: OnboardingConfirmationSuccessProps) => {
  const details: readonly OnboardingDetailItem[] = onboarding
    ? [
        {
          eyebrow: 'SORVETERIA',
          icon: 'store',
          label: onboarding.establishmentName,
          tone: 'success',
        },
        {
          eyebrow: 'GERENTE',
          icon: 'user-check',
          label: onboarding.managerName,
          tone: 'success',
        },
      ]
    : []

  return (
    <section aria-live='polite' className='flex flex-col gap-5'>
      <OnboardingProgress currentStep='completed' trailingLabel='Tudo pronto' />
      <div>
        <h1 className='text-[30px] font-extrabold'>Cadastro concluído</h1>
        <p className='mt-2 text-[15px] leading-6 text-muted-foreground'>
          Sua sorveteria está ativa. Você já está conectado e será redirecionado.
        </p>
      </div>
      {details.length > 0 ? <OnboardingDetailList items={details} /> : null}
      <button
        className='flex h-12 items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-primary-foreground shadow-primary transition hover:brightness-105'
        onClick={onEnterApp}
        type='button'
      >
        <Icon className='size-4' name='arrow' />
        Abrir o Scoops
      </button>
    </section>
  )
}
