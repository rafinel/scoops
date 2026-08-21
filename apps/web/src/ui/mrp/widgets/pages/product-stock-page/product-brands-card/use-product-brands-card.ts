import type { ProductBrandStock, ProductUnit } from '@scoops/core/mrp/domain/structures'

export type ProductBrandRow = ProductBrandStock & {
  formattedPackagePrice: string
  formattedPackageQuantity: string
  formattedStockQuantity: string
  formattedUnitPrice: string
}

export function useProductBrandsCard(
  brands: readonly ProductBrandStock[],
  unit: ProductUnit,
) {
  const rows: ProductBrandRow[] = brands.map((brandStock) => ({
    ...brandStock,
    formattedPackagePrice: formatCurrency(brandStock.brand.packagePrice),
    formattedPackageQuantity: formatQuantity(brandStock.brand.packageQuantity, unit),
    formattedStockQuantity: formatQuantity(brandStock.stockQuantity, unit),
    formattedUnitPrice: `${formatCurrency(brandStock.unitPrice)} / ${unit}`,
  }))

  return { rows }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

function formatQuantity(quantity: number, unit: ProductUnit) {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(quantity)} ${unit}`
}
