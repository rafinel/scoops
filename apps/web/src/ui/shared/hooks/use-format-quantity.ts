import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

const PT_BR_QUANTITY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
  useGrouping: false,
})

export function useFormatQuantity() {
  function formatQuantity(value: number, unit: ProductUnit | string) {
    return `${PT_BR_QUANTITY_FORMATTER.format(value)} ${unit}`
  }

  return formatQuantity
}
