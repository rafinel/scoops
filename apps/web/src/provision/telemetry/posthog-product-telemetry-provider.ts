import { PostHog, type CaptureResult, type Properties } from 'posthog-js'

import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type {
  AttemptHandle,
  ProductTelemetryEvent,
  ProductTelemetryFeature,
  ProductTelemetryProvider,
  ProductTelemetryStatusClass,
  ProductTelemetryWorkflow,
  WorkflowHandle,
} from '@scoops/core/shared/interfaces'
import {
  featureVisitedTelemetrySchema,
  productTelemetryIdentityLinkSchema,
  productTelemetryWorkflowPayloadSchema,
} from '@scoops/validation'

import { BROWSER_ENV } from '@/constants'

const ANONYMOUS_ID_STORAGE_KEY = 'scoops.product-telemetry.anonymous-id.v1'
const INVALIDATION_STORAGE_KEY = 'scoops.product-telemetry.invalidation.v1'
const ONBOARDING_TIMING_STORAGE_KEY_PREFIX = 'scoops.product-telemetry.onboarding-timing.'
const ONBOARDING_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000
const IDENTIFY_PROPERTY_KEYS = [
  'token',
  'distinct_id',
  '$anon_distinct_id',
  '$is_identified',
  '$process_person_profile',
] as const
const ORDINARY_SDK_PROPERTY_KEYS = [
  'token',
  'distinct_id',
  '$is_identified',
  '$process_person_profile',
] as const
const EVENT_APPLICATION_PROPERTY_KEYS = [
  'schema_version',
  'environment',
  'workflow',
  'workflow_id',
  'attempt',
  'duration_ms',
  'fields',
  'phase',
  'failure_code',
  'status_class',
  'feature',
  'establishment_id',
  'role',
] as const
const POSTHOG_CAPTURE_OPTIONS = {
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  capture_exceptions: false,
  request_batching: false,
  save_campaign_params: false,
  save_referrer: false,
} as const
const POSTHOG_FEATURE_OPTIONS = {
  disableDeviceModel: true,
  disable_external_dependency_loading: true,
  disable_session_recording: true,
  disable_surveys: true,
  disable_web_experiments: true,
  advanced_disable_flags: true,
} as const
const POSTHOG_PRIVACY_OPTIONS = {
  persistence: 'memory',
  person_profiles: 'identified_only',
} as const
const POSTHOG_CLIENT_OPTIONS = {
  ...POSTHOG_CAPTURE_OPTIONS,
  ...POSTHOG_FEATURE_OPTIONS,
  ...POSTHOG_PRIVACY_OPTIONS,
  loaded: () => undefined,
} as const
const SUPPORTED_PRODUCT_EVENTS = new Set<ProductTelemetryEvent['event']>([
  'feature_visited',
  'onboarding_started',
  'onboarding_registration_completed',
  'email_confirmation_completed',
  'workflow_started',
  'workflow_completed',
  'workflow_validation_failed',
  'workflow_blocked',
  'workflow_failed',
])
const SUPPORTED_FEATURES = new Set<ProductTelemetryFeature>([
  'dashboard',
  'products',
  'new_sale',
  'orders',
  'sales_channels',
  'discounts',
  'users',
  'shop_settings',
  'subscription',
  'account',
  'notifications',
])

type AuthStatus =
  | 'resolving'
  | 'authenticated'
  | 'anonymous'
  | 'expired'
  | 'denied'
  | 'unavailable'

type IdentityStatus = AuthStatus | 'unresolved' | 'suspended'

type IdentityContext = {
  establishmentId: string
  role: Account['profile']
}

type IdentityEventProperties = {
  establishment_id: string
  role: Account['profile']
}

type ResolvedAccountIdentity = {
  accountId: string
  identity: IdentityContext
}

type AuthObservation = {
  status: AuthStatus
  account: Account | null
}

type WorkflowStartInput<TWorkflow extends ProductTelemetryWorkflow> =
  TWorkflow extends 'onboarding'
    ? {
        workflow: TWorkflow
        entryKey: string
        restoredOccurrenceId?: string
      }
    : {
        workflow: TWorkflow
        entryKey: string
        restoredOccurrenceId?: never
      }
type OperationalWorkflow = Exclude<ProductTelemetryWorkflow, 'onboarding'>
type CompletionInput =
  | { attempt: AttemptHandle<OperationalWorkflow> }
  | { attempt: AttemptHandle<'onboarding'>; onboardingExpiresAt: number }
type OnboardingCompletionInput = Extract<CompletionInput, { onboardingExpiresAt: number }>
type WorkflowBlock = NonNullable<
  Parameters<ProductTelemetryProvider['recordBlock']>[0]['block']
>
type WorkflowFailureInput = Parameters<ProductTelemetryProvider['recordFailure']>[0]
type AttemptFailureInput = Extract<WorkflowFailureInput, { attempt: unknown }>
type PreviewFailureInput = Exclude<WorkflowFailureInput, { attempt: unknown }>
type ConfirmationFailureInput = Extract<
  Parameters<ProductTelemetryProvider['recordEmailConfirmation']>[0],
  { outcome: 'failure' }
>
type OnboardingFailureInput =
  | Extract<
      Parameters<ProductTelemetryProvider['recordEmailConfirmation']>[0],
      { outcome: 'failure' }
    >
  | Parameters<ProductTelemetryProvider['recordAccountActivationFailure']>[0]

type OnboardingTiming = {
  occurrenceId: string
  startedAt: number
  expiresAt: number
}
type DecodedOnboardingTiming = {
  timing?: OnboardingTiming
  removeInvalidRecord?: boolean
}

type WorkflowRecord = {
  workflow: ProductTelemetryWorkflow
  occurrenceId: string | undefined
  entryKey: string
  startedAt: number
  identityGeneration: number
  active: boolean
  startEmitted: boolean
  startAbandoned: boolean
  pendingEndTimer: ReturnType<typeof setTimeout> | undefined
  nextAttempt: number
  blockSignature: string | null
  onboardingRestored: boolean
  attempts: Map<object, AttemptRecord>
}

type AttemptRecord = {
  workflow: WorkflowRecord
  number: number
  identityGeneration: number
  validationRecorded: boolean
  failureRecorded: boolean
  completionRecorded: boolean
}

type ProductTelemetryRuntime = ProductTelemetryProvider & {
  activate(): void
  reconcileIdentity(observation: AuthObservation): void
  suspend(): void
  subscribeToPeerInvalidation(listener: () => void): () => void
  dispose(): void
}

interface ProductTelemetryDependencies {
  browserEnv?: typeof BROWSER_ENV
  now?: () => number
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
  createClient?: () => PostHog
  createId?: () => string
  broadcast?: (marker: string) => void
}

type ProductTelemetrySettings = {
  browserEnv: typeof BROWSER_ENV
  now: NonNullable<ProductTelemetryDependencies['now']>
  storage: ProductTelemetryDependencies['storage']
  createClient: NonNullable<ProductTelemetryDependencies['createClient']>
  createId: NonNullable<ProductTelemetryDependencies['createId']>
  broadcast: ProductTelemetryDependencies['broadcast']
  isEnabled: boolean
}
export function createPostHogProductTelemetryProvider(
  dependencies: ProductTelemetryDependencies = {},
): ProductTelemetryRuntime {
  return new PostHogProductTelemetryProvider(dependencies)
}

function createProductTelemetrySettings({
  browserEnv = BROWSER_ENV,
  now = Date.now,
  storage = getLocalStorage(),
  createClient = () => new PostHog(),
  createId = createOpaqueId,
  broadcast,
}: ProductTelemetryDependencies = {}): ProductTelemetrySettings {
  const dependencies = { browserEnv, now, storage, createClient, createId, broadcast }
  return {
    ...dependencies,
    isEnabled: isProductTelemetryEnabled(browserEnv),
  }
}

function isProductTelemetryEnabled(browserEnv: typeof BROWSER_ENV): boolean {
  return (
    isBrowserEnvironment() &&
    isSupportedWebEnvironment(browserEnv) &&
    browserEnv.posthogEnabled &&
    hasPostHogCredentials(browserEnv)
  )
}

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined'
}

function isSupportedWebEnvironment(browserEnv: typeof BROWSER_ENV): boolean {
  return browserEnv.scoopsWebAppMode === 'stg' || browserEnv.scoopsWebAppMode === 'prod'
}

function hasPostHogCredentials(browserEnv: typeof BROWSER_ENV): boolean {
  return Boolean(browserEnv.posthogProjectToken && browserEnv.posthogApiHost)
}

function readStoredAnonymousId(
  storage: Pick<Storage, 'getItem'> | null,
): string | undefined {
  if (!storage) return undefined
  try {
    const persisted = storage.getItem(ANONYMOUS_ID_STORAGE_KEY)
    return isOpaqueId(persisted) ? persisted : undefined
  } catch {
    return undefined
  }
}

function resolveAuthenticatedIdentity(
  account: Account | null,
): ResolvedAccountIdentity | undefined {
  const identity = readAccountIdentity(account)
  const accountId = account?.id
  if (!identity || typeof accountId !== 'string' || !accountId) return undefined
  return { accountId, identity }
}

