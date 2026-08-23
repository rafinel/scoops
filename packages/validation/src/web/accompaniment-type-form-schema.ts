import { z } from 'zod'

export const accompanimentTypeFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome do tipo.')
      .max(120, 'O nome do tipo deve ter no máximo 120 caracteres.'),
  })
  .strict()
