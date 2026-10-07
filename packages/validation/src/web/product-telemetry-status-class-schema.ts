import { z } from 'zod'

export const productTelemetryStatusClassSchema = z.enum(['4xx', '5xx'])
