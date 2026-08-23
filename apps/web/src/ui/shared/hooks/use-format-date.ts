export function useFormatDate() {
  function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat('pt-BR', options).format(date)
  }

  return formatDate
}
