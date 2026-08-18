import { z } from 'zod'

import { emailSchema } from './email-schema.ts'
import { nameSchema } from './name-schema.ts'
import { passwordSchema } from './password-schema.ts'

export const registerIceCreamShopOnboardingSchema = z
  .object({
    establishmentName: nameSchema,
    managerName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict()
