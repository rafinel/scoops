import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Notification } from '@scoops/core/communication/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { showNotificationToast } from '@/ui/shared/notifications'
import { communicationQueryKeys } from '@/ui/communication/hooks/communication-query-keys'

const LOCK_NAME = 'scoops-notifications-leader'
const LEASE_KEY = 'scoops-notifications-leader-lease'
const CHANNEL_NAME = 'scoops-notifications'
const LEASE_DURATION_MS = 10_000
const LEASE_RENEWAL_MS = 3_000
const INVALIDATION_MESSAGE_VERSION = 1

type NotificationLease = { expiresAt: number; ownerId: string }
type AuthAccount = ReturnType<typeof useAuthContext>['account']
type QueryClient = ReturnType<typeof useQueryClient>
type StateSetter<T> = Dispatch<SetStateAction<T>>
type ShellAuth = ReturnType<typeof useNotificationShellAuth>
type ShellView = ReturnType<typeof useNotificationShellView>
type Leadership = ReturnType<typeof useNotificationLeadership>

type NotificationLeadershipConfig = {
  client: QueryClient
  eligible: boolean
  refs: ReturnType<typeof useNotificationLeadershipRefs>
  scope: string
  setLeader: (value: boolean) => void
}

type NotificationLeadershipRuntimeConfig = Omit<
  NotificationLeadershipConfig,
  'refs' | 'setLeader'
>

type NotificationShellValue = {
  account: AuthAccount
  clearSelectedNotification: () => void
  closeNotifications: () => void
  dismissNotification: (notificationId: string) => void
  isEligible: boolean
  isLeader: boolean
  isNotificationsOpen: boolean
  notificationChannel: BroadcastChannel | null
  onNotification: (notification: Notification) => Promise<void> | void
  openNotification: (notification: Notification) => void
  openNotifications: () => void
  queuedNotifications: Notification[]
  selectedNotification: Notification | null
  visibleNotifications: Notification[]
}

export function useNotificationShellProvider(): NotificationShellValue {
  const state = useNotificationShellState()
  useNotificationIdentityReset(
    state.account,
    state.closeNotifications,
    state.clearNotifications,
  )
  return state
}

function useNotificationShellState() {
  const auth = useNotificationShellAuth()
  const [view, leadership, queue] = useNotificationShellDependencies(auth)

  return Object.assign({}, view, leadership, queue, {
    account: auth.account,
    isEligible: auth.isEligible,
  })
}

function useNotificationShellDependencies(auth: ShellAuth) {
  const client = useQueryClient(),
    view = useNotificationShellView()
  const leaderConfig = { client, eligible: auth.isEligible, scope: auth.authScope }
  const leader = useNotificationLeadership(leaderConfig)
  return useNotificationShellQueue(auth, client, view, leader)
}

function useNotificationShellQueue(
  auth: ShellAuth,
  queryClient: QueryClient,
  view: ShellView,
  leadership: Leadership,
) {
  const queue = useNotificationQueue(
    auth.account,
    queryClient,
    leadership.notificationChannel,
    view.openNotification,
  )
  return [view, leadership, queue] as const
}

function useNotificationShellAuth() {
  const { account, status } = useAuthContext()
  return {
    account,
    authScope: `${status}:${account?.id ?? ''}:${account?.establishmentId ?? ''}`,
    isEligible: isEligibleNotificationAccount(status, account),
  }
}

function useNotificationShellView() {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Notification | null>(null)
  const actions = useNotificationShellActions(setIsOpen, setSelected)
  return { ...actions, isNotificationsOpen: isOpen, selectedNotification: selected }
}

function useNotificationShellActions(
  setNotificationsOpen: Dispatch<SetStateAction<boolean>>,
  setSelectedNotification: Dispatch<SetStateAction<Notification | null>>,
) {
  const actions = useMemo(
    () => createNotificationShellActions(setNotificationsOpen, setSelectedNotification),
    [setNotificationsOpen, setSelectedNotification],
  )
  return actions
}

