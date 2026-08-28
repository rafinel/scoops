import type {
  CartLineInput,
  SalesCatalogAccompaniment,
  SalesCatalogBrand,
  SalesCatalogProduct,
  SalesCatalogSize,
} from '@scoops/core/pdv/domain/structures'

import { showWarningToast } from '@/ui/shared/notifications'

const STORAGE_KEY_PREFIX = 'scoops.pdv.new-sale-cart'
const STORAGE_VERSION = 1

export type StoredNewSaleCart = {
  version: 1
  lineInputs: readonly CartLineInput[]
  products: readonly SalesCatalogProduct[]
  channelId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value))
}

function isCartLineInput(value: unknown): value is CartLineInput {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.productId) &&
    (value.kind === 'portion' || value.kind === 'resale') &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity >= 1 &&
    value.quantity <= 999 &&
    Array.isArray(value.accompanimentIds) &&
    value.accompanimentIds.every(isNonEmptyString) &&
    (value.sizeId === undefined || isNonEmptyString(value.sizeId)) &&
    (value.brandId === undefined || isNonEmptyString(value.brandId))
  )
}

function isSalesCatalogAccompaniment(value: unknown): value is SalesCatalogAccompaniment {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.accompanimentId) &&
    (value.productId === undefined || isNonEmptyString(value.productId)) &&
    (value.brandId === undefined || isNonEmptyString(value.brandId)) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.type) &&
    typeof value.quantityPerPortion === 'number' &&
    Number.isFinite(value.quantityPerPortion) &&
    typeof value.basePrice === 'number' &&
    Number.isFinite(value.basePrice) &&
    typeof value.isActive === 'boolean' &&
    typeof value.isAvailable === 'boolean' &&
    isOptionalNumber(value.availableQuantity)
  )
}

function isSalesCatalogSize(value: unknown): value is SalesCatalogSize {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.sizeId) &&
    isNonEmptyString(value.name) &&
    typeof value.quantity === 'number' &&
    Number.isFinite(value.quantity) &&
    typeof value.basePrice === 'number' &&
    Number.isFinite(value.basePrice) &&
    typeof value.isActive === 'boolean' &&
    typeof value.isAvailable === 'boolean' &&
    isOptionalNumber(value.availableQuantity) &&
    Array.isArray(value.accompaniments) &&
    value.accompaniments.every(isSalesCatalogAccompaniment)
  )
}

function isSalesCatalogBrand(value: unknown): value is SalesCatalogBrand {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.brandId) &&
    isNonEmptyString(value.name) &&
    typeof value.basePrice === 'number' &&
    Number.isFinite(value.basePrice) &&
    typeof value.isActive === 'boolean' &&
    typeof value.isAvailable === 'boolean' &&
    isOptionalNumber(value.availableQuantity)
  )
}

function isSalesCatalogProduct(value: unknown): value is SalesCatalogProduct {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.productId) &&
    isNonEmptyString(value.name) &&
    (value.unit === undefined || isNonEmptyString(value.unit)) &&
    (value.kind === 'portion' || value.kind === 'resale') &&
    (value.stockControl === 'single' || value.stockControl === 'by-brand') &&
    typeof value.isActive === 'boolean' &&
    typeof value.isAvailable === 'boolean' &&
    isOptionalNumber(value.availableQuantity) &&
    Array.isArray(value.sizes) &&
    value.sizes.every(isSalesCatalogSize) &&
    isOptionalNumber(value.resalePrice) &&
    Array.isArray(value.resaleBrands) &&
    value.resaleBrands.every(isSalesCatalogBrand)
  )
}

function parseStoredCart(value: unknown): StoredNewSaleCart | undefined {
  if (!isRecord(value)) return undefined

  if (
    value.version !== STORAGE_VERSION ||
    !Array.isArray(value.lineInputs) ||
    value.lineInputs.length === 0 ||
    !value.lineInputs.every(isCartLineInput) ||
    !Array.isArray(value.products) ||
    !value.products.every(isSalesCatalogProduct) ||
    (value.channelId !== undefined && !isNonEmptyString(value.channelId))
  ) {
    return undefined
  }

  return {
    version: STORAGE_VERSION,
    lineInputs: value.lineInputs,
    products: value.products,
    ...(value.channelId ? { channelId: value.channelId } : {}),
  }
}

export function getNewSaleCartStorageKey(establishmentId: string) {
  return `${STORAGE_KEY_PREFIX}.${establishmentId}`
}

export const newSaleCartStorage = {
  load(establishmentId: string | undefined): StoredNewSaleCart | undefined {
    if (typeof window === 'undefined' || !establishmentId) return undefined

    try {
      const raw = window.localStorage.getItem(getNewSaleCartStorageKey(establishmentId))
      if (!raw) return undefined

      const parsed = parseStoredCart(JSON.parse(raw))
      if (!parsed) this.clear(establishmentId)
      return parsed
    } catch {
      this.clear(establishmentId)
      return undefined
    }
  },

  save(establishmentId: string | undefined, value: StoredNewSaleCart): void {
    if (typeof window === 'undefined' || !establishmentId) return

    try {
      window.localStorage.setItem(
        getNewSaleCartStorageKey(establishmentId),
        JSON.stringify(value),
      )
    } catch {
      showWarningToast('O navegador não permitiu salvar o pedido em andamento.')
    }
  },

  clear(establishmentId: string | undefined): void {
    if (typeof window === 'undefined' || !establishmentId) return

    try {
      window.localStorage.removeItem(getNewSaleCartStorageKey(establishmentId))
    } catch {
      showWarningToast('O navegador não permitiu limpar o pedido salvo.')
    }
  },
}
