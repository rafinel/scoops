import { z } from 'zod'

// numeric(18,3) and numeric(18,2) are bounded below 10^15 and 10^16.
const SIZE_QUANTITY_MAX_EXCLUSIVE = 1_000_000_000_000_000
const SIZE_PRICE_MAX_EXCLUSIVE = 10_000_000_000_000_000

export const registerProductSizeSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  quantity: z
    .number()
    .finite()
    .positive()
    .lt(SIZE_QUANTITY_MAX_EXCLUSIVE)
    .refine((value) => Number(value.toFixed(3)) === value),
  price: z
    .number()
    .finite()
    .nonnegative()
    .lt(SIZE_PRICE_MAX_EXCLUSIVE)
    .refine((value) => Number(value.toFixed(2)) === value),
})
