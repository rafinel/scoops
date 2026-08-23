const PT_BR_DECIMAL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function useFormatDecimal() {
  function formatDecimal(value: number) {
    return PT_BR_DECIMAL_FORMATTER.format(value)
  }

  return formatDecimal
}
