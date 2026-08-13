import {
  OnboardingDetailList,
  type OnboardingDetailItem,
} from '../onboarding-detail-list'
import { OnboardingProgress } from '../onboarding-progress'

export type OnboardingRecoveryState =
  | 'expired-continuation'
  | 'invalid-confirmation-link'
  | 'provider-unavailable'
export type OnboardingRecoveryAction = {
  kind: 'primary' | 'secondary' | 'link'
  label: string
  onSelect: () => void
}
export type OnboardingRecoveryPanelProps = {
  actions: readonly OnboardingRecoveryAction[]
  description: string
  details: readonly OnboardingDetailItem[]
  isBusy: boolean
  progressTrailingLabel: string
  state: OnboardingRecoveryState
  title: string
}
export const OnboardingRecoveryPanel = ({
  actions,
  description,
  details,
  isBusy,
  progressTrailingLabel,
  state,
  title,
}: OnboardingRecoveryPanelProps) => (
  <section aria-live='polite' className='flex flex-col gap-5'>
    <OnboardingProgress
      currentStep='confirmation'
      trailingLabel={progressTrailingLabel}
      tone='danger'
    />
    <h1 className='text-[30px] font-extrabold'>{title}</h1>
    <p className='text-sm leading-6 text-muted-foreground'>{description}</p>
    <OnboardingDetailList items={details} />
    <div className='flex flex-col gap-2'>
      {actions.map((action) => (
        <button
          className={
            action.kind === 'primary'
              ? 'h-12 rounded-[10px] bg-primary text-sm font-bold text-primary-foreground'
              : 'h-10 text-sm font-bold text-primary'
          }
          disabled={isBusy}
          key={`${state}-${action.label}`}
          onClick={action.onSelect}
          type='button'
        >
          {action.label}
        </button>
      ))}
    </div>
  </section>
)
