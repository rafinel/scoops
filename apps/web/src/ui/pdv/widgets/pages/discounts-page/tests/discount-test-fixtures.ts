import type { ComboDetails } from '@scoops/core/pdv/domain/structures'

export const makeComboDetails = (
  overrides: Partial<ComboDetails['combo']> = {},
): ComboDetails => ({
  combo: {
    components: [
      {
        kind: 'portion',
        productId: 'portion-1',
        quantity: 1,
        sizeId: 'size-1',
        accompanimentIds: [],
      },
      { kind: 'resale', productId: 'resale-1', quantity: 1 },
    ],
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    establishmentId: 'establishment-1',
    fixedPrice: 20,
    id: 'combo-1',
    name: 'Combo Açaí + Brownie',
    status: 'active',
    type: 'combo',
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
    ...overrides,
  },
  components: [
    {
      accompanimentNames: [],
      component: {
        kind: 'portion',
        productId: 'portion-1',
        quantity: 1,
        sizeId: 'size-1',
        accompanimentIds: [],
      },
      configurationName: '500 ml',
      productName: 'Açaí',
      subtotal: 14,
      unitPrice: 14,
      validity: 'valid',
    },
    {
      accompanimentNames: [],
      component: { kind: 'resale', productId: 'resale-1', quantity: 1 },
      configurationName: 'Preço padrão',
      productName: 'Brownie',
      subtotal: 10,
      unitPrice: 10,
      validity: 'valid',
    },
  ],
  normalPrice: 24,
  savings: 4,
})