function createNotificationShellActions(
  setNotificationsOpen: StateSetter<boolean>,
  setSelectedNotification: StateSetter<Notification | null>,
) {
  const setters = { setNotificationsOpen, setSelectedNotification }
  return {
    clearSelectedNotification: () => setSelectedNotification(null),
    closeNotifications: createCloseNotificationHandler(setters),
    openNotification: createOpenNotificationHandler(setters),
    openNotifications: () => setNotificationsOpen(true),
  }
}

type NotificationShellSetters = {
  setNotificationsOpen: StateSetter<boolean>
  setSelectedNotification: StateSetter<Notification | null>
}

function createOpenNotificationHandler(setters: NotificationShellSetters) {
  return (notification: Notification) => {
    setters.setSelectedNotification(notification)
    setters.setNotificationsOpen(true)
  }
}

function createCloseNotificationHandler(setters: NotificationShellSetters) {
  return () => {
    setters.setNotificationsOpen(false)
    setters.setSelectedNotification(null)
  }
}

function isEligibleNotificationAccount(
  status: ReturnType<typeof useAuthContext>['status'],
  account: AuthAccount,
) {
  return (
    status === 'authenticated' &&
    account !== null &&
    (account.profile === UserProfile.Manager || account.profile === UserProfile.Operator)
  )
}

function useNotificationIdentityReset(
  account: AuthAccount,
  closeNotifications: () => void,
  clearNotifications: () => void,
) {
  const key = `${account?.id ?? ''}:${account?.establishmentId ?? ''}`
  const previous = useRef(key)
  useEffect(
    () =>
      resetNotificationIdentity(previous, key, closeNotifications, clearNotifications),
    [clearNotifications, closeNotifications, key],
  )
}

function resetNotificationIdentity(
  previousIdentityKeyRef: { current: string },
  identityKey: string,
  closeNotifications: () => void,
  clearNotifications: () => void,
) {
  if (previousIdentityKeyRef.current === identityKey) return
  previousIdentityKeyRef.current = identityKey
  closeNotifications()
  clearNotifications()
}

function useNotificationLeadership(config: NotificationLeadershipRuntimeConfig) {
  const [isLeader, refs] = useNotificationLeadershipRuntime(config)
  return { isLeader, notificationChannel: refs.channel.current }
}

function useNotificationLeadershipRuntime(config: NotificationLeadershipRuntimeConfig) {
  const [isLeader, setLeader] = useState(false)
  const refs = useNotificationLeadershipRefs()
  const input = useNotificationLeadershipConfig({ ...config, refs, setLeader })
  useNotificationLeadershipEffect(input)
  return [isLeader, refs] as const
}

function useNotificationLeadershipRefs() {
  const available = useRealtimeEnvironmentAvailability()
  const owner = useRef(createNotificationOwnerId())
  const channel = useRef<BroadcastChannel | null>(null)
  return useMemo(() => ({ available, channel, owner }), [available])
}

function createNotificationOwnerId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36)
}

function useNotificationLeadershipConfig(config: NotificationLeadershipConfig) {
  const { client, eligible, refs, scope, setLeader } = config
  return useMemo(
    () => createNotificationLeadershipInput(scope, eligible, client, refs, setLeader),
    [client, eligible, refs, scope, setLeader],
  )
}

function createNotificationLeadershipInput(
  scope: string,
  eligible: boolean,
  client: QueryClient,
  refs: ReturnType<typeof useNotificationLeadershipRefs>,
  setLeader: (value: boolean) => void,
) {
  return { ...refs, client, eligible, scope, setLeader }
}

function useNotificationLeadershipEffect(input: NotificationLeadershipConnection) {
  const setup = useCallback(() => setupNotificationLeadership(input), [input])
  useEffect(setup, [setup])
}

function useRealtimeEnvironmentAvailability() {
  const [isAvailable, setIsAvailable] = useState(isRealtimeEnvironmentAvailable)
  useEffect(() => subscribeToRealtimeAvailability(setIsAvailable), [])
  return isAvailable
}

