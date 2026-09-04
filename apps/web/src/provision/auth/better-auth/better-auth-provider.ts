import type { AuthProvider } from '@scoops/core/identity/interfaces'
import type {
  AuthCredentials,
  AuthSession,
  AuthStateChange,
} from '@scoops/core/identity/domain/structures'
import {
  AppError,
  BadRequestError,
  ConflictError,
} from '@scoops/core/shared/domain/errors'
import { InvalidCredentialsError } from '@scoops/core/identity/domain/errors'

import { BROWSER_ENV } from '@/constants'
import {
  normalizeBetterAuthSession,
  normalizeAuthSessionResolution,
  resolveAuthSession,
  type AuthSessionResolution,
} from '@/server/auth/resolve-auth-session'
import { betterAuthClient } from './better-auth-client'

type BetterAuthResult = {
  data?: unknown
  error?: {
    code?: string
    message?: string
    status?: number
  } | null
}

type BetterAuthClient = {
  signIn: {
    email(input: { email: string; password: string }): Promise<BetterAuthResult>
  }
  signOut(): Promise<BetterAuthResult>
}

type SessionResolver = () => Promise<AuthSessionResolution>

async function resolveBrowserAuthSession(): Promise<AuthSessionResolution> {
  const requestInit = { credentials: 'include' as const }
  const [accountResponse, providerResponse] = await Promise.all([
    fetch(`${BROWSER_ENV.scoopsServerAppUrl}/auth/session`, requestInit),
    fetch(`${BROWSER_ENV.scoopsServerAppUrl}/api/auth/get-session`, requestInit),
  ])
  if (accountResponse.status === 401 || providerResponse.status === 401) {
    return { account: null, session: null }
  }
  if (!accountResponse.ok || !providerResponse.ok) {
    throw new AppError('Authentication session is unavailable')
  }

  const account = normalizeAuthSessionResolution(await accountResponse.json()).account
  const session = normalizeBetterAuthSession(await providerResponse.json())
  return { account, session }
}

const CORE_AUTH_EVENTS = new Set<AuthStateChange>([
  'INITIAL_SESSION',
  'SIGNED_IN',
  'SIGNED_OUT',
  'SESSION_EXPIRED',
])

export const BetterAuthProvider = (
  client: BetterAuthClient = betterAuthClient,
  sessionResolver: SessionResolver = resolveAuthSession,
  browserSessionResolver: SessionResolver = resolveBrowserAuthSession,
): AuthProvider => {
  const listeners = new Set<Parameters<AuthProvider['onAuthStateChange']>[0]>()

  function publish(event: AuthStateChange, session: AuthSession | null): void {
    if (!CORE_AUTH_EVENTS.has(event)) return
    for (const listener of listeners) listener(event, session)
  }

  return {
    async signIn({ email, password }: AuthCredentials): Promise<AuthSession> {
      const result = await client.signIn.email({ email, password })
      if (result.error) throwDomainAuthError(result.error)

      const resolution = await resolveSession()
      if (!resolution.session) {
        throw new AppError('A sessão autenticada não foi encontrada.')
      }

      publish('SIGNED_IN', resolution.session)
      return resolution.session
    },

    async getSession(): Promise<AuthSession | null> {
      const resolution = await resolveSession()
      publish('INITIAL_SESSION', resolution.session)
      return resolution.session
    },

    onAuthStateChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async signOut(): Promise<void> {
      const result = await client.signOut()
      if (result.error) throwDomainAuthError(result.error)
      publish('SIGNED_OUT', null)
    },
  }

  function resolveSession(): Promise<AuthSessionResolution> {
    return typeof window === 'undefined' ? sessionResolver() : browserSessionResolver()
  }
}

function throwDomainAuthError(error: NonNullable<BetterAuthResult['error']>): never {
  if (
    error.code === 'INVALID_EMAIL_OR_PASSWORD' ||
    error.code === 'invalid_credentials'
  ) {
    throw new InvalidCredentialsError()
  }

  if (error.code === 'USER_ALREADY_EXISTS' || error.code === 'email_exists') {
    throw new ConflictError('Já existe uma conta cadastrada com este email.')
  }

  if (error.status !== undefined && error.status < 500) {
    throw new BadRequestError(
      error.message ?? 'Não foi possível concluir a autenticação.',
    )
  }

  throw new AppError(error.message ?? 'Não foi possível concluir a autenticação.')
}
