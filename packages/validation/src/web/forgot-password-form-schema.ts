import { z } from 'zod'

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().email('Informe um email válido para continuar.'),
})
