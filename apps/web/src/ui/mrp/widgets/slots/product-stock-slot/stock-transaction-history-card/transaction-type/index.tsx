import type { StockTransactionType } from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'

export type TransactionTypeProps = {
  label: string
  type: StockTransactionType
}

export const STOCK_TRANSACTION_TYPE_LABELS: Record<StockTransactionType, string> = {
  entry: 'Entrada Manual',
  'write-off': 'Baixa Manual',
  'production-consumption': 'Consumo de produção',
  'production-output': 'Produção',
  sale: 'Venda',
  'sale-cancellation': 'Cancelamento de venda',
}

export const TransactionType = ({ label, type }: TransactionTypeProps) => (
  <Badge
    className={
      type === 'entry' || type === 'production-output' || type === 'sale-cancellation'
        ? 'border border-info/30 bg-info-soft text-info'
        : 'border border-danger/30 bg-danger-soft text-danger'
    }
  >
    {label}
  </Badge>
)
