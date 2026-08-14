export type OnboardingStep = 'registration' | 'confirmation' | 'completed'
export type OnboardingProgressProps = {
  currentStep: OnboardingStep
  trailingLabel: string
  tone?: 'default' | 'danger'
}

export const OnboardingProgress = ({
  currentStep,
  trailingLabel,
  tone = 'default',
}: OnboardingProgressProps) => {
  const steps: OnboardingStep[] = ['registration', 'confirmation', 'completed']
  const currentIndex = steps.indexOf(currentStep)
  return (
    <div
      role='status'
      aria-label={`${currentIndex + 1} de 3 · ${trailingLabel}`}
      className='flex items-center gap-2 text-xs font-extrabold uppercase tracking-[1.2px]'
    >
      <span className={tone === 'danger' ? 'text-danger' : 'text-primary'}>
        {currentIndex + 1} de 3
      </span>
      <span className='flex flex-1 gap-1' aria-hidden='true'>
        {steps.map((step, index) => (
          <span
            className={`h-1 flex-1 rounded-full ${index <= currentIndex ? (tone === 'danger' ? 'bg-danger' : 'bg-primary') : 'bg-muted'}`}
            key={step}
          />
        ))}
      </span>
      <span className='text-muted-foreground'>{trailingLabel}</span>
    </div>
  )
}
