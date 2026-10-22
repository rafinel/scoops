import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type LinkPortionsButtonProps = {
  describedBy?: string
  isActive: boolean
  onLink: () => void
}

export const LinkPortionsButton = ({
  describedBy,
  isActive,
  onLink,
}: LinkPortionsButtonProps) => (
  <Button
    aria-describedby={describedBy}
    className='h-[38px] rounded-[10px] px-3.5 text-[13px] font-bold shadow-primary'
    disabled={!isActive}
    onClick={onLink}
    type='button'
  >
    <Icon className='size-3.5' name='plus' /> Vincular porções
  </Button>
)