function subscribeToRealtimeAvailability(setIsAvailable: (value: boolean) => void) {
  const updateAvailability = () => setIsAvailable(isRealtimeEnvironmentAvailable())
  addRealtimeAvailabilityListeners(updateAvailability)
  updateAvailability()
  return () => removeRealtimeAvailabilityListeners(updateAvailability)
}

function addRealtimeAvailabilityListeners(listener: () => void) {
  document.addEventListener('visibilitychange', listener)
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
}

function removeRealtimeAvailabilityListeners(listener: () => void) {
  document.removeEventListener('visibilitychange', listener)
  window.removeEventListener('online', listener)
  window.removeEventListener('offline', listener)
}

function setupNotificationLeadership(input: NotificationLeadershipConnection) {
  return isNotificationLeadershipDisabled(input.scope, input.eligible, input.available)
    ? input.setLeader(false)
    : connectNotificationLeadership(input)
}

function isNotificationLeadershipDisabled(
  authScope: string,
  isEligible: boolean,
  isRealtimeAvailable: boolean,
) {
  return !isEligible || !authScope || !isRealtimeAvailable
}

type NotificationLeadershipConnection = {
  available: boolean
  scope: string
  channel: { current: BroadcastChannel | null }
  eligible: boolean
  owner: { current: string }
  client: QueryClient
  setLeader: (value: boolean) => void
}

function connectNotificationLeadership(input: NotificationLeadershipConnection) {
  const { scope, client } = input
  const coordination = createCoordinationScope(scope)
  const cleanup = acquireNotificationLeadership(input, coordination)
  const connection = createNotificationLeadershipChannel(input, coordination, client)
  return () => createNotificationLeadershipCleanup(input, connection, cleanup)
}

function createNotificationLeadershipCleanup(
  input: NotificationLeadershipConnection,
  connection: ReturnType<typeof createNotificationLeadershipChannel>,
  cleanup: () => void,
) {
  return cleanupNotificationLeadership(
    input.channel,
    connection.channel,
    connection.handleMessage,
    cleanup,
    input.setLeader,
  )
}

function createNotificationLeadershipChannel(
  input: NotificationLeadershipConnection,
  coordination: ReturnType<typeof createCoordinationScope>,
  client: QueryClient,
) {
  const channel = createChannel(coordination.channelName)
  input.channel.current = channel
  const handleMessage = createInvalidationHandler(input.scope, client)
  channel?.addEventListener('message', handleMessage)
  return { channel, handleMessage }
}

function acquireNotificationLeadership(
  input: NotificationLeadershipConnection,
  coordination: ReturnType<typeof createCoordinationScope>,
) {
  const { owner, setLeader } = input
  return acquireLeadership(
    owner.current,
    coordination.leaseKey,
    coordination.lockName,
    setLeader,
  )
}

function createInvalidationHandler(authScope: string, queryClient: QueryClient) {
  return (event: MessageEvent) => {
    if (!isNotificationInvalidationMessage(event.data, authScope)) return
    void queryClient.invalidateQueries({ queryKey: communicationQueryKeys.all })
  }
}

function cleanupNotificationLeadership(
  channelRef: { current: BroadcastChannel | null },
  channel: BroadcastChannel | null,
  handleMessage: (event: MessageEvent) => void,
  cleanup: () => void,
  setIsLeader: (value: boolean) => void,
) {
  channel?.removeEventListener('message', handleMessage)
  channel?.close()
  channelRef.current = null
  cleanup()
  setIsLeader(false)
}

function useNotificationQueue(
  account: AuthAccount,
  queryClient: QueryClient,
  channel: BroadcastChannel | null,
  onOpen: (notification: Notification) => void,
) {
  const queue = useNotificationQueueState(onOpen)
  const handler = useNotificationQueueHandler(account, queryClient, channel, queue)
  useNotificationQueueCleanup(queue.clearNotifications)
  return createNotificationQueueResult(queue, handler)
}

