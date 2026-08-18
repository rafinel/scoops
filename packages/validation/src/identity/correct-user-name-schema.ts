import { z } from 'zod'

import { nameSchema } from './name-schema.ts'

export const correctUserNameSchema = z.object({ name: nameSchema }).strict()
