import { isRedirect, redirect } from '@tanstack/react-router'

import { UserProfile } from '@scoops/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { AUTH_IDENTITY_SERVICE, AUTH_PROVIDER } from '@/provision/auth/auth-composition'

import { AuthRouteUnavailableError } from './auth-route-unavailable-error'
import { sanitizeReturnTo } from './sanitize-return-to'

export async function requireManagerMiddleware({
  location,
}: {
  location: { pathname: string; searchStr: string }
}) {
  const returnTo = sanitizeReturnTo(`${location.pathname}${location.searchStr}`)
  try {
    const session = await AUTH_PROVIDER.getSession()
    if (!session) throw redirect({ to: ROUTES.login, search: { returnTo } })
    const response = await AUTH_IDENTITY_SERVICE.getAccount()
    if (response.isFailure || !response.body) throw new AuthRouteUnavailableError()
    if (response.body.profile !== UserProfile.Manager) {
      throw redirect({ to: ROUTES.accessDenied })
    }
  } catch (error) {
    if (isRedirect(error) || error instanceof AuthRouteUnavailableError) throw error
    throw new AuthRouteUnavailableError()
  }
}
