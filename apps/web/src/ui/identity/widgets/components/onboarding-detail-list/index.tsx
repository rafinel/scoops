import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type OnboardingDetailItem = {
  eyebrow: string
  icon: IconName
  label: string
  status?: string
  tone: 'primary' | 'success' | 'warning' | 'danger'
}
export type OnboardingDetailListProps = { items: readonly OnboardingDetailItem[] }
const toneClasses = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-bg text-danger',
} as const

export const OnboardingDetailList = ({ items }: OnboardingDetailListProps) => (
  <ul className='flex flex-col gap-3'>
    {items.map((item) => (
      <li className='flex items-center gap-3' key={`${item.eyebrow}-${item.label}`}>
        <span
          className={`flex size-9 items-center justify-center rounded-lg ${toneClasses[item.tone]}`}
        >
          <Icon className='size-4' name={item.icon} />
        </span>
        <span className='flex flex-col'>
          <span className='text-[10px] font-extrabold uppercase tracking-[1px] text-muted-foreground'>
            {item.eyebrow}
          </span>
          <span className='text-sm font-bold'>{item.label}</span>
        </span>
        {item.status ? (
          <span className='ml-auto text-xs font-bold text-muted-foreground'>
            {item.status}
          </span>
        ) : null}
      </li>
    ))}
  </ul>
)
