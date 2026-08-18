import { z } from 'zod'

export const invitationAcceptanceFormSchema = z.object({
  password: z
    .string()
    .min(8, 'A senha deve ter entre 8 e 64 caracteres.')
    .max(64, 'A senha deve ter entre 8 e 64 caracteres.'),
})
