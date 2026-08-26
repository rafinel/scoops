import { z } from 'zod'

export const nameSchema = z
  .string({ error: 'Informe um nome válido.' })
  .trim()
  .min(1, 'Informe um nome.')
  .max(120, 'Use no máximo 120 caracteres.')
