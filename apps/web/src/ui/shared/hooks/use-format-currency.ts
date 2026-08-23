const PT_BR_CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function useFormatCurrency() {
  function formatCurrency(value: number) {
    return PT_BR_CURRENCY_FORMATTER.format(value)
  }

  return formatCurrency
}
