import { BROWSER_ENV } from '@/constants'

export type NotificationEventSource = Pick<
  EventSource,
  'addEventListener' | 'removeEventListener' | 'close'
> & {
  onerror: ((this: EventSource, event: Event) => unknown) | null
  onopen: ((this: EventSource, event: Event) => unknown) | null
}

export type NotificationEventSourceFactory = () => NotificationEventSource

export function createNotificationRealtimeClient(): NotificationEventSource {
  const streamUrl = `${BROWSER_ENV.scoopsServerRestUrl.replace(/\/$/, '')}/notifications/stream`
  return new EventSource(streamUrl, { withCredentials: true })
}
