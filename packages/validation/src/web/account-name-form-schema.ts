import { z } from 'zod'

export const accountNameFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome completo.'),
})
