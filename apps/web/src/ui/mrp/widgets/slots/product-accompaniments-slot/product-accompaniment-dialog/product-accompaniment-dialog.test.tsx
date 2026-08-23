import { describe, expect, it } from 'vitest'

import { productAccompanimentFormSchema } from '@scoops/validation'

describe('ProductAccompanimentDialog contract', () => {
  it('rejects a non-positive quantity while keeping the selected fields contract', () => {
    const result = productAccompanimentFormSchema.safeParse({
      accompanimentProductId: 'product-1',
      accompanimentTypeId: 'type-1',
      quantityPerPortion: '0',
    })
    expect(result.success).toBe(false)
  })
})