function createIdentityEventProperties(
  identityReady: boolean,
  status: IdentityStatus,
  identity: IdentityContext | undefined,
): IdentityEventProperties | undefined {
  if (!identityReady || status !== 'authenticated' || !identity) return undefined
  return { establishment_id: identity.establishmentId, role: identity.role }
}

function resetPostHogClient(client: PostHog | undefined, anonymousId: string): boolean {
  try {
    client?.reset(createPostHogResetOptions(anonymousId))
    return true
  } catch {
    return false
  }
}

function createPostHogResetOptions(anonymousId: string) {
  return { resetDeviceID: true, bootstrap: createAnonymousBootstrap(anonymousId) }
}

function createAnonymousBootstrap(anonymousId: string) {
  return { distinctID: anonymousId, isIdentifiedID: false }
}

function createPostHogClientOptions(
  apiHost: string,
  anonymousId: string,
  beforeSend: (event: CaptureResult | null) => CaptureResult | null,
) {
  return {
    ...POSTHOG_CLIENT_OPTIONS,
    api_host: apiHost,
    bootstrap: { distinctID: anonymousId, isIdentifiedID: false },
    before_send: beforeSend,
  } as const
}

function initializePostHogClient(
  createClient: () => PostHog,
  token: string,
  createOptions: (client: PostHog) => ReturnType<typeof createPostHogClientOptions>,
): PostHog {
  const client = createClient()
  client.init(token, createOptions(client))
  return client
}

function createInvalidationChannel(onInvalidation: (marker: string) => void) {
  const channel = new BroadcastChannel('scoops.product-telemetry.identity.v1')
  channel.addEventListener('message', (event: MessageEvent<unknown>) => {
    receiveChannelInvalidation(event.data, onInvalidation)
  })
  return channel
}

function receiveChannelInvalidation(
  value: unknown,
  onInvalidation: (marker: string) => void,
): void {
  const marker = readInvalidationMarker(value)
  if (marker) onInvalidation(marker)
}

function createInvalidationStorageListener(
  onInvalidation: (marker: string) => void,
): (event: StorageEvent) => void {
  return (event) => receiveStorageInvalidation(event, onInvalidation)
}

function receiveStorageInvalidation(
  event: StorageEvent,
  onInvalidation: (marker: string) => void,
): void {
  if (event.key !== INVALIDATION_STORAGE_KEY || !event.newValue) return
  receiveChannelInvalidation(event.newValue, onInvalidation)
}

function addStorageListener(listener: (event: StorageEvent) => void): boolean {
  try {
    window.addEventListener('storage', listener)
    return true
  } catch {
    return false
  }
}

function closeChannel(channel: BroadcastChannel | undefined): void {
  try {
    channel?.close()
  } catch {
    // Browser messaging is optional.
  }
}

function removeStorageListener(
  listener: ((event: StorageEvent) => void) | undefined,
): void {
  if (!listener || typeof window === 'undefined') return
  try {
    window.removeEventListener('storage', listener)
  } catch {
    // Browser storage notifications are optional.
  }
}

function publishChannelMarker(
  channel: BroadcastChannel | undefined,
  marker: string,
): void {
  try {
    channel?.postMessage({ marker })
  } catch {
    // The storage signal below is the best-effort fallback.
  }
}

function publishStorageMarker(
  storage: Pick<Storage, 'setItem'> | null,
  marker: string,
): void {
  try {
    storage?.setItem(INVALIDATION_STORAGE_KEY, marker)
  } catch {
    // Collection remains conservative when cross-tab signaling is unavailable.
  }
}

function publishTestMarker(
  broadcast: ProductTelemetryDependencies['broadcast'],
  marker: string,
): void {
  try {
    broadcast?.(marker)
  } catch {
    // Test transport callbacks cannot interrupt authentication.
  }
}

function rememberInvalidationMarker(markers: Set<string>, marker: string): boolean {
  if (markers.has(marker)) return false
  markers.add(marker)
  if (markers.size > 100) removeOldestMarker(markers)
  return true
}

function removeOldestMarker(markers: Set<string>): void {
  const oldest = markers.values().next().value
  if (oldest) markers.delete(oldest)
}

function notifyPeerInvalidationListeners(listeners: Set<() => void>): void {
  for (const listener of listeners) notifyPeerInvalidationListener(listener)
}

function notifyPeerInvalidationListener(listener: () => void): void {
  try {
    listener()
  } catch {
    // A subscriber must not interfere with peer invalidation.
  }
}

function abandonWorkflowStart(record: WorkflowRecord): void {
  record.startAbandoned = true
  record.active = false
  record.pendingEndTimer = undefined
}

