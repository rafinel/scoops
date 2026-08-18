import { z } from 'zod'

export const shopNameFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da loja.'),
})