function useNotificationQueueCleanup(clearNotifications: () => void) {
  useEffect(() => () => clearNotifications(), [clearNotifications])
}

function createNotificationQueueResult(
  queue: NotificationQueueState,
  handleNotification: (notification: Notification) => Promise<void> | void,
) {
  return {
    clearNotifications: queue.clearNotifications,
    dismissNotification: queue.dismissNotification,
    onNotification: handleNotification,
    queuedNotifications: queue.queuedNotifications,
    visibleNotifications: queue.visibleNotifications,
  }
}

function getNotificationIdentityKey(account: AuthAccount) {
  return `${account?.id ?? ''}:${account?.establishmentId ?? ''}`
}

function useNotificationQueueState(onOpen: (notification: Notification) => void) {
  const refs = useNotificationQueueRefs()
  const actions = useNotificationQueueActions(refs)
  const presentNotification = useNotificationQueuePresenter(refs, actions, onOpen)
  useNotificationQueueDrain(refs, presentNotification)
  return Object.assign({}, refs, actions, { presentNotification })
}

function useNotificationQueuePresenter(
  refs: NotificationQueueRefs,
  actions: ReturnType<typeof useNotificationQueueActions>,
  onOpen: (notification: Notification) => void,
) {
  return useNotificationPresenter(refs, actions.dismissNotification, onOpen)
}

function useNotificationQueueRefs() {
  const mutableRefs = useRef(createNotificationMutableRefs())
  const state = useNotificationQueueRenderState()
  return useMemo(
    () => createNotificationQueueRefsValue(mutableRefs.current, state),
    [state],
  )
}

function useNotificationQueueRenderState() {
  const [visible, setVisible] = useState<Notification[]>([])
  const [queued, setQueued] = useState<Notification[]>([])
  return useMemo(
    () => [queued, setQueued, setVisible, visible] as const,
    [queued, visible],
  )
}

type NotificationQueueStateTuple = ReturnType<typeof useNotificationQueueRenderState>

function createNotificationQueueRefsValue(
  mutableRefs: ReturnType<typeof createNotificationMutableRefs>,
  state: NotificationQueueStateTuple,
) {
  return Object.assign({}, mutableRefs, createNotificationQueueStateValue(state))
}

function createNotificationQueueStateValue(state: NotificationQueueStateTuple) {
  return {
    queuedNotifications: state[0],
    setQueuedNotifications: state[1],
    setVisibleNotifications: state[2],
    visibleNotifications: state[3],
  }
}

function createNotificationRef<T>(current: T) {
  return { current }
}

function createNotificationMutableRefs() {
  return Object.assign(
    createNotificationProcessingRefs(),
    createNotificationDisplayRefs(),
  )
}

function createNotificationProcessingRefs() {
  return {
    generationRef: createNotificationRef(0),
    processingRef: createNotificationRef(Promise.resolve()),
    queuedRef: createNotificationRef([] as Notification[]),
  }
}

function createNotificationDisplayRefs() {
  return {
    seenIdsRef: createNotificationRef(new Set<string>()),
    toastIdsRef: createNotificationRef(new Map<string, string | number>()),
    visibleIdsRef: createNotificationRef(new Set<string>()),
  }
}

type NotificationQueueRefs = ReturnType<typeof useNotificationQueueRefs>

function useNotificationQueueActions(refs: NotificationQueueRefs) {
  const refsRef = useRef(refs)
  refsRef.current = refs
  return useMemo(
    () => ({
      clearNotifications: () => clearNotificationQueue(refsRef.current),
      dismissNotification: (notificationId: string) =>
        dismissQueuedNotification(refsRef.current, notificationId),
    }),
    [],
  )
}

function dismissQueuedNotification(refs: NotificationQueueRefs, id: string) {
  refs.visibleIdsRef.current.delete(id)
  dismissNotificationToast(refs.toastIdsRef, id)
  removeNotificationFromQueue(refs, id)
}

