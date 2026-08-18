import { z } from 'zod'

export const userIdSchema = z.string().uuid()
