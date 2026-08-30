import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'

export function useOrdersList() {
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()

  function formatOrderDate(value: Date) {
    return formatDate(value, { dateStyle: 'short', timeStyle: 'short' })
  }

  function formatOrderTotal(value: number) {
    return formatCurrency(value)
  }

  return { formatOrderDate, formatOrderTotal }
}
