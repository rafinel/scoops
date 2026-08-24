const PT_BR_DECIMAL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
})

export const formatDecimal = (value: number) => PT_BR_DECIMAL_FORMATTER.format(value)

export const useFormatDecimal = () => formatDecimal
