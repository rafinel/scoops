import { z } from 'zod'

import { isValidScaleNumber } from './is-valid-scale-number.ts'

export const accompanimentQuantityTextSchema = z
  .string()
  .refine(
    (value) =>
      isValidScaleNumber(value, /^(?:\d+|\d*\.\d{1,3})$/, (quantity) => quantity > 0),
    'Informe uma quantidade maior que zero, com até três casas decimais.',
  )
