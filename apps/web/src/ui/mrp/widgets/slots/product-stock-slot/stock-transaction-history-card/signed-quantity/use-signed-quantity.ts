import type { StockTransactionType } from '@scoops/core/mrp/domain/structures'

import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { cn } from '@/ui/shared/lib/utils'

export function useSignedQuantity(
  quantity: number,
  type: StockTransactionType,
  unit: string,
) {
  const formatQuantity = useFormatQuantity()
  const isEntry =
    type === 'entry' || type === 'production-output' || type === 'sale-cancellation'

  return {
    className: cn('font-extrabold', isEntry ? 'text-success' : 'text-danger'),
    formattedQuantity: formatQuantity(quantity, unit),
    sign: isEntry ? '+' : '-',
  }
}
