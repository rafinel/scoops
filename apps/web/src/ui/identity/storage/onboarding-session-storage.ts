import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

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
}

type StoredOnboardingSessionJson = Omit<StoredOnboardingSession, 'onboarding'> & {
  onboarding: PendingIceCreamShopOnboardingJson
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum
}

function mapPendingOnboarding(
  value: PendingIceCreamShopOnboardingJson,
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

function parseStoredSession(value: unknown): StoredOnboardingSession | undefined {
  if (!value || typeof value !== 'object') return undefined

  const candidate = value as Partial<StoredOnboardingSessionJson>
  if (
    candidate.version !== STORAGE_VERSION ||
    typeof candidate.continuationToken !== 'string' ||
    !TOKEN_PATTERN.test(candidate.continuationToken) ||
    !candidate.onboarding ||
    typeof candidate.onboarding !== 'object'
  ) {
    return undefined
  }

  const onboarding = mapPendingOnboarding(candidate.onboarding)
  if (!onboarding) return undefined

  return {
    version: STORAGE_VERSION,
    continuationToken: candidate.continuationToken,
    onboarding,
  }
}

export const onboardingSessionStorage = {
  load(): StoredOnboardingSession | undefined {
    if (typeof window === 'undefined') return undefined

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return undefined

      const parsed = parseStoredSession(JSON.parse(raw))
      if (!parsed) this.clear()
      return parsed
    } catch {
      this.clear()
      return undefined
    }
  },

  save(value: StoredOnboardingSession): void {
    if (typeof window === 'undefined') return

    const payload: StoredOnboardingSessionJson = {
      version: STORAGE_VERSION,
      continuationToken: value.continuationToken,
      onboarding: {
        ...value.onboarding,
        expiresAt: value.onboarding.expiresAt.toISOString(),
      },
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Storage availability is best-effort; page state remains authoritative.
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return

    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore unavailable browser storage.
    }
  },
}

export const loadOnboardingSession = () => onboardingSessionStorage.load()
export const saveOnboardingSession = (value: StoredOnboardingSession) =>
  onboardingSessionStorage.save(value)
export const clearOnboardingSession = () => onboardingSessionStorage.clear()

export type { PendingIceCreamShopOnboardingJson, StoredOnboardingSessionJson }
