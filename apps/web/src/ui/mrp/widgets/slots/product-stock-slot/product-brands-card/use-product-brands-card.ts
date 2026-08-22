import type { ProductBrandStock, ProductUnit } from '@scoops/core/mrp/domain/structures'
import { useFormatCurrency, useFormatQuantity } from '@/ui/shared/hooks/use-formatters'

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
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const rows: ProductBrandRow[] = brands.map((brandStock) => ({
    ...brandStock,
    formattedPackagePrice: formatCurrency(brandStock.brand.packagePrice),
    formattedPackageQuantity: formatQuantity(brandStock.brand.packageQuantity, unit),
    formattedStockQuantity: formatQuantity(brandStock.stockQuantity, unit),
    formattedUnitPrice: `${formatCurrency(brandStock.unitPrice)} / ${unit}`,
  }))

  return { rows }
}
