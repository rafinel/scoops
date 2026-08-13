import type {
  AuthChangeEvent,
  AuthError,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js'
import { isAuthError } from '@supabase/supabase-js'

import type { AuthProvider } from '@scoops/core/identity/interfaces'
import type {
  AuthCredentials,
  AuthSession,
  AuthStateChange,
  AuthStateChangeListener,
  AuthUser,
} from '@scoops/core/identity/domain/structures'
import { InvalidCredentialsError } from '@scoops/core/identity/domain/errors'
import {
  AppError,
  BadRequestError,
  ConflictError,
} from '@scoops/core/shared/domain/errors'

import { supabaseClient } from './supabase-client'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_address_invalid: 'Informe um endereço de email válido.',
  email_not_confirmed: 'Não foi possível concluir a operação de autenticação.',
  email_exists: 'Já existe uma conta cadastrada com este email.',
  user_already_exists: 'Já existe uma conta cadastrada com este email.',
  weak_password: 'A senha informada não atende aos requisitos mínimos.',
}

const CORE_AUTH_EVENTS = new Set<AuthStateChange>([
  'INITIAL_SESSION',
  'SIGNED_IN',
  'SIGNED_OUT',
  'PASSWORD_RECOVERY',
  'TOKEN_REFRESHED',
  'USER_UPDATED',
])

export const SupabaseAuthProvider = (
  client: SupabaseClient = supabaseClient,
): AuthProvider => {
  return {
    async signIn({ identifier, password }: AuthCredentials): Promise<AuthSession> {
      const { data, error } = await client.auth.signInWithPassword({
        email: identifier,
        password,
      })

      if (error) throwDomainAuthError(error)
      if (!data.session) {
        throw new AppError('Supabase did not create an authentication session')
      }

      return mapSession(data.session)
    },

    async getSession(accessToken?: string): Promise<AuthSession | null> {
      if (accessToken) {
        const { data, error } = await client.auth.getUser(accessToken)

        if (error) handleSessionError(error)
        return data.user ? mapSessionUser(data.user, accessToken) : null
      }

      const { data, error } = await client.auth.getSession()

      if (error) handleSessionError(error)
      return data.session ? mapSession(data.session) : null
    },

    async getUser(accessToken?: string): Promise<AuthUser | null> {
      const { data, error } = accessToken
        ? await client.auth.getUser(accessToken)
        : await client.auth.getUser()

      if (error) handleSessionError(error)
      return data.user ? mapUser(data.user) : null
    },

    onAuthStateChange(listener: AuthStateChangeListener): () => void {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if (!isCoreAuthEvent(event)) return

        listener(event, session ? mapSession(session) : null)
      })

      return () => data.subscription.unsubscribe()
    },

    async signOut(scope: 'local' | 'global'): Promise<void> {
      const { error } = await client.auth.signOut({ scope })

      if (error) throwDomainAuthError(error)
    },

    async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })

      if (error) throwDomainAuthError(error)
    },

    async updatePassword(password: string): Promise<void> {
      const { error } = await client.auth.updateUser({ password })

      if (error) throwDomainAuthError(error)
    },
  }
}

function handleSessionError(error: AuthError): void {
  if (error.code === 'session_not_found') return

  throwDomainAuthError(error)
}

function throwDomainAuthError(error: AuthError): never {
  if (!isAuthError(error)) {
    throw new AppError('Não foi possível concluir a operação de autenticação.')
  }

  if (error.code === 'invalid_credentials') {
    throw new InvalidCredentialsError()
  }

  const message =
    (error.code && AUTH_ERROR_MESSAGES[error.code]) ??
    'Não foi possível concluir a operação de autenticação.'

  if (error.code === 'email_exists' || error.code === 'user_already_exists') {
    throw new ConflictError(message)
  }

  if (error.status !== undefined && error.status < 500) {
    throw new BadRequestError(message)
  }

  throw new AppError(message)
}

function isCoreAuthEvent(event: AuthChangeEvent): event is AuthStateChange {
  return CORE_AUTH_EVENTS.has(event as AuthStateChange)
}

function mapSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    user: mapUser(session.user),
  }
}

function mapSessionUser(user: User, accessToken: string): AuthSession {
  return {
    accessToken,
    user: mapUser(user),
  }
}

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
  }
}
