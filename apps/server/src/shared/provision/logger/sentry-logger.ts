import { ConsoleLogger, Inject, Injectable, type LoggerService } from '@nestjs/common'

import {
  TELEMETRY,
  type SentryTelemetry,
} from '@/shared/provision/telemetry/server-app-telemetry-provider'

@Injectable()
export class SentryLogger implements LoggerService {
  private readonly consoleLogger = new ConsoleLogger()

  constructor(
    @Inject(TELEMETRY)
    private readonly telemetry: SentryTelemetry,
  ) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.consoleLogger.log(message, ...optionalParams)
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.consoleLogger.error(message, ...optionalParams)
    this.telemetry.logError({ errorClass: 'NestLoggerError' })
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.consoleLogger.warn(message, ...optionalParams)
    this.telemetry.logWarning({ errorClass: 'NestLoggerWarning' })
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.consoleLogger.debug(message, ...optionalParams)
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.consoleLogger.verbose(message, ...optionalParams)
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.consoleLogger.fatal(message, ...optionalParams)
    this.telemetry.logError({ errorClass: 'NestLoggerFatal' })
  }
}
