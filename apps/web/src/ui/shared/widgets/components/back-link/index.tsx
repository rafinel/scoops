import type { MouseEventHandler } from 'react'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { buttonVariants } from '@/ui/shadcn/button'
import { cn } from '@/ui/shared/lib/utils'
import type { RouteName } from '@/constants/routes'

export type BackLinkProps = {
  'aria-label'?: string
  className?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
  route?: RouteName
}

export const BackLink = ({
  'aria-label': ariaLabel,
  className,
  onClick,
  route = 'products',
}: BackLinkProps) => {
  const anchorClassName = cn(
    buttonVariants({ variant: 'outline', size: 'sm' }),
    'text-foreground text-primary border-none p-1',
    className,
  )

  return (
    <Anchor
      aria-label={ariaLabel}
      className={anchorClassName}
      onClick={onClick}
      route={route}
    >
      <Icon className='size-4 ' name='chevron-left' /> Voltar
    </Anchor>
  )
}
