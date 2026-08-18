import { z } from 'zod'

export const loginFormSchema = z.object({
  identifier: z.string().trim().min(1, 'Informe seu email para continuar.'),
  password: z.string().min(1, 'Informe sua senha para continuar.'),
})
