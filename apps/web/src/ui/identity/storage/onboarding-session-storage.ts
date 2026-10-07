import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import { showWarningToast } from '@/ui/shared/notifications'

const STORAGE_KEY = 'scoops.identity.onboarding-session'
const STORAGE_VERSION = 1
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const ISO_DATETIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/

type PendingIceCreamShopOnboardingJson = Omit<
  PendingIceCreamShopOnboarding,
  'expiresAt'
> & { expiresAt: string }

export type StoredOnboardingSession = {
  version: 1
  continuationToken: string
  onboarding: PendingIceCreamShopOnboarding
} & { analyticsOccurrenceId?: string }

type StoredOnboardingSessionJson = Omit<StoredOnboardingSession, 'onboarding'> & {
  onboarding: PendingIceCreamShopOnboardingJson
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum
}

function mapPendingOnboarding(
  value: Record<string, unknown>,
): PendingIceCreamShopOnboarding | undefined {
  if (
    !isBoundedString(value.establishmentName, 120) ||
    !isBoundedString(value.managerName, 120) ||
    !isBoundedString(value.email, 254) ||
    typeof value.expiresAt !== 'string' ||
    !ISO_DATETIME_WITH_OFFSET.test(value.expiresAt)
  ) {
    return undefined
  }

  const expiresAt = new Date(value.expiresAt)
  if (!Number.isFinite(expiresAt.getTime())) return undefined

  return {
    establishmentName: value.establishmentName,
    managerName: value.managerName,
    email: value.email,
    expiresAt,
  }
}

const ANALYTICS_OCCURRENCE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

type StoredSessionEnvelope = {
  version: 1
  continuationToken: string
  onboarding: Record<string, unknown>
  analyticsOccurrenceId?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isContinuationToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value)
}

function isStoredSessionEnvelope(value: unknown): value is StoredSessionEnvelope {
  return (
    isRecord(value) &&
    value.version === STORAGE_VERSION &&
    isContinuationToken(value.continuationToken) &&
    isRecord(value.onboarding)
  )
}

function readAnalyticsOccurrenceId(value: unknown): string | undefined {
  return typeof value === 'string' && ANALYTICS_OCCURRENCE_ID_PATTERN.test(value)
    ? value
    : undefined
}

function parseStoredSession(value: unknown): StoredOnboardingSession | undefined {
  if (!isStoredSessionEnvelope(value)) return undefined

  const onboarding = mapPendingOnboarding(value.onboarding)
  if (!onboarding) return undefined
  return createStoredSession(value, onboarding)
}

function createStoredSession(
  value: StoredSessionEnvelope,
  onboarding: PendingIceCreamShopOnboarding,
): StoredOnboardingSession {
  const analyticsOccurrenceId = readAnalyticsOccurrenceId(value.analyticsOccurrenceId)
  return {
    version: STORAGE_VERSION,
    continuationToken: value.continuationToken,
    onboarding,
    ...(analyticsOccurrenceId ? { analyticsOccurrenceId } : {}),
  }
}

export const onboardingSessionStorage = {
  load(): StoredOnboardingSession | undefined {
    if (typeof window === 'undefined') return undefined

    return readStoredSession(this.clear)
  },

  save(value: StoredOnboardingSession): void {
    if (typeof window === 'undefined') return

    writeStoredSession(createStoredSessionPayload(value))
  },

  clear(): void {
    if (typeof window === 'undefined') return

    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      showWarningToast('O navegador não permitiu limpar o progresso salvo.')
    }
  },
}

function readStoredSession(clear: () => void): StoredOnboardingSession | undefined {
  try {
    return parseStoredSessionValue(window.sessionStorage.getItem(STORAGE_KEY), clear)
  } catch {
    clear()
    return undefined
  }
}

function parseStoredSessionValue(
  raw: string | null,
  clear: () => void,
): StoredOnboardingSession | undefined {
  if (!raw) return undefined
  const parsed = parseStoredSession(JSON.parse(raw))
  if (!parsed) clear()
  return parsed
}

function createStoredSessionPayload(
  value: StoredOnboardingSession,
): StoredOnboardingSessionJson {
  return {
    version: STORAGE_VERSION,
    continuationToken: value.continuationToken,
    ...analyticsOccurrenceProperty(value.analyticsOccurrenceId),
    onboarding: createPendingOnboardingJson(value.onboarding),
  }
}

function analyticsOccurrenceProperty(value?: string): { analyticsOccurrenceId?: string } {
  return value && ANALYTICS_OCCURRENCE_ID_PATTERN.test(value)
    ? { analyticsOccurrenceId: value }
    : {}
}

function createPendingOnboardingJson(
  onboarding: PendingIceCreamShopOnboarding,
): PendingIceCreamShopOnboardingJson {
  return { ...onboarding, expiresAt: onboarding.expiresAt.toISOString() }
}

function writeStoredSession(payload: StoredOnboardingSessionJson): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    showWarningToast('O navegador não permitiu salvar o progresso desta confirmação.')
  }
}

export const loadOnboardingSession = () => onboardingSessionStorage.load()
export const saveOnboardingSession = (value: StoredOnboardingSession) =>
  onboardingSessionStorage.save(value)
export const clearOnboardingSession = () => onboardingSessionStorage.clear()

export type { PendingIceCreamShopOnboardingJson, StoredOnboardingSessionJson }