function removeNotificationFromQueue(refs: NotificationQueueRefs, id: string) {
  refs.setVisibleNotifications((items) => items.filter((item) => item.id !== id))
  refs.queuedRef.current = refs.queuedRef.current.filter((item) => item.id !== id)
  refs.setQueuedNotifications(refs.queuedRef.current)
}

function dismissNotificationToast(
  toastIdsRef: NotificationQueueRefs['toastIdsRef'],
  notificationId: string,
) {
  const toastId = toastIdsRef.current.get(notificationId)
  if (toastId === undefined) return
  toast.dismiss(toastId)
  toastIdsRef.current.delete(notificationId)
}

function clearNotificationQueue(refs: NotificationQueueRefs) {
  refs.generationRef.current += 1
  dismissNotificationToasts(refs.toastIdsRef)
  resetNotificationQueueState(refs)
}

function resetNotificationQueueState(refs: NotificationQueueRefs) {
  refs.visibleIdsRef.current.clear()
  refs.seenIdsRef.current.clear()
  refs.queuedRef.current = []
  refs.setVisibleNotifications([])
  refs.setQueuedNotifications([])
}

function dismissNotificationToasts(toastIdsRef: NotificationQueueRefs['toastIdsRef']) {
  for (const toastId of toastIdsRef.current.values()) toast.dismiss(toastId)
  toastIdsRef.current.clear()
}

function useNotificationPresenter(
  refs: NotificationQueueRefs,
  dismissNotification: (notificationId: string) => void,
  onOpen: (notification: Notification) => void,
) {
  return useMemo(
    () => (notification: Notification) =>
      presentNotification(refs, notification, dismissNotification, onOpen),
    [dismissNotification, onOpen, refs],
  )
}

function presentNotification(
  refs: NotificationQueueRefs,
  notification: Notification,
  dismissNotification: (notificationId: string) => void,
  onOpen: (notification: Notification) => void,
) {
  refs.visibleIdsRef.current.add(notification.id)
  refs.setVisibleNotifications((current) => [notification, ...current])
  rememberNotificationToast(
    refs,
    notification.id,
    createNotificationToast(notification, dismissNotification, onOpen),
  )
}

function createNotificationToast(
  notification: Notification,
  dismissNotification: (notificationId: string) => void,
  onOpen: (notification: Notification) => void,
) {
  return showNotificationToast(
    notification,
    createToastOptions(notification, dismissNotification, onOpen),
  )
}

function rememberNotificationToast(
  refs: NotificationQueueRefs,
  notificationId: string,
  toastId: string | number | null,
) {
  if (toastId !== null && toastId !== undefined)
    refs.toastIdsRef.current.set(notificationId, toastId)
}

function createToastOptions(
  notification: Notification,
  dismissNotification: (notificationId: string) => void,
  onOpen: (notification: Notification) => void,
) {
  return {
    onDismiss: () => dismissNotification(notification.id),
    onOpen: () => onOpen(notification),
  }
}

function useNotificationQueueHandler(
  account: AuthAccount,
  queryClient: QueryClient,
  channel: BroadcastChannel | null,
  queue: NotificationQueueState,
) {
  return useMemo(
    () =>
      createNotificationQueueHandler({
        account,
        channel,
        identityKey: getNotificationIdentityKey(account),
        queryClient,
        queue,
      }),
    [account, channel, queryClient, queue],
  )
}

function createNotificationQueueHandler(input: NotificationQueueHandlerInput) {
  return (notification: Notification) => handleQueuedNotification(notification, input)
}

type NotificationQueueState = ReturnType<typeof useNotificationQueueState>

type NotificationQueueHandlerInput = {
  account: AuthAccount
  channel: BroadcastChannel | null
  identityKey: string
  queryClient: QueryClient
  queue: NotificationQueueState
}

