import { z } from 'zod'

export const productTelemetryFailureCodeSchema = z.enum([
  'invalid_input',
  'insufficient_stock',
  'dependency_unavailable',
  'unauthorized',
  'forbidden',
  'conflict',
  'rate_limited',
  'network_error',
  'server_error',
  'unknown',
])
