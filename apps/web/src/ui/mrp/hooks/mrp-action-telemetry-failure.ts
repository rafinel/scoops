import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'
import type {
  ProductTelemetryFailureCode,
  ProductTelemetryStatusClass,
} from '@scoops/core/shared/interfaces'

export type MrpActionTelemetryFailure = {
  failureCode: Exclude<ProductTelemetryFailureCode, 'insufficient_stock'>
  statusClass?: ProductTelemetryStatusClass
}

const KNOWN_FAILURE_CODES: Partial<
  Record<number, Exclude<ProductTelemetryFailureCode, 'insufficient_stock'>>
> = {
  0: 'network_error',
  [HTTP_STATUS_CODE.badRequest]: 'invalid_input',
  [HTTP_STATUS_CODE.unauthorized]: 'unauthorized',
  [HTTP_STATUS_CODE.forbidden]: 'forbidden',
  [HTTP_STATUS_CODE.conflict]: 'conflict',
  [HTTP_STATUS_CODE.tooManyRequests]: 'rate_limited',
  [HTTP_STATUS_CODE.notFound]: 'dependency_unavailable',
}

function getStatusClass(statusCode: number): ProductTelemetryStatusClass | undefined {
  if (statusCode >= HTTP_STATUS_CODE.badRequest && statusCode < 500) return '4xx'
  if (statusCode >= 500 && statusCode < 600) return '5xx'
  return undefined
}

function getFailureCode(
  statusCode: number,
  statusClass: ProductTelemetryStatusClass | undefined,
  notFoundIsDependency: boolean,
): MrpActionTelemetryFailure['failureCode'] {
  if (statusCode === HTTP_STATUS_CODE.notFound && !notFoundIsDependency) return 'unknown'
  return (
    KNOWN_FAILURE_CODES[statusCode] ??
    (statusClass === '5xx' ? 'server_error' : 'unknown')
  )
}

export function getMrpActionTelemetryFailure(
  statusCode: number,
  notFoundIsDependency = false,
): MrpActionTelemetryFailure {
  const statusClass = getStatusClass(statusCode)
  return {
    failureCode: getFailureCode(statusCode, statusClass, notFoundIsDependency),
    statusClass,
  }
}
