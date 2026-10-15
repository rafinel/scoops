import { z } from 'zod'

export const accompanimentPriceSchema = z
  .number()
  .finite()
  .nonnegative()
  .refine((value) => Number(value.toFixed(2)) === value)