class PostHogProductTelemetryProvider implements ProductTelemetryRuntime {
  private readonly settings: ProductTelemetrySettings
  private readonly workflows = new WeakMap<object, WorkflowRecord>()
  private readonly attempts = new WeakMap<object, AttemptRecord>()
  private readonly handlesByEntryKey = new Map<string, object>()
  private readonly seenFeatureVisitKeys = new Set<string>()
  private readonly seenObservationKeys = new Set<string>()
  private readonly peerInvalidationListeners = new Set<() => void>()
  private readonly seenInvalidationMarkers = new Set<string>()
  private client: PostHog | undefined = undefined
  private identityGeneration = 0
  private identityReady = false
  private identityStatus: IdentityStatus = 'unresolved'
  private identityContext: IdentityContext | undefined = undefined
  private accountId: string | undefined = undefined
  private anonymousId: string | undefined = undefined
  private peerSuspended = false
  private lifecycleStarted = false
  private disposeTimer: ReturnType<typeof setTimeout> | undefined = undefined
  private channel: BroadcastChannel | undefined = undefined
  private storageListener: ((event: StorageEvent) => void) | undefined = undefined
  private lastAuthObservation: AuthObservation | undefined = undefined
  constructor(dependencies: ProductTelemetryDependencies = {}) {
    this.settings = createProductTelemetrySettings(dependencies)
  }
  private get browserEnv(): typeof BROWSER_ENV {
    return this.settings.browserEnv
  }
  private get now(): NonNullable<ProductTelemetryDependencies['now']> {
    return this.settings.now
  }
  private get storage(): ProductTelemetryDependencies['storage'] {
    return this.settings.storage
  }
  private get createClient(): NonNullable<ProductTelemetryDependencies['createClient']> {
    return this.settings.createClient
  }
  private get createId(): NonNullable<ProductTelemetryDependencies['createId']> {
    return this.settings.createId
  }
  private get broadcast(): ProductTelemetryDependencies['broadcast'] {
    return this.settings.broadcast
  }
  private get isEnabled(): boolean {
    return this.settings.isEnabled
  }
  private getSafeStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
    if (this.storage !== undefined) return this.storage
    return getLocalStorage()
  }
  private getOrCreateAnonymousId(rotate = false): string {
    if (!rotate && this.anonymousId) return this.anonymousId
    this.anonymousId = this.createAnonymousId(rotate)
    return this.anonymousId
  }
  private createAnonymousId(rotate: boolean): string {
    const persisted = rotate ? undefined : this.readAnonymousId()
    const anonymousId = persisted ?? this.createId()
    this.persistAnonymousId(anonymousId)
    return anonymousId
  }
  private readAnonymousId(): string | undefined {
    return readStoredAnonymousId(this.getSafeStorage())
  }
  private persistAnonymousId(anonymousId: string): void {
    try {
      this.getSafeStorage()?.setItem(ANONYMOUS_ID_STORAGE_KEY, anonymousId)
    } catch {
      // Storage denial must not affect the application.
    }
  }
  private rotateAnonymousId({ notifyPeers }: { notifyPeers: boolean }): string {
    const nextAnonymousId = this.getOrCreateAnonymousId(true)
    if (notifyPeers) this.publishInvalidation()
    return nextAnonymousId
  }
  private ensureClient(): PostHog | undefined {
    if (!this.canInitializeClient()) return undefined
    if (this.client) return this.client
    this.client = this.createConfiguredClient()
    return this.client
  }
  private canInitializeClient(): boolean {
    return this.isEnabled && typeof window !== 'undefined'
  }
  private createConfiguredClient(): PostHog {
    return initializePostHogClient(
      this.createClient,
      this.browserEnv.posthogProjectToken as string,
      (client) => this.createClientOptions(client),
    )
  }
  private createClientOptions(client: PostHog) {
    return createPostHogClientOptions(
      this.browserEnv.posthogApiHost as string,
      this.getOrCreateAnonymousId(),
      (event) => this.sanitizeOutgoingEvent(event, client),
    )
  }
  private initializeLifecycle(): void {
    if (this.lifecycleStarted || typeof window === 'undefined') return
    this.lifecycleStarted = true
    this.initializeBroadcastChannel()
    this.initializeStorageListener()
  }
  private initializeBroadcastChannel(): void {
    try {
      this.channel = createInvalidationChannel((marker) =>
        this.receiveInvalidation(marker),
      )
    } catch {
      this.channel = undefined
    }
  }
  private initializeStorageListener(): void {
    this.storageListener = createInvalidationStorageListener((marker) =>
      this.receiveInvalidation(marker),
    )
    if (!addStorageListener(this.storageListener)) this.storageListener = undefined
  }
  private cleanupLifecycle(): void {
    if (!this.lifecycleStarted) return
    this.lifecycleStarted = false
    closeChannel(this.channel)
    this.channel = undefined
    removeStorageListener(this.storageListener)
    this.storageListener = undefined
  }
  private publishInvalidation(): void {
    const marker = this.createId()
    this.seenInvalidationMarkers.add(marker)
    publishChannelMarker(this.channel, marker)
    publishStorageMarker(this.getSafeStorage(), marker)
    publishTestMarker(this.broadcast, marker)
  }
  private receiveInvalidation(marker: string): void {
    if (!rememberInvalidationMarker(this.seenInvalidationMarkers, marker)) return
    this.suspend()
    notifyPeerInvalidationListeners(this.peerInvalidationListeners)
  }
  suspend(): void {
    this.peerSuspended = true
    this.identityGeneration += 1
    this.identityReady = false
    this.identityStatus = 'suspended'
    this.identityContext = undefined
    this.accountId = undefined
  }
  reconcileIdentity(observation: AuthObservation): void {
    this.lastAuthObservation = observation
    if (typeof window === 'undefined') return
    if (this.deferIdentityObservation(observation)) return
    if (!this.resumePeerIdentity()) return
    this.reconcileResolvedIdentity(observation)
  }

  private deferIdentityObservation(observation: AuthObservation): boolean {
    if (observation.status === 'resolving') return this.deferResolvingIdentity()
    return this.deferUnavailableIdentity(observation)
  }

  private deferResolvingIdentity(): true {
    this.identityReady = false
    return true
  }

  private deferUnavailableIdentity(observation: AuthObservation): boolean {
    if (observation.status !== 'unavailable') return false
    this.markIdentityUnavailable(true)
    return true
  }

  private reconcileResolvedIdentity(observation: AuthObservation): void {
    if (observation.status === 'authenticated') {
      this.reconcileAuthenticatedIdentity(observation.account)
    } else {
      this.reconcileAnonymousIdentity()
    }
  }

  private markIdentityUnavailable(discardStarts: boolean): void {
    this.identityReady = false
    this.identityStatus = 'unavailable'
    if (discardStarts) this.discardUnresolvedStarts()
  }

  private resumePeerIdentity(): boolean {
    if (!this.peerSuspended) return true
    this.clearPeerIdentity()
    if (!this.resetClientForAnonymousIdentity()) return false
    this.identityStatus = 'anonymous'
    return true
  }

  private clearPeerIdentity(): void {
    this.peerSuspended = false
    this.identityGeneration += 1
    this.identityContext = undefined
    this.accountId = undefined
  }

  private resetClientForAnonymousIdentity(): boolean {
    const didReset = resetPostHogClient(this.client, this.getOrCreateAnonymousId())
    if (!didReset) this.markIdentityUnavailable(false)
    return didReset
  }

  private reconcileAuthenticatedIdentity(account: Account | null): void {
    const next = resolveAuthenticatedIdentity(account)
    if (next) {
      this.completeAuthenticatedIdentity(next)
      return
    }
    this.markIdentityUnavailable(true)
  }

  private completeAuthenticatedIdentity(next: ResolvedAccountIdentity): void {
    if (!this.identifyAccount(next.accountId)) return
    this.commitAuthenticatedIdentity(next.accountId, next.identity)
  }

  private identifyAccount(nextAccountId: string): boolean {
    const posthog = this.ensureClient()
    if (!this.isAccountTelemetryAvailable(posthog)) return false
    if (!this.prepareAccountIdentity(nextAccountId)) return false
    return this.identifyPostHogAccount(posthog, nextAccountId)
  }

  private isAccountTelemetryAvailable(posthog: PostHog | undefined): boolean {
    if (!this.isEnabled || posthog) return true
    this.markIdentityUnavailable(true)
    return false
  }

  private identifyPostHogAccount(
    posthog: PostHog | undefined,
    nextAccountId: string,
  ): boolean {
    try {
      if (posthog && this.accountId !== nextAccountId) posthog.identify(nextAccountId)
    } catch {
      this.markIdentityUnavailable(false)
      return false
    }
    return true
  }

  private commitAuthenticatedIdentity(
    nextAccountId: string,
    nextIdentity: IdentityContext,
  ): void {
    this.advanceIdentityGeneration(nextAccountId)
    this.setAuthenticatedIdentity(nextAccountId, nextIdentity)
    this.flushDeferredStarts()
  }

  private advanceIdentityGeneration(nextAccountId: string): void {
    if (this.identityStatus !== 'authenticated' || this.accountId !== nextAccountId)
      this.identityGeneration += 1
  }

  private setAuthenticatedIdentity(
    nextAccountId: string,
    nextIdentity: IdentityContext,
  ): void {
    this.accountId = nextAccountId
    this.identityContext = nextIdentity
    this.identityReady = true
    this.identityStatus = 'authenticated'
  }

  private prepareAccountIdentity(nextAccountId: string): boolean {
    if (this.accountId === nextAccountId) return true
    if (!this.accountId) return this.prepareInitialAccountIdentity()
    return this.prepareAccountSwitch()
  }

  private prepareInitialAccountIdentity(): boolean {
    this.rotateAnonymousId({ notifyPeers: true })
    return true
  }

  private prepareAccountSwitch(): boolean {
    this.identityGeneration += 1
    const nextAnonymousId = this.rotateAnonymousId({ notifyPeers: true })
    this.identityContext = undefined
    this.accountId = undefined
    return this.resetPostHogIdentity(nextAnonymousId)
  }

  private resetPostHogIdentity(anonymousId: string): boolean {
    if (resetPostHogClient(this.client, anonymousId)) return true
    this.markIdentityUnavailable(false)
    return false
  }

  private reconcileAnonymousIdentity(): void {
    const hadIdentity = Boolean(this.accountId)
    if (!this.prepareAnonymousIdentity(hadIdentity)) return
    if (!this.ensureAnonymousTelemetry()) return
    this.commitAnonymousIdentity(hadIdentity)
  }

  private prepareAnonymousIdentity(hadIdentity: boolean): boolean {
    if (!hadIdentity || this.resetAfterAuthenticationEnd()) return true
    this.markIdentityUnavailable(true)
    return false
  }

  private ensureAnonymousTelemetry(): boolean {
    return this.isAccountTelemetryAvailable(this.ensureClient())
  }

  private commitAnonymousIdentity(hadIdentity: boolean): void {
    if (!hadIdentity && this.identityStatus === 'unresolved') this.identityGeneration += 1
    this.identityContext = undefined
    this.accountId = undefined
    this.identityReady = true
    this.identityStatus = 'anonymous'
    this.flushDeferredStarts()
  }

  private resetAfterAuthenticationEnd(): boolean {
    this.identityGeneration += 1
    this.identityContext = undefined
    this.accountId = undefined
    const nextAnonymousId = this.rotateAnonymousId({ notifyPeers: true })
    return resetPostHogClient(this.client, nextAnonymousId)
  }
  private discardUnresolvedStarts(): void {
    for (const handle of this.handlesByEntryKey.values())
      this.discardUnresolvedStart(handle)
  }
  private discardUnresolvedStart(handle: object): void {
    const record = this.workflows.get(handle)
    if (!record || record.startEmitted) return
    abandonWorkflowStart(record)
    this.handlesByEntryKey.delete(record.entryKey)
  }
  private flushDeferredStarts(): void {
    if (!this.identityReady || this.peerSuspended || !this.isEnabled) return
    for (const handle of this.handlesByEntryKey.values()) {
      this.flushDeferredStart(handle)
    }
  }
  private flushDeferredStart(handle: object): void {
    const record = this.workflows.get(handle)
    if (!record || !this.canFlushDeferredStart(record)) return
    this.refreshDeferredStartGeneration(record)
    this.emitWorkflowStart(record)
  }
  private canFlushDeferredStart(record: WorkflowRecord): boolean {
    return (
      record.active &&
      !record.startEmitted &&
      !record.startAbandoned &&
      record.workflow === 'onboarding'
    )
  }
  private refreshDeferredStartGeneration(record: WorkflowRecord): void {
    if (record.identityGeneration !== this.identityGeneration) {
      record.identityGeneration = this.identityGeneration
      for (const attemptRecord of record.attempts.values()) {
        attemptRecord.identityGeneration = this.identityGeneration
      }
    }
  }
  private currentIdentityProperties(): IdentityEventProperties | undefined {
    return createIdentityEventProperties(
      this.identityReady,
      this.identityStatus,
      this.identityContext,
    )
  }
  private isRequestCurrent(generation: number, requiresAuthentication: boolean): boolean {
    return (
      this.identityReady &&
      !this.peerSuspended &&
      this.isGenerationCurrent(generation) &&
      (!requiresAuthentication || this.hasAuthenticatedIdentity())
    )
  }
  private isGenerationCurrent(generation: number): boolean {
    return generation === this.identityGeneration
  }
  private hasAuthenticatedIdentity(): boolean {
    return (
      this.identityReady &&
      this.identityStatus === 'authenticated' &&
      Boolean(this.identityContext && this.accountId)
    )
  }
  private emitCandidate(
    candidate: ProductTelemetryEvent | Record<string, unknown>,
  ): void {
    if (!this.canEmitCandidate()) return
    this.captureCandidate(candidate)
  }
  private captureCandidate(
    candidate: ProductTelemetryEvent | Record<string, unknown>,
  ): void {
    try {
      const event = this.validateCandidate(candidate)
      if (!event) return
      this.captureValidatedEvent(event)
    } catch {
      // Product telemetry is observational and never interrupts a user action.
    }
  }
  private captureValidatedEvent(event: ProductTelemetryEvent): void {
    const posthog = this.ensureClient()
    if (!posthog) return
    const { event: name, ...properties } = event
    posthog.capture(name, properties as Properties)
  }
  private createEventEnvelope(event: ProductTelemetryEvent['event']) {
    return {
      event,
      schema_version: 1,
      environment: this.browserEnv.scoopsWebAppMode,
    }
  }
  private emitEvent(
    event: ProductTelemetryEvent['event'],
    properties: Record<string, unknown>,
  ): void {
    this.emitCandidate({
      ...this.createEventEnvelope(event),
      ...properties,
      ...(this.currentIdentityProperties() ?? {}),
    })
  }
  private createWorkflowEventProperties(record: WorkflowRecord) {
    return { workflow: record.workflow, workflow_id: record.occurrenceId }
  }
  private createAttemptEventProperties(attemptRecord: AttemptRecord) {
    return { attempt: attemptRecord.number }
  }
  private createDurationEventProperties(duration: number | undefined) {
    return duration === undefined ? {} : { duration_ms: duration }
  }
  private createOnboardingEventProperties(occurrenceId?: string) {
    return {
      workflow: 'onboarding',
      ...(occurrenceId ? { workflow_id: occurrenceId } : {}),
    }
  }
  private createStatusClassEventProperties(statusClass?: ProductTelemetryStatusClass) {
    return statusClass ? { status_class: statusClass } : {}
  }
  private createFailureEventProperties(
    phase: 'submission' | 'preview' | 'account_activation',
    failureCode: string,
    statusClass?: ProductTelemetryStatusClass,
  ) {
    return {
      phase,
      failure_code: failureCode,
      ...this.createStatusClassEventProperties(statusClass),
    }
  }
  private canEmitCandidate(): boolean {
    return (
      this.isEnabled &&
      typeof window !== 'undefined' &&
      !this.peerSuspended &&
      this.identityReady
    )
  }
  private validateCandidate(
    candidate: ProductTelemetryEvent | Record<string, unknown>,
  ): ProductTelemetryEvent | undefined {
    const eventName = (candidate as { event?: unknown }).event
    const validation = getProductEventSchema(eventName).safeParse(candidate)
    return validation.success ? (validation.data as ProductTelemetryEvent) : undefined
  }
  private emitWorkflowStart(record: WorkflowRecord): void {
    if (!this.canEmitWorkflowStart(record)) return
    this.emitWorkflowStartEvent(record, this.currentIdentityProperties())
    record.startEmitted = true
  }
  private canEmitWorkflowStart(record: WorkflowRecord): boolean {
    return (
      this.isWorkflowStartPending(record) &&
      this.isRequestCurrent(record.identityGeneration, record.workflow !== 'onboarding')
    )
  }
  private isWorkflowStartPending(record: WorkflowRecord): boolean {
    return !record.startEmitted && !record.startAbandoned && record.active
  }
  private emitWorkflowStartEvent(
    record: WorkflowRecord,
    identityProperties: IdentityEventProperties | undefined,
  ): void {
    const event =
      record.workflow === 'onboarding' ? 'onboarding_started' : 'workflow_started'
    this.emitEvent(event, {
      ...this.createWorkflowEventProperties(record),
      ...(identityProperties ?? {}),
    })
  }
  private getWorkflowRecord(handle: unknown): WorkflowRecord | undefined {
    if (!isObject(handle)) return undefined
    return this.workflows.get(handle)
  }
  private getAttemptRecord(handle: unknown): AttemptRecord | undefined {
    if (!isObject(handle)) return undefined
    return this.attempts.get(handle)
  }
  private createInertWorkflowHandle<
    TWorkflow extends ProductTelemetryWorkflow,
  >(): WorkflowHandle<TWorkflow> {
    return Object.freeze({ occurrenceId: undefined }) as WorkflowHandle<TWorkflow>
  }
  private createInertAttemptHandle<
    TWorkflow extends ProductTelemetryWorkflow,
  >(): AttemptHandle<TWorkflow> {
    return Object.freeze({}) as AttemptHandle<TWorkflow>
  }
  private createWorkflowHandle<TWorkflow extends ProductTelemetryWorkflow>(
    workflow: TWorkflow,
    entryKey: string,
    occurrenceId: string | undefined,
    startedAt: number,
    restored: boolean,
  ): WorkflowHandle<TWorkflow> {
    return this.storeWorkflowHandle(
      Object.freeze({ occurrenceId }) as WorkflowHandle<TWorkflow>,
      this.createWorkflowRecord(workflow, entryKey, occurrenceId, startedAt, restored),
    )
  }
  private createWorkflowRecord(
    workflow: ProductTelemetryWorkflow,
    entryKey: string,
    occurrenceId: string | undefined,
    startedAt: number,
    restored: boolean,
  ): WorkflowRecord {
    return Object.assign(
      { workflow, occurrenceId, entryKey, startedAt },
      this.createInitialWorkflowState(workflow, restored),
    )
  }
  private storeWorkflowHandle<THandle extends object>(
    handle: THandle,
    record: WorkflowRecord,
  ): THandle {
    this.workflows.set(handle, record)
    this.handlesByEntryKey.set(record.entryKey, handle)
    return handle
  }
  private createInitialWorkflowState(
    workflow: ProductTelemetryWorkflow,
    restored: boolean,
  ): Pick<
    WorkflowRecord,
    | 'identityGeneration'
    | 'active'
    | 'startEmitted'
    | 'startAbandoned'
    | 'pendingEndTimer'
    | 'nextAttempt'
    | 'blockSignature'
    | 'onboardingRestored'
    | 'attempts'
  > {
    return Object.assign(
      this.createWorkflowReadiness(workflow, restored),
      this.createWorkflowObservationState(restored),
    )
  }
  private createWorkflowReadiness(
    workflow: ProductTelemetryWorkflow,
    restored: boolean,
  ): Pick<
    WorkflowRecord,
    | 'identityGeneration'
    | 'active'
    | 'startEmitted'
    | 'startAbandoned'
    | 'pendingEndTimer'
  > {
    return {
      identityGeneration: this.identityGeneration,
      active: true,
      startEmitted: this.shouldDeferWorkflowStart(workflow, restored),
      startAbandoned: false,
      pendingEndTimer: undefined,
    }
  }
  private createWorkflowObservationState(
    restored: boolean,
  ): Pick<
    WorkflowRecord,
    'nextAttempt' | 'blockSignature' | 'onboardingRestored' | 'attempts'
  > {
    return {
      nextAttempt: 0,
      blockSignature: null,
      onboardingRestored: restored,
      attempts: new Map(),
    }
  }
  private shouldDeferWorkflowStart(
    workflow: ProductTelemetryWorkflow,
    restored: boolean,
  ): boolean {
    return restored || (workflow !== 'onboarding' && !this.identityReady)
  }
  private canReportWorkflowObservation(
    record: WorkflowRecord,
    generation: number,
  ): boolean {
    if (!this.hasReportableWorkflowStart(record)) return false
    if (this.isUnavailableOnboardingObservation(record)) {
      return this.isGenerationCurrent(generation) && !this.peerSuspended
    }
    return this.isRequestCurrent(generation, record.workflow !== 'onboarding')
  }
  private hasReportableWorkflowStart(record: WorkflowRecord): boolean {
    return Boolean(
      record.occurrenceId &&
        !record.startAbandoned &&
        (record.workflow === 'onboarding' || record.startEmitted),
    )
  }
  private isUnavailableOnboardingObservation(record: WorkflowRecord): boolean {
    return (
      record.workflow === 'onboarding' &&
      this.identityStatus === 'unavailable' &&
      !this.accountId &&
      this.identityReady
    )
  }
  private rememberObservationKey(key: string): void {
    this.seenObservationKeys.add(key)
    if (this.seenObservationKeys.size > 1000) {
      const oldestKey = this.seenObservationKeys.values().next().value
      if (oldestKey) this.seenObservationKeys.delete(oldestKey)
    }
  }
  private elapsedSince(startedAt: number): number | undefined {
    const endedAt = this.now()
    if (!isValidTimestamp(startedAt) || !isValidTimestamp(endedAt)) return undefined
    const elapsed = endedAt - startedAt
    return Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : undefined
  }
  private sanitizeOutgoingEvent(
    event: CaptureResult | null,
    instance: PostHog,
  ): CaptureResult | null {
    try {
      return this.sanitizeOutgoingEventSafely(event, instance)
    } catch {
      return null
    }
  }
  private sanitizeOutgoingEventSafely(
    event: CaptureResult | null,
    instance: PostHog,
  ): CaptureResult | null {
    if (!isSanitizableCaptureEvent(event)) return null
    return this.sanitizeEventByName(
      event,
      pickCaptureSdkProperties(event, instance, this.browserEnv.posthogProjectToken),
    )
  }
  private sanitizeEventByName(
    event: CaptureResult,
    safeProperties: Properties,
  ): CaptureResult | null {
    return event.event === '$identify'
      ? sanitizeIdentifyEvent(event, safeProperties)
      : sanitizeProductEvent(event, safeProperties)
  }
  private readPersistedTiming(occurrenceId: string): OnboardingTiming | undefined {
    if (!isOpaqueId(occurrenceId)) return undefined
    const safeStorage = this.getSafeStorage()
    if (!safeStorage) return undefined
    const storageKey = onboardingTimingStorageKey(occurrenceId)
    return this.readTimingSafely(safeStorage, storageKey, occurrenceId)
  }
  private readTimingSafely(
    safeStorage: Pick<Storage, 'getItem' | 'removeItem'>,
    storageKey: string,
    occurrenceId: string,
  ): OnboardingTiming | undefined {
    try {
      return this.readTimingRecord(safeStorage, storageKey, occurrenceId)
    } catch {
      this.removeTimingBestEffort(safeStorage, storageKey)
      return undefined
    }
  }
  private removeTimingBestEffort(
    storage: Pick<Storage, 'removeItem'>,
    storageKey: string,
  ): void {
    try {
      storage.removeItem(storageKey)
    } catch {
      // Storage cleanup is best-effort.
    }
  }
  private readTimingRecord(
    storage: Pick<Storage, 'getItem' | 'removeItem'>,
    storageKey: string,
    occurrenceId: string,
  ): OnboardingTiming | undefined {
    const raw = storage.getItem(storageKey)
    if (!raw || raw.length > 1024) return undefined
    const parsed = decodeOnboardingTiming(raw, occurrenceId, this.now())
    if (parsed.removeInvalidRecord) storage.removeItem(storageKey)
    return parsed.timing
  }
  private writePersistedTiming(record: OnboardingTiming): void {
    const safeStorage = this.getSafeStorage()
    if (!safeStorage || !this.canPersistTiming(record)) return
    this.persistTimingSafely(safeStorage, record)
  }
  private canPersistTiming(record: OnboardingTiming): boolean {
    return (
      isOpaqueId(record.occurrenceId) &&
      isValidDeadline(record.startedAt, record.expiresAt)
    )
  }
  private persistTimingSafely(
    safeStorage: Pick<Storage, 'setItem'>,
    record: OnboardingTiming,
  ): void {
    try {
      const delay = persistOnboardingTiming(safeStorage, record, () => this.now())
      this.scheduleTimingCleanup(record, delay)
    } catch {
      // Storage denial must not fail registration or restoration.
    }
  }
  private scheduleTimingCleanup(record: OnboardingTiming, delay: number): void {
    setTimeout(() => this.clearPersistedTiming(record.occurrenceId), delay)
  }
  private clearPersistedTiming(occurrenceId?: string): void {
    const safeStorage = this.getSafeStorage()
    if (!safeStorage || !occurrenceId) return
    try {
      this.removePersistedTiming(safeStorage, occurrenceId)
    } catch {
      // Storage cleanup is best-effort.
    }
  }
  private removePersistedTiming(
    safeStorage: Pick<Storage, 'removeItem'>,
    occurrenceId: string,
  ): void {
    const storageKey = onboardingTimingStorageKey(occurrenceId)
    const timing = this.readPersistedTiming(occurrenceId)
    if (timing || !isOpaqueId(occurrenceId)) safeStorage.removeItem(storageKey)
  }
  startWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): WorkflowHandle<TWorkflow> {
    try {
      return this.resolveWorkflowStart(input)
    } catch {
      return this.createInertWorkflowHandle<TWorkflow>()
    }
  }
  private resolveWorkflowStart<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): WorkflowHandle<TWorkflow> {
    return this.isValidWorkflowStartInput(input)
      ? (this.findExistingWorkflow(input) ??
          (this.canStartWorkflow(input.workflow)
            ? this.createNewWorkflow(input)
            : this.createInertWorkflowHandle<TWorkflow>()))
      : this.createInertWorkflowHandle<TWorkflow>()
  }
  private isValidWorkflowStartInput<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): boolean {
    return isValidEntryKey(input?.entryKey) && isValidWorkflow(input?.workflow)
  }
  private findExistingWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): WorkflowHandle<TWorkflow> | undefined {
    return (
      this.findActiveWorkflowHandle(input) ??
      this.restoreOnboardingWorkflow(input) ??
      undefined
    )
  }

  private findActiveWorkflowHandle<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): WorkflowHandle<TWorkflow> | undefined {
    const handle = this.handlesByEntryKey.get(input.entryKey)
    const record = handle && this.workflows.get(handle)
    if (!handle || record?.workflow !== input.workflow) return undefined
    this.resumeWorkflow(record)
    return handle as WorkflowHandle<TWorkflow>
  }
  private resumeWorkflow(record: WorkflowRecord): void {
    if (record.pendingEndTimer) {
      clearTimeout(record.pendingEndTimer)
      record.pendingEndTimer = undefined
      record.active = true
    }
  }

  private restoreOnboardingWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): WorkflowHandle<TWorkflow> | null {
    if (!this.isOnboardingRestoreInput(input)) return null
    return this.restoreOnboardingOccurrence(
      input.entryKey,
      input.restoredOccurrenceId as string,
    )
  }
  private restoreOnboardingOccurrence<TWorkflow extends ProductTelemetryWorkflow>(
    entryKey: string,
    occurrenceId: string,
  ): WorkflowHandle<TWorkflow> {
    const timing = this.readRestorableOnboardingTiming(occurrenceId)
    return timing
      ? this.createRestoredOnboardingWorkflow<TWorkflow>(entryKey, timing)
      : this.createInertWorkflowHandle<TWorkflow>()
  }
  private readRestorableOnboardingTiming(
    occurrenceId: string,
  ): OnboardingTiming | undefined {
    return isOpaqueId(occurrenceId) ? this.readPersistedTiming(occurrenceId) : undefined
  }
  private isOnboardingRestoreInput<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): boolean {
    return input.workflow === 'onboarding' && input.restoredOccurrenceId !== undefined
  }
  private createRestoredOnboardingWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    entryKey: string,
    timing: OnboardingTiming,
  ): WorkflowHandle<TWorkflow> {
    return this.createWorkflowHandle(
      'onboarding' as TWorkflow,
      entryKey,
      timing.occurrenceId,
      timing.startedAt,
      true,
    )
  }

  private canStartWorkflow(workflow: ProductTelemetryWorkflow): boolean {
    return workflow === 'onboarding'
      ? this.canStartOnboarding()
      : this.canStartAuthenticatedWorkflow()
  }
  private canStartOnboarding(): boolean {
    return this.identityReady || this.identityStatus === 'unresolved'
  }
  private canStartAuthenticatedWorkflow(): boolean {
    return Boolean(
      this.identityReady &&
        this.identityStatus === 'authenticated' &&
        this.identityContext,
    )
  }

  private createNewWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): WorkflowHandle<TWorkflow> {
    const occurrenceId = this.createId()
    if (!isOpaqueId(occurrenceId)) return this.createInertWorkflowHandle<TWorkflow>()
    const startedAt = this.now()
    if (!isValidTimestamp(startedAt)) return this.createInertWorkflowHandle<TWorkflow>()
    return this.registerNewWorkflow(input, occurrenceId, startedAt)
  }
  private registerNewWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
    occurrenceId: string,
    startedAt: number,
  ): WorkflowHandle<TWorkflow> {
    const handle = this.createWorkflowHandle<TWorkflow>(
      input.workflow as TWorkflow,
      input.entryKey,
      occurrenceId,
      startedAt,
      false,
    )
    return this.emitStartForNewWorkflow(handle)
  }
  private emitStartForNewWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    handle: WorkflowHandle<TWorkflow>,
  ): WorkflowHandle<TWorkflow> {
    const record = this.workflows.get(handle)
    if (!record) return this.createInertWorkflowHandle<TWorkflow>()
    this.emitWorkflowStart(record)
    return handle as WorkflowHandle<TWorkflow>
  }
  startAttempt<TWorkflow extends ProductTelemetryWorkflow>(input: {
    workflow: WorkflowHandle<TWorkflow>
  }): AttemptHandle<TWorkflow> {
    try {
      return this.createAttemptIfActive<TWorkflow>(input?.workflow)
    } catch {
      return this.createInertAttemptHandle<TWorkflow>()
    }
  }
  private createAttemptIfActive<TWorkflow extends ProductTelemetryWorkflow>(
    workflow: WorkflowHandle<TWorkflow> | undefined,
  ): AttemptHandle<TWorkflow> {
    const record = this.getWorkflowRecord(workflow)
    return this.canStartAttempt(record)
      ? this.createAttemptForWorkflow<TWorkflow>(record)
      : this.createInertAttemptHandle<TWorkflow>()
  }
  private canStartAttempt(record: WorkflowRecord | undefined): record is WorkflowRecord {
    return Boolean(record?.active && !record.startAbandoned)
  }
  private createAttemptForWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    workflowRecord: WorkflowRecord,
  ): AttemptHandle<TWorkflow> {
    workflowRecord.nextAttempt += 1
    const attempt = Object.freeze({}) as AttemptHandle<TWorkflow>
    const attemptRecord = this.createAttemptRecord(workflowRecord)
    this.storeAttemptRecord(attempt, workflowRecord, attemptRecord)
    return attempt
  }
  private createAttemptRecord(workflowRecord: WorkflowRecord): AttemptRecord {
    return Object.assign(
      {
        workflow: workflowRecord,
        number: workflowRecord.nextAttempt,
        identityGeneration: this.identityGeneration,
      },
      this.createAttemptStatus(),
    )
  }
  private createAttemptStatus(): Pick<
    AttemptRecord,
    'validationRecorded' | 'failureRecorded' | 'completionRecorded'
  > {
    return {
      validationRecorded: false,
      failureRecorded: false,
      completionRecorded: false,
    }
  }
  private storeAttemptRecord(
    attempt: object,
    workflowRecord: WorkflowRecord,
    attemptRecord: AttemptRecord,
  ): void {
    this.attempts.set(attempt, attemptRecord)
    workflowRecord.attempts.set(attempt, attemptRecord)
  }
  recordValidationFailure(
    input: Parameters<ProductTelemetryProvider['recordValidationFailure']>[0],
  ): void {
    try {
      this.recordValidationObservation(input)
    } catch {
      // Invalid telemetry candidates are dropped without surfacing their values.
    }
  }
  private recordValidationObservation(
    input: Parameters<ProductTelemetryProvider['recordValidationFailure']>[0],
  ): void {
    const observation = this.getValidationObservation(input)
    if (!observation) return
    this.emitValidationFailure(observation.attemptRecord, observation.fields)
    observation.attemptRecord.validationRecorded = true
  }
  private getValidationObservation(
    input: Parameters<ProductTelemetryProvider['recordValidationFailure']>[0],
  ): { attemptRecord: AttemptRecord; fields: readonly string[] } | undefined {
    const attemptRecord = this.getAttemptRecord(input?.attempt)
    if (!this.canReportValidationObservation(attemptRecord)) return undefined
    const fields = normalizeFields(input.fields)
    return fields.length ? { attemptRecord, fields } : undefined
  }
  private canReportValidationObservation(
    attemptRecord: AttemptRecord | undefined,
  ): attemptRecord is AttemptRecord {
    return Boolean(
      attemptRecord &&
        !attemptRecord.validationRecorded &&
        this.canReportWorkflowObservation(
          attemptRecord.workflow,
          attemptRecord.identityGeneration,
        ),
    )
  }
  private emitValidationFailure(
    attemptRecord: AttemptRecord,
    fields: readonly string[],
  ): void {
    const record = attemptRecord.workflow
    this.emitEvent('workflow_validation_failed', {
      ...this.createWorkflowEventProperties(record),
      ...this.createAttemptEventProperties(attemptRecord),
      fields,
    })
  }
  recordBlock(input: Parameters<ProductTelemetryProvider['recordBlock']>[0]): void {
    try {
      this.recordBlockObservation(input)
    } catch {
      // Invalid telemetry candidates are dropped without surfacing their values.
    }
  }
  private recordBlockObservation(
    input: Parameters<ProductTelemetryProvider['recordBlock']>[0],
  ): void {
    const record = this.getWorkflowRecord(input?.workflow)
    if (!this.canReportBlock(record)) return
    this.updateBlockObservation(record, input.block)
  }
  private updateBlockObservation(
    record: WorkflowRecord,
    block: WorkflowBlock | null,
  ): void {
    if (block === null) this.clearBlockSignature(record)
    else this.emitNewBlock(record, block)
  }
  private emitNewBlock(record: WorkflowRecord, block: WorkflowBlock): void {
    const fields = normalizeFields(block.fields)
    if (fields.length && this.rememberBlockSignature(record, fields, block)) {
      this.emitBlockEvent(record, fields, block.phase, block.failureCode)
    }
  }
  private canReportBlock(record: WorkflowRecord | undefined): record is WorkflowRecord {
    return Boolean(
      record && this.canReportWorkflowObservation(record, record.identityGeneration),
    )
  }
  private clearBlockSignature(record: WorkflowRecord): void {
    record.blockSignature = null
  }
  private rememberBlockSignature(
    record: WorkflowRecord,
    fields: readonly string[],
    block: WorkflowBlock,
  ): boolean {
    const signature = this.createBlockSignature(fields, block)
    if (record.blockSignature === signature) return false
    record.blockSignature = signature
    return true
  }
  private createBlockSignature(fields: readonly string[], block: WorkflowBlock): string {
    return JSON.stringify([[...fields].sort(), block.phase, block.failureCode])
  }
  private emitBlockEvent(
    record: WorkflowRecord,
    fields: readonly string[],
    phase: WorkflowBlock['phase'],
    failureCode: WorkflowBlock['failureCode'],
  ): void {
    this.emitEvent('workflow_blocked', {
      ...this.createWorkflowEventProperties(record),
      fields,
      phase,
      failure_code: failureCode,
    })
  }
  recordFailure(input: WorkflowFailureInput): void {
    try {
      this.dispatchFailure(input)
    } catch {
      // Invalid telemetry candidates are dropped without surfacing their values.
    }
  }
  private dispatchFailure(input: WorkflowFailureInput): void {
    if ('attempt' in input) this.recordAttemptFailure(input)
    else this.recordPreviewFailure(input)
  }

  private recordAttemptFailure(input: AttemptFailureInput): void {
    const attemptRecord = this.getReportableAttemptFailure(input)
    if (!attemptRecord) return
    this.emitAttemptFailure(attemptRecord, input)
    attemptRecord.failureRecorded = true
  }
  private getReportableAttemptFailure(
    input: AttemptFailureInput,
  ): AttemptRecord | undefined {
    const attemptRecord = this.getAttemptRecord(input.attempt)
    return this.canReportAttemptObservation(attemptRecord, 'failureRecorded')
      ? attemptRecord
      : undefined
  }
  private canReportAttemptObservation(
    attemptRecord: AttemptRecord | undefined,
    reportedField: 'failureRecorded' | 'completionRecorded',
  ): attemptRecord is AttemptRecord {
    return Boolean(
      attemptRecord &&
        !attemptRecord[reportedField] &&
        this.canReportWorkflowObservation(
          attemptRecord.workflow,
          attemptRecord.identityGeneration,
        ),
    )
  }

  private emitAttemptFailure(
    attemptRecord: AttemptRecord,
    input: AttemptFailureInput,
  ): void {
    this.emitEvent(
      'workflow_failed',
      this.createAttemptFailureProperties(attemptRecord, input),
    )
  }
  private createAttemptFailureProperties(
    attemptRecord: AttemptRecord,
    input: AttemptFailureInput,
  ): Record<string, unknown> {
    return Object.assign(
      this.createWorkflowEventProperties(attemptRecord.workflow),
      this.createAttemptEventProperties(attemptRecord),
      this.createSubmissionFailureProperties(input),
    )
  }
  private createSubmissionFailureProperties(
    input: AttemptFailureInput,
  ): Record<string, unknown> {
    return this.createFailureEventProperties(
      'submission',
      input.failureCode,
      input.statusClass,
    )
  }

  private recordPreviewFailure(input: PreviewFailureInput): void {
    const record = this.getWorkflowRecord(input.workflow)
    if (!this.canReportPreviewFailure(record)) return
    this.emitNewPreviewFailure(record, input)
  }
  private emitNewPreviewFailure(
    record: WorkflowRecord,
    input: PreviewFailureInput,
  ): void {
    if (!isValidEntryKey(input.observationKey)) return
    const observationKey = `preview:${input.observationKey}`
    if (this.seenObservationKeys.has(observationKey)) return
    this.rememberObservationKey(observationKey)
    this.emitPreviewFailure(record, input)
  }
  private canReportPreviewFailure(
    record: WorkflowRecord | undefined,
  ): record is WorkflowRecord {
    return Boolean(
      record?.workflow === 'production' &&
        this.canReportWorkflowObservation(record, record.identityGeneration),
    )
  }

  private emitPreviewFailure(record: WorkflowRecord, input: PreviewFailureInput): void {
    this.emitEvent('workflow_failed', {
      ...this.createWorkflowEventProperties(record),
      ...this.createFailureEventProperties(
        'preview',
        input.failureCode,
        input.statusClass,
      ),
    })
  }

  completeWorkflow(input: CompletionInput): void {
    try {
      this.completeWorkflowAttempt(input)
    } catch {
      // Invalid telemetry candidates are dropped without surfacing their values.
    }
  }
  private completeWorkflowAttempt(input: CompletionInput): void {
    const attemptRecord = this.getCompletableAttempt(input)
    if (!attemptRecord) return
    const duration = this.elapsedSince(attemptRecord.workflow.startedAt)
    if (!this.completeWorkflowOutcome(attemptRecord, input, duration)) return
    attemptRecord.completionRecorded = true
  }
  private getCompletableAttempt(input: CompletionInput): AttemptRecord | undefined {
    const attemptRecord = this.getAttemptRecord(input?.attempt)
    return this.canReportAttemptObservation(attemptRecord, 'completionRecorded')
      ? attemptRecord
      : undefined
  }
  private completeWorkflowOutcome(
    attemptRecord: AttemptRecord,
    input: CompletionInput,
    duration: number | undefined,
  ): boolean {
    return attemptRecord.workflow.workflow === 'onboarding'
      ? this.completeOnboardingOutcome(attemptRecord, input, duration)
      : this.completeOperationalOutcome(attemptRecord, duration)
  }
  private completeOnboardingOutcome(
    attemptRecord: AttemptRecord,
    input: CompletionInput,
    duration: number | undefined,
  ): boolean {
    if (!('onboardingExpiresAt' in input)) return false
    this.completeOnboardingWorkflow(attemptRecord, input, duration)
    return true
  }
  private completeOperationalOutcome(
    attemptRecord: AttemptRecord,
    duration: number | undefined,
  ): boolean {
    this.completeOperationalWorkflow(attemptRecord, duration)
    return true
  }

  private completeOnboardingWorkflow(
    attemptRecord: AttemptRecord,
    input: OnboardingCompletionInput,
    duration: number | undefined,
  ): void {
    const record = attemptRecord.workflow
    this.emitWorkflowCompletionEvent(
      'onboarding_registration_completed',
      attemptRecord,
      duration,
    )
    this.persistCompletedOnboardingTiming(record, input.onboardingExpiresAt)
  }
  private emitWorkflowCompletionEvent(
    event: 'onboarding_registration_completed' | 'workflow_completed',
    attemptRecord: AttemptRecord,
    duration: number | undefined,
  ): void {
    this.emitEvent(event, {
      ...this.createWorkflowEventProperties(attemptRecord.workflow),
      ...this.createAttemptEventProperties(attemptRecord),
      ...this.createDurationEventProperties(duration),
    })
  }
  private persistCompletedOnboardingTiming(
    record: WorkflowRecord,
    expiresAt: number,
  ): void {
    if (!record.occurrenceId || !isValidDeadline(record.startedAt, expiresAt)) return
    this.writePersistedTiming({
      occurrenceId: record.occurrenceId,
      startedAt: record.startedAt,
      expiresAt,
    })
  }

  private completeOperationalWorkflow(
    attemptRecord: AttemptRecord,
    duration: number | undefined,
  ): void {
    this.emitWorkflowCompletionEvent('workflow_completed', attemptRecord, duration)
  }
  endWorkflow(input: Parameters<ProductTelemetryProvider['endWorkflow']>[0]): void {
    try {
      const record = this.getWorkflowRecord(input?.workflow)
      if (this.canEndWorkflow(record)) {
        this.scheduleWorkflowEnd(record, input.workflow as object)
      }
    } catch {
      // Ending analytics state is best-effort and never delays unmount.
    }
  }
  private canEndWorkflow(record: WorkflowRecord | undefined): record is WorkflowRecord {
    return Boolean(record?.active && !record.pendingEndTimer)
  }
  private scheduleWorkflowEnd(record: WorkflowRecord, handle: object): void {
    record.pendingEndTimer = setTimeout(() => this.finishWorkflowEnd(record, handle), 0)
  }
  private finishWorkflowEnd(record: WorkflowRecord, handle: object): void {
    record.pendingEndTimer = undefined
    record.active = false
    if (this.handlesByEntryKey.get(record.entryKey) === handle) {
      this.handlesByEntryKey.delete(record.entryKey)
    }
  }
  recordEmailConfirmation(
    input: Parameters<ProductTelemetryProvider['recordEmailConfirmation']>[0],
  ): void {
    try {
      this.recordConfirmationObservation(input)
    } catch {
      // Invalid telemetry candidates are dropped without surfacing their values.
    }
  }
  private recordConfirmationObservation(
    input: Parameters<ProductTelemetryProvider['recordEmailConfirmation']>[0],
  ): void {
    if (!this.rememberUniqueObservation('confirmation', input?.observationKey)) return
    const record = input.workflow ? this.getWorkflowRecord(input.workflow) : undefined
    if (!this.canReportConfirmation(record)) return
    this.emitConfirmationOutcome(input, record)
  }
  private canReportConfirmation(record: WorkflowRecord | undefined): boolean {
    return !record || this.canReportWorkflowObservation(record, record.identityGeneration)
  }
  private emitConfirmationOutcome(
    input: Parameters<ProductTelemetryProvider['recordEmailConfirmation']>[0],
    record: WorkflowRecord | undefined,
  ): void {
    if (input.outcome === 'success') {
      this.recordConfirmationSuccess(record?.occurrenceId)
      return
    }
    this.recordConfirmationFailure(input)
  }

  private recordConfirmationSuccess(occurrenceId?: string): void {
    const duration = this.getConfirmationDuration(occurrenceId)
    this.emitEvent('email_confirmation_completed', {
      ...this.createOnboardingEventProperties(occurrenceId),
      ...this.createDurationEventProperties(duration),
    })
    if (occurrenceId) this.clearPersistedTiming(occurrenceId)
  }
  private getConfirmationDuration(occurrenceId?: string): number | undefined {
    const timing = occurrenceId ? this.readPersistedTiming(occurrenceId) : undefined
    return timing ? this.elapsedSince(timing.startedAt) : undefined
  }

  private recordConfirmationFailure(input: ConfirmationFailureInput): void {
    const record = input.workflow ? this.getWorkflowRecord(input.workflow) : undefined
    this.emitOnboardingFailure('submission', input, record)
  }
  recordAccountActivationFailure(
    input: Parameters<ProductTelemetryProvider['recordAccountActivationFailure']>[0],
  ): void {
    try {
      this.recordActivationObservation(input)
    } catch {
      // Invalid telemetry candidates are dropped without surfacing their values.
    }
  }
  private recordActivationObservation(
    input: Parameters<ProductTelemetryProvider['recordAccountActivationFailure']>[0],
  ): void {
    if (!this.rememberUniqueObservation('activation', input?.observationKey)) return
    const record = input.workflow ? this.getWorkflowRecord(input.workflow) : undefined
    if (!this.canReportConfirmation(record)) return
    this.emitOnboardingFailure('account_activation', input, record)
  }
  private rememberUniqueObservation(scope: string, key: unknown): boolean {
    if (!isValidEntryKey(key)) return false
    const observationKey = `${scope}:${key}`
    if (this.seenObservationKeys.has(observationKey)) return false
    this.rememberObservationKey(observationKey)
    return true
  }
  private emitOnboardingFailure(
    phase: 'submission' | 'account_activation',
    input: OnboardingFailureInput,
    record: WorkflowRecord | undefined,
  ): void {
    this.emitEvent('workflow_failed', {
      ...this.createOnboardingEventProperties(record?.occurrenceId),
      ...this.createFailureEventProperties(phase, input.failureCode, input.statusClass),
    })
  }
  recordFeatureVisit(
    input: Parameters<ProductTelemetryProvider['recordFeatureVisit']>[0],
  ): void {
    try {
      this.recordFeatureVisitObservation(input)
    } catch {
      // Invalid telemetry candidates are dropped without surfacing their values.
    }
  }
  private recordFeatureVisitObservation(
    input: Parameters<ProductTelemetryProvider['recordFeatureVisit']>[0],
  ): void {
    if (!this.isNewAuthorizedFeatureVisit(input)) return
    this.rememberFeatureVisit(input.entryKey)
    this.emitFeatureVisit(input.feature)
  }
  private isNewAuthorizedFeatureVisit(
    input: Parameters<ProductTelemetryProvider['recordFeatureVisit']>[0],
  ): boolean {
    return (
      isValidEntryKey(input?.entryKey) &&
      isValidFeature(input?.feature) &&
      !this.seenFeatureVisitKeys.has(input.entryKey) &&
      this.hasAuthenticatedIdentity()
    )
  }
  private rememberFeatureVisit(entryKey: string): void {
    this.seenFeatureVisitKeys.add(entryKey)
    if (this.seenFeatureVisitKeys.size > 1000) {
      const oldestEntryKey = this.seenFeatureVisitKeys.values().next().value
      if (oldestEntryKey) this.seenFeatureVisitKeys.delete(oldestEntryKey)
    }
  }
  private emitFeatureVisit(feature: ProductTelemetryFeature): void {
    this.emitEvent('feature_visited', {
      feature,
    })
  }
  activate() {
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer)
      this.disposeTimer = undefined
    }
    this.initializeLifecycle()
    if (this.lastAuthObservation) this.reconcileIdentity(this.lastAuthObservation)
  }
  subscribeToPeerInvalidation(listener: () => void) {
    this.peerInvalidationListeners.add(listener)
    return () => this.peerInvalidationListeners.delete(listener)
  }
  dispose() {
    if (this.disposeTimer) clearTimeout(this.disposeTimer)
    this.disposeTimer = setTimeout(() => this.finishDisposal(), 0)
  }
  private finishDisposal(): void {
    this.disposeTimer = undefined
    this.cleanupLifecycle()
    this.identityGeneration += 1
    this.resetDisposedIdentity()
    this.deactivateWorkflowHandles()
  }
  private resetDisposedIdentity(): void {
    this.identityReady = false
    this.identityContext = undefined
    this.accountId = undefined
    this.lastAuthObservation = undefined
  }
  private deactivateWorkflowHandles(): void {
    for (const handle of this.handlesByEntryKey.values()) {
      const record = this.workflows.get(handle)
      if (record) record.active = false
    }
    this.handlesByEntryKey.clear()
  }
}

