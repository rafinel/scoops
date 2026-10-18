import type {
  ComboDetails,
  SalesCatalogListItem,
} from '@scoops/core/pdv/domain/structures'
import { SalesCatalogProductFaker } from '@scoops/core/pdv/domain/structures/fakers'

export const comboDetails: ComboDetails = {
  combo: {
    components: [
      {
        kind: 'portion',
        productId: '11111111-1111-4111-8111-111111111111',
        quantity: 1,
        sizeId: '11111111-1111-4111-8111-111111111112',
        accompanimentIds: [],
      },
      {
        kind: 'resale',
        productId: '11111111-1111-4111-8111-111111111113',
        quantity: 1,
      },
    ],
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    establishmentId: 'establishment-1',
    fixedPrice: 20,
    id: 'combo-1',
    name: 'Combo Açaí + Brownie',
    status: 'active',
    type: 'combo',
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
  },
  components: [
    {
      accompanimentNames: [],
      component: {
        kind: 'portion',
        productId: '11111111-1111-4111-8111-111111111111',
        quantity: 1,
        sizeId: '11111111-1111-4111-8111-111111111112',
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
      component: {
        kind: 'resale',
        productId: '11111111-1111-4111-8111-111111111113',
        quantity: 1,
      },
      configurationName: 'Preço padrão',
      productName: 'Brownie',
      subtotal: 10,
      unitPrice: 10,
      validity: 'valid',
    },
  ],
  normalPrice: 24,
  savings: 4,
}

export const portionProduct: SalesCatalogListItem = SalesCatalogProductFaker.fakeListItem(
  {
    kind: 'portion',
    name: 'Açaí',
    productId: 'portion-2',
    resalePrice: undefined,
    sizes: [
      {
        accompaniments: [],
        basePrice: 14,
        isActive: true,
        isAvailable: true,
        name: '500 ml',
        quantity: 500,
        sizeId: 'size-2',
      },
    ],
  },
)

export const resaleProduct: SalesCatalogListItem = SalesCatalogProductFaker.fakeListItem({
  name: 'Brownie',
  productId: 'resale-2',
  resalePrice: 10,
})

export const outOfStockProduct: SalesCatalogListItem = {
  ...resaleProduct,
  availability: 'out_of_stock',
  isAvailable: false,
  name: 'Pote de açaí 1 L',
  productId: 'resale-out-of-stock',
}

export const missingPriceProduct: SalesCatalogListItem = {
  ...resaleProduct,
  availability: 'missing_price',
  isAvailable: false,
  name: 'Pote de açaí 500 ml',
  productId: 'resale-missing-price',
  resalePrice: undefined,
}
