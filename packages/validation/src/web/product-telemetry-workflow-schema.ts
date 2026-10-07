import { z } from 'zod'

export const productTelemetryWorkflowSchema = z.enum([
  'onboarding',
  'product_creation',
  'stock_entry',
  'stock_write_off',
  'production',
])