function sanitizeIdentifyEvent(
  event: CaptureResult,
  safeProperties: Properties,
): CaptureResult | null {
  if (!hasValidIdentityLink(event, safeProperties)) return null
  return createSanitizedCaptureResult('$identify', event, safeProperties)
}

function isSanitizableCaptureEvent(event: CaptureResult | null): event is CaptureResult {
  return Boolean(event && typeof event.event === 'string' && isUuid(event.uuid))
}

function pickCaptureSdkProperties(
  event: CaptureResult,
  instance: PostHog,
  token: string | undefined,
): Properties {
  return pickSdkProperties(
    event.properties,
    event.event === '$identify' ? IDENTIFY_PROPERTY_KEYS : ORDINARY_SDK_PROPERTY_KEYS,
    token,
    instance.get_distinct_id(),
  )
}

function hasValidIdentityLink(event: CaptureResult, properties: Properties): boolean {
  return productTelemetryIdentityLinkSchema.safeParse({
    event: event.event,
    distinct_id: properties.distinct_id,
    $anon_distinct_id: properties.$anon_distinct_id,
  }).success
}

function sanitizeProductEvent(
  event: CaptureResult,
  safeProperties: Properties,
): CaptureResult | null {
  const parsedEvent = parseProductEvent(event)
  if (!parsedEvent) return null
  return createSanitizedCaptureResult(event.event, event, {
    ...parsedEvent,
    ...safeProperties,
  })
}

