import { cn } from '@/ui/shared/lib/utils'

import { PortionsPageActions } from './portions-page-actions'

export type PortionsCardHeaderProps = {
  countLabel?: string
  handleEditGlobalAction: () => void
  handleLinkAction: () => void
  handleMakeGlobalAction: () => void
  handleMakeIndividualAction: () => void
  handleRemoveGlobalAction: () => void
  hasPortionProducts: boolean
  hasRows: boolean
  inactiveNoticeId: string
  isActive: boolean
  isGlobal: boolean
  showsPageActions: boolean
  subtitle: string
}

export const PortionsCardHeader = (props: PortionsCardHeaderProps) => (
  <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6'>
    <div className={cn('min-w-0 lg:flex-1', props.isGlobal && 'lg:max-w-[440px]')}>
      <h2 className='text-lg font-bold'>
        Porções{' '}
        {props.countLabel ? (
          <span className='text-sm font-medium text-muted-foreground'>
            {props.countLabel}
          </span>
        ) : null}
      </h2>
      <p className='mt-1 text-[13px] text-muted-foreground'>{props.subtitle}</p>
    </div>
    {props.showsPageActions ? (
      <PortionsPageActions
        hasPortionProducts={props.hasPortionProducts}
        hasRows={props.hasRows}
        inactiveNoticeId={props.inactiveNoticeId}
        isActive={props.isActive}
        isGlobal={props.isGlobal}
        onEditGlobal={props.handleEditGlobalAction}
        onLink={props.handleLinkAction}
        onMakeGlobal={props.handleMakeGlobalAction}
        onMakeIndividual={props.handleMakeIndividualAction}
        onRemoveGlobal={props.handleRemoveGlobalAction}
      />
    ) : null}
  </div>
)
