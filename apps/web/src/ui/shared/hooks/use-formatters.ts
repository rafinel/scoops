import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

const PT_BR_DECIMAL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PT_BR_CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PT_BR_QUANTITY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
  useGrouping: false,
})

export function useFormatCurrency() {
  function formatCurrency(value: number) {
    return PT_BR_CURRENCY_FORMATTER.format(value)
  }

  return formatCurrency
}

export function useFormatDecimal() {
  function formatDecimal(value: number) {
    return PT_BR_DECIMAL_FORMATTER.format(value)
  }

  return formatDecimal
}

export function useFormatQuantity() {
  function formatQuantity(value: number, unit: ProductUnit | string) {
    return `${PT_BR_QUANTITY_FORMATTER.format(value)} ${unit}`
  }

  return formatQuantity
}

export function useFormatDate() {
  function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat('pt-BR', options).format(date)
  }

  return formatDate
}
