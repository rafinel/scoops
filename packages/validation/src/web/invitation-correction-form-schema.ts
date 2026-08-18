import { z } from 'zod'

export const invitationCorrectionFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome completo.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
})
