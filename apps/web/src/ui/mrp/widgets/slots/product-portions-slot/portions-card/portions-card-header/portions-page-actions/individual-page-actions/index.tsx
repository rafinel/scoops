import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { LinkPortionsButton } from '../link-portions-button'

export type IndividualPageActionsProps = {
  describedBy?: string
  isActive: boolean
  onLink: () => void
  onMakeGlobal: () => void
}

export const IndividualPageActions = ({
  describedBy,
  isActive,
  onLink,
  onMakeGlobal,
}: IndividualPageActionsProps) => (
  <div className='flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row'>
    <Button
      aria-describedby={describedBy}
      className='h-[38px] rounded-[10px] px-5 text-[13px] font-bold'
      disabled={!isActive}
      onClick={onMakeGlobal}
      type='button'
      variant='outline'
    >
      <Icon className='size-3.5' name='globe' /> Tornar global
    </Button>
    <LinkPortionsButton describedBy={describedBy} isActive={isActive} onLink={onLink} />
  </div>
)
