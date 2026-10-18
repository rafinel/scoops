import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import type { SalesCatalogAvailability } from '@scoops/core/pdv/domain/structures'

import { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'

import { productCreate } from './combo-controller-test-helpers'

const REQUIRED_PRODUCT_FIELDS = [
  'availability',
  'isActive',
  'isAvailable',
  'kind',
  'name',
  'productId',
  'resaleBrands',
  'sizes',
  'stockControl',
]
const OPTIONAL_PRODUCT_FIELDS = ['resalePrice', 'unit']

/** Returns the serialized fields that are not part of the documented product response. */
export function undocumentedProductFields(item: object): string[] {
  const documented = [...REQUIRED_PRODUCT_FIELDS, ...OPTIONAL_PRODUCT_FIELDS]
  return Object.keys(item).filter((field) => !documented.includes(field))
}

/** Returns the documented always-present fields missing from the serialized product. */
export function missingProductFields(item: object): string[] {
  return REQUIRED_PRODUCT_FIELDS.filter((field) => !(field in item))
}

export type CatalogVariant = 'portion' | 'single-resale' | 'brand-resale'

type CatalogPriceState = 'priced' | 'free' | 'none' | 'inactive'

type CatalogScenario = {
  readonly state: string
  readonly price: CatalogPriceState
  readonly hasStock: boolean
  readonly availability: SalesCatalogAvailability
}

export type SeededCatalogProduct = {
  readonly id: string
  readonly name: string
  readonly variant: CatalogVariant
  readonly kind: 'portion' | 'resale'
  readonly availability: SalesCatalogAvailability
}

const VARIANTS: readonly CatalogVariant[] = ['portion', 'single-resale', 'brand-resale']

const SCENARIOS: readonly CatalogScenario[] = [
  { state: 'available', price: 'priced', hasStock: true, availability: 'available' },
  { state: 'free', price: 'free', hasStock: true, availability: 'available' },
  { state: 'sold-out', price: 'priced', hasStock: false, availability: 'out_of_stock' },
  { state: 'no-price', price: 'none', hasStock: true, availability: 'missing_price' },
  { state: 'both', price: 'none', hasStock: false, availability: 'missing_price' },
  {
    state: 'inactive-price',
    price: 'inactive',
    hasStock: true,
    availability: 'missing_price',
  },
]

const PRICES: Record<CatalogPriceState, number> = {
  priced: 10,
  free: 0,
  none: 0,
  inactive: 10,
}

export const CATALOG_SEARCH = 'Catalog'

/** Every seeded catalog product: three variants times six states, named in sort order. */
export async function seedSalesCatalog(
  fixture: PdvModuleFixture,
): Promise<readonly SeededCatalogProduct[]> {
  const seeded: SeededCatalogProduct[] = []
  for (const [variantIndex, variant] of VARIANTS.entries()) {
    for (const [scenarioIndex, scenario] of SCENARIOS.entries()) {
      const position = variantIndex * SCENARIOS.length + scenarioIndex + 1
      const name = `Catalog ${String(position).padStart(2, '0')} ${variant} ${scenario.state}`
      const id = await addCatalogProduct(fixture, name, variant, scenario)
      seeded.push({
        id,
        name,
        variant,
        kind: variant === 'portion' ? 'portion' : 'resale',
        availability: scenario.availability,
      })
    }
  }
  return seeded
}

/** Adds one product that is available in the given establishment and returns its id. */
export async function addAvailableCatalogResale(
  fixture: PdvModuleFixture,
  name: string,
  establishmentId: string,
): Promise<string> {
  return addCatalogProduct(
    fixture,
    name,
    'single-resale',
    { state: 'available', price: 'priced', hasStock: true, availability: 'available' },
    establishmentId,
  )
}

async function addCatalogProduct(
  fixture: PdvModuleFixture,
  name: string,
  variant: CatalogVariant,
  scenario: CatalogScenario,
  establishmentId: string = PdvModuleFixture.accounts.establishmentId,
): Promise<string> {
  const isPortion = variant === 'portion'
  const product = await fixture.addProduct(
    productCreate({
      establishmentId,
      name,
      categories: [isPortion ? ProductCategory.Portion : ProductCategory.Resale],
      stockControl:
        variant === 'brand-resale'
          ? ProductStockControl.ByBrand
          : ProductStockControl.Single,
      currentUnitCost: 2,
    }),
  )
  const price = PRICES[scenario.price]
  const isPriceActive = scenario.price !== 'inactive'
  const hasPrice = scenario.price !== 'none'

  if (isPortion) {
    if (hasPrice)
      await fixture.addProductSize({
        establishmentId,
        productId: product.id,
        name: 'Regular',
        quantity: 1,
        price,
        isActive: isPriceActive,
      })
    await addStock(fixture, product.id, scenario.hasStock)
    return product.id
  }
  if (variant === 'single-resale') {
    if (hasPrice)
      await fixture.addResaleConfiguration({
        establishmentId,
        productId: product.id,
        price,
        isActive: isPriceActive,
      })
    await addStock(fixture, product.id, scenario.hasStock)
    return product.id
  }
  const brand = await fixture.addBrand({
    productId: product.id,
    name: 'Main',
    packageQuantity: 1,
    packagePrice: 10,
    isPrimary: true,
  })
  if (hasPrice)
    await fixture.addResaleConfiguration({
      establishmentId,
      productId: product.id,
      brandId: brand.id,
      price,
      isActive: isPriceActive,
    })
  await addStock(fixture, product.id, scenario.hasStock, brand.id)
  return product.id
}

export async function addStock(
  fixture: PdvModuleFixture,
  productId: string,
  hasStock: boolean,
  brandId?: string,
): Promise<void> {
  await fixture.stockBalances.initialize(productId, brandId)
  if (hasStock) await fixture.stockBalances.add({ productId, brandId }, 10)
}

export function namesOf(items: readonly { readonly name: string }[]): string[] {
  return items.map((item) => item.name)
}
