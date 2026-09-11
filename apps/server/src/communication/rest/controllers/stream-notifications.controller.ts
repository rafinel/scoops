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

type NotificationStreamLifecycle = {
  readonly stream: NotificationStream
  readonly abortController: AbortController
  readonly isClosed: boolean
  readonly cleanup: (() => Promise<void>) | undefined
  close(): Promise<void>
  setCleanup(cleanup: () => Promise<void>): void
  setHeartbeat(heartbeat: ReturnType<typeof setInterval>): void
}

function createNotificationStreamLifecycle(
  response: Response,
): NotificationStreamLifecycle {
  const stream = new NotificationStream(response)
  const abortController = new AbortController()
  let closed = false
  let cleanup: (() => Promise<void>) | undefined
  let heartbeat: ReturnType<typeof setInterval> | undefined

  return {
    stream,
    abortController,
    get isClosed() {
      return closed
    },
    get cleanup() {
      return cleanup
    },
    setCleanup(value) {
      cleanup = value
    },
    setHeartbeat(value) {
      heartbeat = value
    },
    close: async () => {
      if (closed) return
      closed = true
      if (heartbeat) clearInterval(heartbeat)
      abortController.abort()
      await cleanup?.()
      stream.close()
    },
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
    const lifecycle = createNotificationStreamLifecycle(response)
    const onRequestClose = () => void lifecycle.close()
    request.once('close', onRequestClose)

    try {
      lifecycle.setCleanup(await this.executeStream(request, lifecycle))

      if (lifecycle.isClosed) {
        await lifecycle.cleanup?.()
        lifecycle.stream.abort()
        return
      }

      lifecycle.stream.start()
      lifecycle.setHeartbeat(this.startHeartbeat(request, lifecycle))
    } catch (error) {
      await lifecycle.cleanup?.()
      lifecycle.stream.abort()
      request.off('close', onRequestClose)
      throw error
    }
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
