import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type JustificationButtonProps = {
  onClick: () => void
}

export const JustificationButton = ({ onClick }: JustificationButtonProps) => (
  <Button
    aria-haspopup='dialog'
    className='max-w-full justify-start px-2 font-semibold text-primary hover:bg-transparent hover:text-primary hover:underline'
    onClick={onClick}
    size='sm'
    type='button'
    variant='ghost'
  >
    <Icon className='size-3.5' name='eye' />
    Ver justificativa
  </Button>
)
