import type { StockTransactionType } from '@scoops/core/mrp/domain/structures'

import { useSignedQuantity } from './use-signed-quantity'

export type SignedQuantityProps = {
  quantity: number
  type: StockTransactionType
  unit: string
}

export const SignedQuantity = ({ quantity, type, unit }: SignedQuantityProps) => {
  const { className, formattedQuantity, sign } = useSignedQuantity(quantity, type, unit)

  return (
    <span className={className}>
      {sign}
      {formattedQuantity}
    </span>
  )
}