function parseProductEvent(event: CaptureResult): ProductTelemetryEvent | undefined {
  const parsed = getProductEventSchema(event.event).safeParse({
    event: event.event,
    ...pickApplicationProperties(event.event, event.properties),
  })
  return parsed.success ? (parsed.data as ProductTelemetryEvent) : undefined
}

function getProductEventSchema(eventName: unknown) {
  return eventName === 'feature_visited'
    ? featureVisitedTelemetrySchema
    : productTelemetryWorkflowPayloadSchema
}

function createSanitizedCaptureResult(
  eventName: string,
  event: CaptureResult,
  properties: Properties,
): CaptureResult {
  return {
    event: eventName,
    uuid: event.uuid,
    ...safeEventTimestamp(event),
    properties,
  }
}

function safeEventTimestamp(event: CaptureResult): { timestamp?: Date } {
  if (!(event.timestamp instanceof Date)) return {}
  return isValidTimestamp(event.timestamp.getTime()) ? { timestamp: event.timestamp } : {}
}

function onboardingTimingStorageKey(occurrenceId: string): string {
  return `${ONBOARDING_TIMING_STORAGE_KEY_PREFIX}${occurrenceId}`
}

function persistOnboardingTiming(
  storage: Pick<Storage, 'setItem'>,
  record: OnboardingTiming,
  now: () => number,
): number {
  storage.setItem(onboardingTimingStorageKey(record.occurrenceId), JSON.stringify(record))
  return Math.max(record.expiresAt - now(), 0)
}

