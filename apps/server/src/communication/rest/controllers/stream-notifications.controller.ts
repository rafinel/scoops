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
    const stream = new NotificationStream(response)
    const abortController = new AbortController()
    let closed = false
    let cleanup: (() => Promise<void>) | undefined
    let heartbeat: ReturnType<typeof setInterval> | undefined

    const close = async () => {
      if (closed) return
      closed = true
      if (heartbeat) clearInterval(heartbeat)
      abortController.abort()
      await cleanup?.()
      stream.close()
    }
    const onRequestClose = () => void close()
    request.once('close', onRequestClose)

    try {
      cleanup = await this.useCase.execute({
        actor: request.account,
        isSessionActive: () => this.isSessionActive(request),
        notificationSink: (notification) => stream.writeNotification(notification),
        signal: abortController.signal,
      })

      if (closed) {
        await cleanup()
        stream.abort()
        return
      }

      stream.start()
      heartbeat = setInterval(() => {
        void this.isSessionActive(request)
          .then((active) => {
            if (!active) return close()
            return stream.writeHeartbeat()
          })
          .catch(() => close())
      }, HEARTBEAT_INTERVAL_MS)
    } catch (error) {
      await cleanup?.()
      stream.abort()
      request.off('close', onRequestClose)
      throw error
    }
  }

  private async isSessionActive(
    request: AuthenticatedCommunicationRequest,
  ): Promise<boolean> {
    return request.revalidateAuthSession()
  }
}