function handleQueuedNotification(
  notification: Notification,
  input: NotificationQueueHandlerInput,
) {
  const queue = input.queue
  if (queue.seenIdsRef.current.has(notification.id)) return queue.processingRef.current
  queue.seenIdsRef.current.add(notification.id)
  return queueNotification(notification, input, queue.generationRef.current)
}

function queueNotification(
  notification: Notification,
  input: NotificationQueueHandlerInput,
  generation: number,
) {
  const queue = input.queue
  const next = queue.processingRef.current.then(() =>
    processNotification(notification, input, generation),
  )
  queue.processingRef.current = next.catch(() => undefined)
  return next
}

async function processNotification(
  notification: Notification,
  input: NotificationQueueHandlerInput,
  generation: number,
) {
  if (!isNotificationForAccount(notification, input.account)) return
  await input.queryClient.invalidateQueries({ queryKey: communicationQueryKeys.all })
  if (generation !== input.queue.generationRef.current) return
  broadcastNotificationInvalidation(input.channel, input.identityKey)
  enqueueOrPresentNotification(notification, input.queue)
}

function broadcastNotificationInvalidation(
  channel: BroadcastChannel | null,
  authScope: string,
) {
  channel?.postMessage({
    type: 'notifications.invalidate',
    version: INVALIDATION_MESSAGE_VERSION,
    authScope,
  })
}

function enqueueOrPresentNotification(
  notification: Notification,
  queue: NotificationQueueState,
) {
  if (queue.visibleIdsRef.current.size < 3) return queue.presentNotification(notification)
  queue.queuedRef.current = [...queue.queuedRef.current, notification]
  queue.setQueuedNotifications(queue.queuedRef.current)
}

function useNotificationQueueDrain(
  refs: NotificationQueueRefs,
  presentNotification: (notification: Notification) => void,
) {
  useEffect(() => {
    drainNextNotification(refs, presentNotification)
  }, [presentNotification, refs])
}

function drainNextNotification(
  refs: NotificationQueueRefs,
  presentNotification: (notification: Notification) => void,
) {
  if (!hasNotificationCapacity(refs)) return
  const next = refs.queuedRef.current.shift()
  if (!next) return
  refs.setQueuedNotifications([...refs.queuedRef.current])
  presentNotification(next)
}

function hasNotificationCapacity(refs: NotificationQueueRefs) {
  return refs.visibleNotifications.length < 3 && refs.visibleIdsRef.current.size < 3
}

function isNotificationForAccount(notification: Notification, account: AuthAccount) {
  return Boolean(
    account &&
      notification.recipientUserId === account.id &&
      notification.establishmentId === account.establishmentId,
  )
}

function createChannel(channelName: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(channelName)
}

function acquireLeadership(
  ownerId: string,
  leaseKey: string,
  lockName: string,
  setLeader: (isLeader: boolean) => void,
) {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  if (locks) return acquireNavigatorLock(locks, lockName, setLeader)
  return acquireLease(ownerId, leaseKey, setLeader)
}

type NavigatorLeadershipState = {
  active: boolean
  releaseLock: (() => void) | null
  retryTimer: number | null
}

function acquireNavigatorLock(
  locks: LockManager,
  lockName: string,
  setLeader: (isLeader: boolean) => void,
) {
  const state: NavigatorLeadershipState = {
    active: true,
    releaseLock: null,
    retryTimer: null,
  }
  const retry = () => requestNavigatorLock(locks, lockName, state, setLeader, retry)
  retry()
  return () => releaseNavigatorLock(state, setLeader)
}

function requestNavigatorLock(
  locks: LockManager,
  lockName: string,
  state: NavigatorLeadershipState,
  setLeader: (isLeader: boolean) => void,
  retry: () => void,
) {
  if (!state.active) return
  void locks.request(lockName, { ifAvailable: true }, (lock) => {
    if (!lock || !state.active) return handleUnavailableLock(state, setLeader, retry)
    setLeader(true)
    return new Promise<void>((resolve) => {
      state.releaseLock = resolve
    })
  })
}

