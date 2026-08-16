import type { RefObject } from 'react'

import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import {
  OnboardingDetailList,
  type OnboardingDetailItem,
} from '@/ui/identity/widgets/components/onboarding-detail-list'
import { OnboardingProgress } from '@/ui/identity/widgets/components/onboarding-progress'

import {
  OnboardingEmailCorrectionForm,
  type OnboardingEmailCorrectionFormProps,
} from './onboarding-email-correction-form'
import { Button } from '@/ui/shadcn/button'

type OnboardingPendingConfirmationBaseProps = {
  correctionTriggerRef?: RefObject<HTMLButtonElement | null>
  errorMessage?: string
  feedbackMessage?: string
  isResending: boolean
  onboarding: PendingIceCreamShopOnboarding
  onOpenCorrection: () => void
  onResend: () => void
}

export type OnboardingPendingConfirmationProps = OnboardingPendingConfirmationBaseProps &
  (
    | { isCorrecting: false; correctionFormProps?: never }
    | { isCorrecting: true; correctionFormProps: OnboardingEmailCorrectionFormProps }
  )

const details = (
  onboarding: PendingIceCreamShopOnboarding,
): readonly OnboardingDetailItem[] => [
  {
    eyebrow: 'SORVETERIA',
    icon: 'store',
    label: onboarding.establishmentName,
    tone: 'primary',
  },
  {
    eyebrow: 'GERENTE',
    icon: 'user-check',
    label: onboarding.managerName,
    tone: 'success',
  },
]

export const OnboardingPendingConfirmation = (
  props: OnboardingPendingConfirmationProps,
) => {
  if (props.isCorrecting) {
    return (
      <section aria-labelledby='correction-title' className='flex flex-col gap-5'>
        <OnboardingProgress currentStep='confirmation' trailingLabel='Atualizar e-mail' />
        <div>
          <h1 className='text-[30px] font-extrabold' id='correction-title'>
            Corrija seu e-mail
          </h1>
          <p className='mt-2 text-sm leading-6 text-muted-foreground'>
            Confirme sua senha para enviar uma nova mensagem ao endereço correto.
          </p>
        </div>
        <OnboardingEmailCorrectionForm {...props.correctionFormProps} />
      </section>
    )
  }

  return (
    <section aria-live='polite' className='flex flex-col gap-5'>
      <OnboardingProgress currentStep='confirmation' trailingLabel='Confirmar e-mail' />
      <div>
        <h1 className='text-[30px] font-extrabold'>Confira sua caixa de entrada</h1>
        <p className='mt-2 text-[15px] leading-6 text-muted-foreground'>
          Enviamos um link para{' '}
          <strong className='text-foreground'>{props.onboarding.email}</strong>.
        </p>
      </div>
      <OnboardingDetailList items={details(props.onboarding)} />
      {props.errorMessage ? (
        <p
          className='rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'
          role='alert'
        >
          {props.errorMessage}
        </p>
      ) : null}
      {props.feedbackMessage ? (
        <p
          aria-live='polite'
          className='rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm font-semibold text-success'
          role='status'
        >
          {props.feedbackMessage}
        </p>
      ) : null}
      <div className='flex flex-col gap-2'>
        <Button
          aria-busy={props.isResending}
          className='h-12 rounded-[10px] text-sm font-bold shadow-primary'
          disabled={props.isResending}
          onClick={props.onResend}
          type='button'
        >
          {props.isResending ? 'Reenviando…' : 'Reenviar confirmação'}
        </Button>
        <Button
          variant='ghost'
          className='h-10 text-sm font-bold text-primary hover:bg-transparent hover:underline'
          disabled={props.isResending}
          onClick={props.onOpenCorrection}
          ref={props.correctionTriggerRef}
          type='button'
        >
          Corrigir e-mail
        </Button>
      </div>
    </section>
  )
}
