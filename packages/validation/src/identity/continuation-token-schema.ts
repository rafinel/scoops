import { z } from 'zod'

export const continuationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)
