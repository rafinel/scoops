import type {
  ComboDetails,
  SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'

export const comboDetails: ComboDetails = {
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
}

export const portionProduct: SalesCatalogProduct = {
  isActive: true,
  isAvailable: true,
  kind: 'portion',
  name: 'Açaí',
  productId: 'portion-2',
  resaleBrands: [],
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
  stockControl: 'single',
}

export const resaleProduct: SalesCatalogProduct = {
  isActive: true,
  isAvailable: true,
  kind: 'resale',
  name: 'Brownie',
  productId: 'resale-2',
  resalePrice: 10,
  resaleBrands: [],
  sizes: [],
  stockControl: 'single',
}
