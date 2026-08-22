import type { StockTransaction } from '@scoops/core/mrp/domain/entities'

import type { DrizzleStockTransaction } from '../types'

export class DrizzleStockTransactionMapper {
  static toDomain(record: DrizzleStockTransaction): StockTransaction {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productId: record.productId,
      brandId: record.brandId ?? undefined,
      productionId: record.productionId ?? undefined,
      productName: record.productName,
      brandName: record.brandName ?? undefined,
      unit: record.unit as StockTransaction['unit'],
      type: record.type as StockTransaction['type'],
      quantity: Number(record.quantity),
      balanceAfter: Number(record.balanceAfter),
      performedBy: record.performedBy,
      performedByName: record.performedByName,
      occurredAt: record.occurredAt,
    }
  }
}
