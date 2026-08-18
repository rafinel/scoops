import { z } from 'zod'

export const correctNameFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do usuário.'),
})
