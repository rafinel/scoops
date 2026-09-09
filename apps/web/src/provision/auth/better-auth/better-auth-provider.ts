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
  TooManyRequestsError,
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
type AuthErrorFactory = () => AppError
type AuthStateListener = Parameters<AuthProvider['onAuthStateChange']>[0]
type BrowserSessionResponses = readonly [Response, Response]
type AuthProviderState = {
  listeners: Set<AuthStateListener>
  sessionResolver: SessionResolver
  browserSessionResolver: SessionResolver
  browserSessionResolution?: Promise<AuthSessionResolution>
}

const AUTH_RATE_LIMIT_MESSAGE =
  'Você atingiu o limite de tentativas de autenticação. Aguarde alguns instantes e tente novamente.'
const AUTH_RATE_LIMIT_TITLE = 'Limite de tentativas de autenticação atingido'

function createAuthRateLimitError(): TooManyRequestsError {
  return new TooManyRequestsError(AUTH_RATE_LIMIT_MESSAGE, AUTH_RATE_LIMIT_TITLE)
}

const DOMAIN_AUTH_ERROR_FACTORIES: ReadonlyMap<string, AuthErrorFactory> = new Map([
  ['INVALID_EMAIL_OR_PASSWORD', () => new InvalidCredentialsError()],
  ['invalid_credentials', () => new InvalidCredentialsError()],
  [
    'USER_ALREADY_EXISTS',
    () => new ConflictError('Já existe uma conta cadastrada com este email.'),
  ],
  [
    'email_exists',
    () => new ConflictError('Já existe uma conta cadastrada com este email.'),
  ],
  ['RATE_LIMITED', createAuthRateLimitError],
  ['rate_limit_exceeded', createAuthRateLimitError],
])

async function resolveBrowserAuthSession(): Promise<AuthSessionResolution> {
  const responses = await fetchBrowserSessionResponses()
  if (hasUnauthorizedResponse(responses)) {
    return { account: null, session: null }
  }
  ensureSuccessfulBrowserResponses(responses)
  return parseBrowserSessionResponses(responses)
}

async function fetchBrowserSessionResponses(): Promise<BrowserSessionResponses> {
  const requestInit = { credentials: 'include' as const }
  return Promise.all([
    fetch(`${BROWSER_ENV.scoopsServerRestUrl}/auth/session`, requestInit),
    fetch(`${BROWSER_ENV.scoopsServerAppUrl}/api/auth/get-session`, requestInit),
  ])
}

function hasUnauthorizedResponse(responses: BrowserSessionResponses): boolean {
  return responses.some(({ status }) => status === 401)
}

function ensureSuccessfulBrowserResponses(responses: BrowserSessionResponses): void {
  if (responses.some(({ ok }) => !ok)) {
    throw new AppError('A sessão de autenticação está indisponível.')
  }
}

async function parseBrowserSessionResponses(
  responses: BrowserSessionResponses,
): Promise<AuthSessionResolution> {
  const [accountResponse, providerResponse] = responses
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
  const state = createAuthProviderState(sessionResolver, browserSessionResolver)
  return createAuthProvider(client, state)
}

function createAuthProviderState(
  sessionResolver: SessionResolver,
  browserSessionResolver: SessionResolver,
): AuthProviderState {
  return {
    listeners: new Set<AuthStateListener>(),
    sessionResolver,
    browserSessionResolver,
  }
}

function createAuthProvider(
  client: BetterAuthClient,
  state: AuthProviderState,
): AuthProvider {
  return {
    signIn: (credentials) => signIn(client, state, credentials),
    getSession: () => getSession(state),
    onAuthStateChange: (listener) => subscribeToAuthState(state, listener),
    signOut: () => signOut(client, state),
  }
}

async function signIn(
  client: BetterAuthClient,
  state: AuthProviderState,
  { email, password }: AuthCredentials,
): Promise<AuthSession> {
  const result = await client.signIn.email({ email, password })
  ensureSuccessfulAuthResult(result)
  const session = requireAuthenticatedSession(await resolveProviderSession(state))

  publishAuthState(state, 'SIGNED_IN', session)
  return session
}

async function getSession(state: AuthProviderState): Promise<AuthSession | null> {
  const resolution = await resolveProviderSession(state)
  publishAuthState(state, 'INITIAL_SESSION', resolution.session)
  return resolution.session
}

function subscribeToAuthState(
  state: AuthProviderState,
  listener: AuthStateListener,
): () => boolean {
  state.listeners.add(listener)
  return () => state.listeners.delete(listener)
}

async function signOut(
  client: BetterAuthClient,
  state: AuthProviderState,
): Promise<void> {
  const result = await client.signOut()
  ensureSuccessfulAuthResult(result)
  publishAuthState(state, 'SIGNED_OUT', null)
}

function publishAuthState(
  state: AuthProviderState,
  event: AuthStateChange,
  session: AuthSession | null,
): void {
  if (!CORE_AUTH_EVENTS.has(event)) return
  for (const listener of state.listeners) listener(event, session)
}

function resolveProviderSession(
  state: AuthProviderState,
): Promise<AuthSessionResolution> {
  if (typeof window === 'undefined') return state.sessionResolver()
  return resolveBrowserSession(state)
}

function resolveBrowserSession(state: AuthProviderState): Promise<AuthSessionResolution> {
  if (state.browserSessionResolution) return state.browserSessionResolution

  state.browserSessionResolution = state.browserSessionResolver().finally(() => {
    state.browserSessionResolution = undefined
  })
  return state.browserSessionResolution
}

function ensureSuccessfulAuthResult(result: BetterAuthResult): void {
  if (result.error) throwDomainAuthError(result.error)
}

function requireAuthenticatedSession(resolution: AuthSessionResolution): AuthSession {
  if (resolution.session) return resolution.session
  throw new AppError('A sessão autenticada não foi encontrada.')
}

function throwDomainAuthError(error: NonNullable<BetterAuthResult['error']>): never {
  const createDomainError = DOMAIN_AUTH_ERROR_FACTORIES.get(error.code ?? '')
  if (createDomainError) throw createDomainError()
  throw createFallbackAuthError(error)
}

function createFallbackAuthError(
  error: NonNullable<BetterAuthResult['error']>,
): AppError {
  const message = error.message ?? 'Não foi possível concluir a autenticação.'
  return createAuthErrorForStatus(error.status, message)
}

function createAuthErrorForStatus(status: number | undefined, message: string): AppError {
  if (status === 429) return createAuthRateLimitError()
  if (status !== undefined && status < 500) return new BadRequestError(message)
  return new AppError(message)
}
