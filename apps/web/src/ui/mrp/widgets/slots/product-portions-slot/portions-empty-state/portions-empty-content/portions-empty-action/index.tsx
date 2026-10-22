import { Button, buttonVariants } from '@/ui/shadcn/button'
import { cn } from '@/ui/shared/lib/utils'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PortionsEmptyActionProps = {
  canManage: boolean
  inactiveNoticeId?: string
  isActive: boolean
  onLink: () => void
  variant: 'no-link' | 'no-portion-registered' | 'global-empty'
}

export const PortionsEmptyAction = (props: PortionsEmptyActionProps) => {
  if (!props.canManage || props.variant === 'global-empty') return null
  if (props.variant === 'no-portion-registered') {
    return (
      <Anchor
        className={cn(
          buttonVariants({ variant: 'default' }),
          'h-9 rounded-[10px] px-4 font-bold shadow-primary',
        )}
        route='newProduct'
      >
        <Icon className='size-3.5' name='plus' /> Cadastrar produto
      </Anchor>
    )
  }
  return (
    <Button
      aria-describedby={props.isActive ? undefined : props.inactiveNoticeId}
      className='h-9 rounded-[10px] px-4 font-bold shadow-primary'
      disabled={!props.isActive}
      onClick={props.onLink}
      type='button'
    >
      <Icon className='size-3.5' name='plus' /> Vincular porções
    </Button>
  )
}
