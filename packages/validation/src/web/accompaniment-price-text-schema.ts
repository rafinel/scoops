import { z } from 'zod'

import { accompanimentPriceSchema } from '../mrp/accompaniment-price-schema.ts'
import { isValidScaleNumber } from './is-valid-scale-number.ts'

export const accompanimentPriceTextSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      isValidScaleNumber(
        value,
        /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/,
        (price) => accompanimentPriceSchema.safeParse(price).success,
      ),
    'Informe um preço maior ou igual a zero, com até duas casas decimais.',
  )
