import type { MouseEventHandler, ReactNode } from 'react'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { buttonVariants } from '@/ui/shadcn/button'
import { cn } from '@/ui/shared/lib/utils'
import type { RouteName } from '@/constants/routes'

export type BackLinkProps = {
  'aria-label'?: string
  className?: string
  children?: ReactNode
  onClick?: MouseEventHandler<HTMLAnchorElement>
  route?: RouteName
}

export const BackLink = ({
  'aria-label': ariaLabel,
  className,
  children = 'Voltar',
  onClick,
  route = 'products',
}: BackLinkProps) => {
  const anchorClassName = cn(
    buttonVariants({ variant: 'ghost', size: 'sm' }),
    'border-none bg-transparent text-primary hover:bg-transparent hover:text-primary',
    className,
  )

  return (
    <Anchor
      aria-label={ariaLabel}
      className={anchorClassName}
      onClick={onClick}
      route={route}
    >
      <Icon className='size-4' name='chevron-left' /> {children}
    </Anchor>
  )
}
