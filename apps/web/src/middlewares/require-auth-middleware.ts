import { isRedirect, redirect } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { resolveAuthSession } from '@/server/auth/resolve-auth-session'

import { AuthRouteUnavailableError } from './auth-route-unavailable-error'
import { sanitizeReturnTo } from './sanitize-return-to'

export const requireAuthMiddleware = async ({
  location,
}: {
  location: { pathname: string; searchStr: string }
}) => {
  const returnTo = sanitizeReturnTo(`${location.pathname}${location.searchStr}`)

  try {
    const resolution = await resolveAuthSession()

    if (!resolution.session || !resolution.account) {
      throw redirect({ hash: '', to: ROUTES.login, search: { returnTo } })
    }
  } catch (error) {
    if (isRedirect(error) || error instanceof AuthRouteUnavailableError) {
      throw error
    }

    throw new AuthRouteUnavailableError()
  }
}
