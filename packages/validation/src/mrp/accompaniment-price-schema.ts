import { z } from 'zod'

// numeric(18,2) is bounded below 10^16; the JS number form of its .99 maximum rounds up.
const ACCOMPANIMENT_PRICE_MAX_EXCLUSIVE = 10_000_000_000_000_000

export const accompanimentPriceSchema = z
  .number()
  .finite()
  .nonnegative()
  .lt(ACCOMPANIMENT_PRICE_MAX_EXCLUSIVE)
  .refine((value) => Number(value.toFixed(2)) === value)
