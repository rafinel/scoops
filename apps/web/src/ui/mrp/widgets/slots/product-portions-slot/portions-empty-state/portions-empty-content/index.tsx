import { Icon } from '@/ui/shared/widgets/components/icon'

import { getEmptyCopy } from '../empty-copy'
import { PortionsEmptyAction } from './portions-empty-action'

export type PortionsEmptyContentProps = {
  canManage: boolean
  inactiveNoticeId?: string
  isActive: boolean
  onLink: () => void
  variant: 'no-link' | 'no-portion-registered' | 'global-empty'
}

export const PortionsEmptyContent = (props: PortionsEmptyContentProps) => {
  const copy = getEmptyCopy(props.canManage, props.variant)

  return (
    <section
      className='flex flex-col items-center gap-4 rounded-xl border !border-[color:var(--border-soft)] bg-muted px-4 py-8 text-center sm:px-10 sm:py-16'
      role='status'
    >
      <div className='grid size-16 place-items-center rounded-2xl bg-accent text-primary'>
        <Icon className='size-8' name={copy.icon} />
      </div>
      <h3 className='text-lg leading-[22px] font-extrabold'>{copy.title}</h3>
      <p className='max-w-[420px] text-[13px] leading-4 font-medium text-muted-foreground'>
        {copy.description}
      </p>
      <PortionsEmptyAction {...props} />
    </section>
  )
}
