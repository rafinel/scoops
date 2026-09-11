import { Get, HttpStatus, Inject, Req, Res } from '@nestjs/common'
import { ApiHeader, ApiProduces, ApiResponse } from '@nestjs/swagger'
import type { NotificationAudienceProvider } from '@scoops/core/communication/interfaces'
import type { NotificationRealtimeSubscriber } from '@scoops/core/communication/interfaces'
import {
  StreamNotificationsUseCase,
  type StreamNotificationsRequest,
} from '@scoops/core/communication/use-cases'
import type { Response } from 'express'
import type { Request } from 'express'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants'
import { NotificationsController } from '@/communication/decorators'
import { NotificationStream } from '@/communication/rest/streams/notification-stream'
import { ErrorResponseDto } from '@/shared/rest/dtos'

const HEARTBEAT_INTERVAL_MS = 20_000
type NotificationStreamAccount = StreamNotificationsRequest['actor']
type SessionRevalidation = () => Promise<boolean>

type AuthenticatedCommunicationRequest = Request & {
  account: NotificationStreamAccount
  revalidateAuthSession: SessionRevalidation
}

class NotificationStreamLifecycle {
  readonly stream: NotificationStream
  readonly abortController = new AbortController()
  private closed = false
  private cleanupCallback: (() => Promise<void>) | undefined
  private heartbeat: ReturnType<typeof setInterval> | undefined

  constructor(response: Response) {
    this.stream = new NotificationStream(response)
  }

  get isClosed(): boolean {
    return this.closed
  }

  get cleanup(): (() => Promise<void>) | undefined {
    return this.cleanupCallback
  }

  setCleanup(cleanup: () => Promise<void>): void {
    this.cleanupCallback = cleanup
  }

  setHeartbeat(heartbeat: ReturnType<typeof setInterval>): void {
    this.heartbeat = heartbeat
  }

  abort(): void {
    this.stream.abort()
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    if (this.heartbeat) clearInterval(this.heartbeat)
    this.abortController.abort()
    await this.cleanupCallback?.()
    this.stream.close()
  }
}

@NotificationsController()
export class StreamNotificationsController {
  private readonly useCase: StreamNotificationsUseCase

  constructor(
    @Inject(COMMUNICATION_PROVIDERS.notificationRealtime)
    realtimeSubscriber: NotificationRealtimeSubscriber,
    @Inject(COMMUNICATION_PROVIDERS.notificationAudience)
    audienceProvider: NotificationAudienceProvider,
  ) {
    this.useCase = new StreamNotificationsUseCase(realtimeSubscriber, audienceProvider)
  }

  @Get('stream')
  @ApiProduces('text/event-stream')
  @ApiHeader({
    name: 'Last-Event-ID',
    required: false,
    description: 'Reconecta no ponto atual; eventos anteriores não são repetidos.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fluxo SSE de notificações.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, type: ErrorResponseDto })
  async handle(
    @Req() request: AuthenticatedCommunicationRequest,
    @Res() response: Response,
  ): Promise<void> {
    const lifecycle = new NotificationStreamLifecycle(response)
    const onRequestClose = () => void lifecycle.close()
    request.once('close', onRequestClose)

    return this.openStream(request, lifecycle).catch((error: unknown) =>
      this.handleStreamError(lifecycle, request, onRequestClose, error),
    )
  }

  private async handleStreamError(
    lifecycle: NotificationStreamLifecycle,
    request: AuthenticatedCommunicationRequest,
    onRequestClose: () => void,
    error: unknown,
  ): Promise<never> {
    await this.abortStream(lifecycle)
    request.off('close', onRequestClose)
    throw error
  }

  private async openStream(
    request: AuthenticatedCommunicationRequest,
    lifecycle: NotificationStreamLifecycle,
  ): Promise<void> {
    lifecycle.setCleanup(await this.executeStream(request, lifecycle))
    if (lifecycle.isClosed) return this.abortStream(lifecycle)
    lifecycle.stream.start()
    lifecycle.setHeartbeat(this.startHeartbeat(request, lifecycle))
  }

  private async abortStream(lifecycle: NotificationStreamLifecycle): Promise<void> {
    await lifecycle.cleanup?.()
    lifecycle.abort()
  }

  private executeStream(
    request: AuthenticatedCommunicationRequest,
    lifecycle: NotificationStreamLifecycle,
  ): Promise<() => Promise<void>> {
    return this.useCase.execute({
      actor: request.account,
      isSessionActive: () => this.isSessionActive(request),
      notificationSink: (notification) =>
        lifecycle.stream.writeNotification(notification),
      signal: lifecycle.abortController.signal,
    })
  }

  private startHeartbeat(
    request: AuthenticatedCommunicationRequest,
    lifecycle: NotificationStreamLifecycle,
  ): ReturnType<typeof setInterval> {
    return setInterval(() => {
      void this.isSessionActive(request)
        .then((active) => {
          if (!active) return lifecycle.close()
          return lifecycle.stream.writeHeartbeat()
        })
        .catch(() => lifecycle.close())
    }, HEARTBEAT_INTERVAL_MS)
  }

  private async isSessionActive(
    request: AuthenticatedCommunicationRequest,
  ): Promise<boolean> {
    return request.revalidateAuthSession()
  }
}
