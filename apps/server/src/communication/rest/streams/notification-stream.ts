import type { Notification } from '@scoops/core/communication/domain/entities'
import type { Response } from 'express'

import { NotificationRealtimeEventResponseDto } from '@/communication/rest/dtos/notification-realtime-event-response.dto'

const NOTIFICATION_EVENT_NAME = 'notification.created'

class ResponseDrainWaiter {
  private readonly onDrain = () => this.resolve()
  private readonly onClose = () => this.reject('A conexão SSE foi encerrada.')
  private readonly onError = () => this.reject('A conexão SSE encontrou um erro.')

  constructor(
    private readonly response: Response,
    private readonly resolvePromise: () => void,
    private readonly rejectPromise: (reason: Error) => void,
  ) {}

  attach(): void {
    this.response.once('drain', this.onDrain)
    this.response.once('close', this.onClose)
    this.response.once('error', this.onError)
  }

  private resolve(): void {
    this.cleanup()
    this.resolvePromise()
  }

  private reject(message: string): void {
    this.cleanup()
    this.rejectPromise(new Error(message))
  }

  private cleanup(): void {
    this.response.off('drain', this.onDrain)
    this.response.off('close', this.onClose)
    this.response.off('error', this.onError)
  }
}

export class NotificationStream {
  private readonly startedPromise: Promise<void>
  private resolveStarted!: () => void
  private writeTail = Promise.resolve()
  private started = false
  private closed = false

  constructor(private readonly response: Response) {
    this.startedPromise = new Promise((resolve) => {
      this.resolveStarted = resolve
    })
  }

  start(): void {
    if (this.closed || this.started) return

    this.configureResponse()
    this.started = true
    this.resolveStarted()
    this.response.write('\n')
  }

  abort(): void {
    this.closed = true
    this.resolveStarted()
  }

  writeNotification(notification: Notification): Promise<void> {
    const event = NotificationRealtimeEventResponseDto.from(notification)
    return this.enqueue(
      `event: ${NOTIFICATION_EVENT_NAME}\nid: ${notification.id}\ndata: ${JSON.stringify(event)}\n\n`,
    )
  }

  writeHeartbeat(): Promise<void> {
    return this.enqueue(': heartbeat\n\n')
  }

  close(): void {
    if (this.closed) return

    this.closed = true
    this.resolveStarted()
    if (this.started && !this.response.writableEnded) this.response.end()
  }

  private enqueue(payload: string): Promise<void> {
    const write = this.writeTail.then(() => this.writePayload(payload))

    this.writeTail = write.catch(() => undefined)
    return write
  }

  private async writePayload(payload: string): Promise<void> {
    await this.startedPromise
    if (this.closed || !this.started || this.response.writableEnded) return
    if (this.response.write(payload)) return
    await this.waitForDrain()
  }

  private waitForDrain(): Promise<void> {
    return new Promise((resolve, reject) => {
      new ResponseDrainWaiter(this.response, resolve, reject).attach()
    })
  }

  private configureResponse(): void {
    this.response.statusCode = 200
    this.response.set(NOTIFICATION_STREAM_HEADERS)
    this.response.flushHeaders()
  }
}

const NOTIFICATION_STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
}