function pickApplicationProperties(
  eventName: string,
  properties: Properties,
): Record<string, unknown> {
  if (!isSupportedProductEvent(eventName)) return {}
  const allowed = new Set<string>(EVENT_APPLICATION_PROPERTY_KEYS)
  return Object.fromEntries(
    Object.entries(properties).filter(([key]) => allowed.has(key)),
  )
}

function pickSdkProperties(
  properties: Properties,
  allowedKeys: readonly string[],
  token: string | undefined,
  currentDistinctId: string | undefined,
): Properties {
  const allowed = new Set(allowedKeys)
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        allowed.has(key) && isSafeSdkProperty(key, value, token, currentDistinctId),
    ),
  )
}

function isSafeSdkProperty(
  key: string,
  value: unknown,
  token: string | undefined,
  currentDistinctId: string | undefined,
): boolean {
  if (key === 'token' || key === 'distinct_id') {
    const expectedValue = key === 'token' ? token : currentDistinctId
    return typeof expectedValue === 'string' && value === expectedValue
  }
  return key === '$anon_distinct_id' ? isOpaqueId(value) : typeof value === 'boolean'
}

function readAccountIdentity(account: Account | null): IdentityContext | undefined {
  if (!isEligibleTelemetryAccount(account)) return undefined
  return {
    establishmentId: account.establishmentId,
    role: account.profile,
  }
}

