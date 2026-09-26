import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import {
  AppError,
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from '@scoops/core/shared/domain/errors'
import type { Telemetry } from '@scoops/core/shared/interfaces'

import {
  getOperationalHttpMethod,
  getOperationalRouteTemplate,
  getOperationalStatusClass,
} from '@/shared/provision/telemetry/server-app-telemetry-provider'

export type ErrorResponse = {
  readonly statusCode: number
  readonly title: string
  readonly message: string
  readonly timestamp: string
  readonly path: string
}

@Catch()
export class GlobalErrorHandler implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly operationalTelemetry: Telemetry,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost
    const context = host.switchToHttp()
    const request = context.getRequest<{
      url: string
      method?: string
      route?: { path?: unknown }
    }>()
    const response = context.getResponse()
    const errorResponse = this.createErrorResponse(exception, request.url)

    if (!(exception instanceof AppError) && !(exception instanceof HttpException)) {
      const safeContext = {
        route: getOperationalRouteTemplate(request.route?.path),
        method: getOperationalHttpMethod(request.method),
        statusClass: getOperationalStatusClass(errorResponse.statusCode),
        errorClass: this.getErrorClass(exception),
      }
      this.operationalTelemetry.captureUnexpected(exception, safeContext)
      this.operationalTelemetry.logError(safeContext)
    }

    httpAdapter.reply(response, errorResponse, errorResponse.statusCode)
  }

  private getErrorClass(exception: unknown): string {
    if (!(exception instanceof Error)) return 'Error'
    return /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(exception.constructor.name)
      ? exception.constructor.name
      : 'Error'
  }

  private createErrorResponse(exception: unknown, path: string): ErrorResponse {
    const timestamp = new Date().toISOString()

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      return {
        statusCode,
        title: this.getHttpErrorTitle(exceptionResponse, statusCode),
        message: this.getHttpErrorMessage(exceptionResponse, exception.message),
        timestamp,
        path,
      }
    }

    if (exception instanceof NotFoundError) {
      return this.createSharedErrorResponse(exception, HttpStatus.NOT_FOUND, path)
    }

    if (exception instanceof AuthorizationError) {
      return this.createSharedErrorResponse(exception, HttpStatus.UNAUTHORIZED, path)
    }

    if (exception instanceof BadRequestError) {
      return this.createSharedErrorResponse(exception, HttpStatus.BAD_REQUEST, path)
    }

    if (exception instanceof ConflictError) {
      return this.createSharedErrorResponse(exception, HttpStatus.CONFLICT, path)
    }

    if (exception instanceof TooManyRequestsError) {
      return this.createSharedErrorResponse(exception, HttpStatus.TOO_MANY_REQUESTS, path)
    }

    if (exception instanceof ServiceUnavailableError) {
      return this.createSharedErrorResponse(
        exception,
        HttpStatus.SERVICE_UNAVAILABLE,
        path,
      )
    }

    if (exception instanceof AppError) {
      return this.createSharedErrorResponse(
        exception,
        HttpStatus.INTERNAL_SERVER_ERROR,
        path,
      )
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      title: 'Erro Interno da Aplicação',
      message: 'Ocorreu um erro inesperado.',
      timestamp,
      path,
    }
  }

  private createSharedErrorResponse(
    exception: AppError,
    statusCode: number,
    path: string,
  ): ErrorResponse {
    return {
      statusCode,
      title: exception.title,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path,
    }
  }

  private getHttpErrorTitle(exceptionResponse: unknown, statusCode: number) {
    if (this.isRecord(exceptionResponse) && typeof exceptionResponse.error === 'string') {
      return exceptionResponse.error
    }

    return HttpStatus[statusCode] ?? 'Erro HTTP'
  }

  private getHttpErrorMessage(exceptionResponse: unknown, fallback: string) {
    if (typeof exceptionResponse === 'string') return exceptionResponse

    if (!this.isRecord(exceptionResponse)) return fallback

    const message = exceptionResponse.message

    if (Array.isArray(message)) return message.join('; ')
    if (typeof message === 'string') return message

    return fallback
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }
}
