import type { Notification } from '@scoops/core/communication/domain/entities'
import type { Response } from 'express'

import { NotificationRealtimeEventResponseDto } from '@/communication/rest/dtos/notification-realtime-event-response.dto'

const NOTIFICATION_EVENT_NAME = 'notification.created'

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

    this.response.statusCode = 200
    this.response.setHeader('Content-Type', 'text/event-stream')
    this.response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    this.response.setHeader('Connection', 'keep-alive')
    this.response.setHeader('X-Accel-Buffering', 'no')
    this.response.flushHeaders()
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
    const write = this.writeTail.then(async () => {
      await this.startedPromise
      if (this.closed || !this.started || this.response.writableEnded) return

      if (this.response.write(payload)) return
      await this.waitForDrain()
    })

    this.writeTail = write.catch(() => undefined)
    return write
  }

  private waitForDrain(): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.response.off('drain', onDrain)
        this.response.off('close', onClose)
        this.response.off('error', onError)
      }
      const onDrain = () => {
        cleanup()
        resolve()
      }
      const onClose = () => {
        cleanup()
        reject(new Error('A conexão SSE foi encerrada.'))
      }
      const onError = () => {
        cleanup()
        reject(new Error('A conexão SSE encontrou um erro.'))
      }

      this.response.once('drain', onDrain)
      this.response.once('close', onClose)
      this.response.once('error', onError)
    })
  }
}
