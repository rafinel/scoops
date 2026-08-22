import type { ComponentPropsWithoutRef } from 'react'

import { Link } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export type AnchorProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  route: RouteName
  params?: Record<string, string>
}

export const Anchor = ({ children, params, route, ...props }: AnchorProps) => {
  return (
    <Link params={params} to={ROUTES[route]} {...props}>
      {children}
    </Link>
  )
}
