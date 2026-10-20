import { z } from 'zod'

// numeric(18,2) is bounded below 10^16; the JS number form of its .99 maximum rounds up.
const RESALE_PRICE_MAX_EXCLUSIVE = 10_000_000_000_000_000

export const resalePriceSchema = z
  .number()
  .finite()
  .nonnegative()
  .lt(RESALE_PRICE_MAX_EXCLUSIVE)
  .refine((value) => Number(value.toFixed(2)) === value)