function handleUnavailableLock(
  state: NavigatorLeadershipState,
  setLeader: (isLeader: boolean) => void,
  retry: () => void,
) {
  setLeader(false)
  if (state.active && state.retryTimer === null) scheduleLockRetry(state, retry)
  return undefined
}

function scheduleLockRetry(state: NavigatorLeadershipState, retry: () => void) {
  state.retryTimer = window.setTimeout(() => {
    state.retryTimer = null
    retry()
  }, LEASE_RENEWAL_MS)
}

function releaseNavigatorLock(
  state: NavigatorLeadershipState,
  setLeader: (isLeader: boolean) => void,
) {
  state.active = false
  if (state.retryTimer !== null) window.clearTimeout(state.retryTimer)
  state.releaseLock?.()
  setLeader(false)
}

function acquireLease(
  ownerId: string,
  leaseKey: string,
  setLeader: (isLeader: boolean) => void,
) {
  const state = { isLeader: false }
  const renew = () => renewLease(ownerId, leaseKey, state, setLeader)
  renew()
  const timer = window.setInterval(renew, LEASE_RENEWAL_MS)
  return () => releaseLease(timer, ownerId, leaseKey, state, setLeader)
}

function renewLease(
  ownerId: string,
  leaseKey: string,
  state: { isLeader: boolean },
  setLeader: (isLeader: boolean) => void,
) {
  const current = readLease(leaseKey)
  if (isLeaseHeldByOther(current, ownerId)) {
    return updateLeaseLeadership(state, setLeader, false)
  }
  writeLease(leaseKey, { ownerId, expiresAt: Date.now() + LEASE_DURATION_MS })
  updateLeaseLeadership(state, setLeader, true)
}

function isLeaseHeldByOther(lease: NotificationLease | null, ownerId: string) {
  return Boolean(lease && lease.expiresAt > Date.now() && lease.ownerId !== ownerId)
}

function updateLeaseLeadership(
  state: { isLeader: boolean },
  setLeader: (isLeader: boolean) => void,
  isLeader: boolean,
) {
  state.isLeader = isLeader
  setLeader(isLeader)
}

function releaseLease(
  timer: number,
  ownerId: string,
  leaseKey: string,
  state: { isLeader: boolean },
  setLeader: (isLeader: boolean) => void,
) {
  window.clearInterval(timer)
  if (state.isLeader && readLease(leaseKey)?.ownerId === ownerId)
    localStorage.removeItem(leaseKey)
  setLeader(false)
}

function readLease(leaseKey: string): NotificationLease | null {
  try {
    const value = localStorage.getItem(leaseKey)
    return value ? (JSON.parse(value) as NotificationLease) : null
  } catch {
    return null
  }
}

function writeLease(leaseKey: string, lease: NotificationLease) {
  try {
    localStorage.setItem(leaseKey, JSON.stringify(lease))
  } catch {
    // Cross-tab coordination is best effort in restricted browser storage modes.
  }
}

function isRealtimeEnvironmentAvailable() {
  return (
    typeof document !== 'undefined' &&
    document.visibilityState === 'visible' &&
    (typeof navigator === 'undefined' || navigator.onLine !== false)
  )
}

function createCoordinationScope(authScope: string) {
  const encodedScope = encodeURIComponent(authScope)
  return {
    channelName: `${CHANNEL_NAME}:${encodedScope}`,
    leaseKey: `${LEASE_KEY}:${encodedScope}`,
    lockName: `${LOCK_NAME}:${encodedScope}`,
  }
}

function isNotificationInvalidationMessage(
  value: unknown,
  authScope: string,
): value is {
  authScope: string
  type: 'notifications.invalidate'
  version: typeof INVALIDATION_MESSAGE_VERSION
} {
  return (
    isRecord(value) &&
    value.type === 'notifications.invalidate' &&
    value.version === INVALIDATION_MESSAGE_VERSION &&
    value.authScope === authScope
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