function isEligibleTelemetryAccount(account: Account | null): account is Account & {
  establishmentId: string
  profile: typeof UserProfile.Manager | typeof UserProfile.Operator
} {
  return Boolean(
    account &&
      typeof account.establishmentId === 'string' &&
      account.establishmentId.length > 0 &&
      isEligibleTelemetryProfile(account.profile),
  )
}

function isEligibleTelemetryProfile(
  profile: Account['profile'],
): profile is typeof UserProfile.Manager | typeof UserProfile.Operator {
  return profile === UserProfile.Manager || profile === UserProfile.Operator
}

function normalizeFields(fields: readonly unknown[]): readonly string[] {
  return [...new Set(fields.map(normalizeField).filter(isPresentString))]
}

function normalizeField(field: unknown): string | undefined {
  if (typeof field !== 'string') return undefined
  const normalized = field.replace(/\.\d+\./gu, '.*.')
  return normalized.length <= 80 ? normalized : undefined
}

function isPresentString(value: string | undefined): value is string {
  return value !== undefined
}

function getLocalStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function createOpaqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/gu, (token) => {
    const random = Math.floor(Math.random() * 16)
    return (token === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

function isOpaqueId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      value,
    )
  )
}

function isUuid(value: unknown): value is string {
  return isOpaqueId(value)
}

