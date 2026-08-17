import { isRedirect, redirect } from '@tanstack/react-router'

import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'

import { ROUTES } from '@/constants/routes'
import { AUTH_IDENTITY_SERVICE, AUTH_PROVIDER } from '@/provision/auth/auth-composition'
import { showWarningToast } from '@/ui/shared/notifications'

import { AuthRouteUnavailableError } from './auth-route-unavailable-error'
import { sanitizeReturnTo } from './sanitize-return-to'

export const requireAuthMiddleware = async ({
  location,
}: {
  location: { pathname: string; searchStr: string }
}) => {
  const returnTo = sanitizeReturnTo(`${location.pathname}${location.searchStr}`)

  try {
    const session = await AUTH_PROVIDER.getSession()

    if (!session) {
      throw redirect({ to: ROUTES.login, search: { returnTo } })
    }

    const response = await AUTH_IDENTITY_SERVICE.getAccount()

    if (response.statusCode === HTTP_STATUS_CODE.unauthorized) {
      await signOutLocally()
      throw redirect({ to: ROUTES.login, search: { returnTo } })
    }

    if (response.isFailure || !response.body) {
      throw new AuthRouteUnavailableError()
    }
  } catch (error) {
    if (isRedirect(error) || error instanceof AuthRouteUnavailableError) {
      throw error
    }

    throw new AuthRouteUnavailableError()
  }
}

async function signOutLocally() {
  try {
    await AUTH_PROVIDER.signOut('local')
  } catch {
    showWarningToast(
      'Sua sessão local foi encerrada, mas a limpeza do provedor não foi confirmada.',
    )
  }
}
