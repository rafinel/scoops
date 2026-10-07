import { z } from 'zod'

export const productTelemetryFailurePhaseSchema = z.enum([
  'validation',
  'preview',
  'submission',
  'account_activation',
])