function isValidTimestamp(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

function isValidDeadline(startedAt: unknown, expiresAt: unknown): boolean {
  return isNumericDeadline(startedAt, expiresAt)
}

function isNumericDeadline(startedAt: unknown, expiresAt: unknown): boolean {
  const timestamps = readTimestampPair(startedAt, expiresAt)
  return timestamps ? hasValidDeadlineRange(...timestamps) : false
}

function readTimestampPair(
  startedAt: unknown,
  expiresAt: unknown,
): [number, number] | undefined {
  return typeof startedAt === 'number' && typeof expiresAt === 'number'
    ? [startedAt, expiresAt]
    : undefined
}

function hasValidDeadlineRange(startedAt: number, expiresAt: number): boolean {
  return (
    isValidTimestamp(startedAt) &&
    isValidTimestamp(expiresAt) &&
    expiresAt > startedAt &&
    expiresAt - startedAt <= ONBOARDING_LIFETIME_MS
  )
}

function isValidEntryKey(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 120
}

function isValidWorkflow(value: unknown): value is ProductTelemetryWorkflow {
  return (
    value === 'onboarding' ||
    value === 'product_creation' ||
    value === 'stock_entry' ||
    value === 'stock_write_off' ||
    value === 'production'
  )
}

function isValidFeature(value: unknown): value is ProductTelemetryFeature {
  return (
    typeof value === 'string' && SUPPORTED_FEATURES.has(value as ProductTelemetryFeature)
  )
}

function isSupportedProductEvent(value: string): value is ProductTelemetryEvent['event'] {
  return SUPPORTED_PRODUCT_EVENTS.has(value as ProductTelemetryEvent['event'])
}

function decodeOnboardingTiming(
  raw: string,
  occurrenceId: string,
  now: number,
): DecodedOnboardingTiming {
  const value: unknown = JSON.parse(raw)
  if (!isObject(value)) return { removeInvalidRecord: true }
  return decodeOnboardingTimingRecord(value, occurrenceId, now)
}

function decodeOnboardingTimingRecord(
  value: Record<string, unknown>,
  occurrenceId: string,
  now: number,
): DecodedOnboardingTiming {
  const record = value as Partial<OnboardingTiming>
  if (record.occurrenceId !== occurrenceId) return {}
  return createDecodedTiming(record, occurrenceId, now)
}

function createDecodedTiming(
  record: Partial<OnboardingTiming>,
  occurrenceId: string,
  now: number,
): DecodedOnboardingTiming {
  if (!isValidOnboardingTiming(record, now)) return { removeInvalidRecord: true }
  return { timing: createOnboardingTiming(record, occurrenceId) }
}

function createOnboardingTiming(
  record: OnboardingTiming,
  occurrenceId: string,
): OnboardingTiming {
  return { occurrenceId, startedAt: record.startedAt, expiresAt: record.expiresAt }
}

function isValidOnboardingTiming(
  record: Partial<OnboardingTiming>,
  now: number,
): record is OnboardingTiming {
  return (
    typeof record.startedAt === 'number' &&
    typeof record.expiresAt === 'number' &&
    isValidDeadline(record.startedAt, record.expiresAt) &&
    record.expiresAt > now
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readInvalidationMarker(value: unknown): string | undefined {
  if (isOpaqueId(value)) return value
  if (!isObject(value) || !isOpaqueId(value.marker)) return undefined
  return value.marker
}
