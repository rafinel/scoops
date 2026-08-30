import type { StockTransaction } from '@scoops/core/mrp/domain/entities'
import { StockTransactionType } from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'

import type { DrizzleStockTransaction } from '../types'

export class DrizzleStockTransactionMapper {
  static toDomain(record: DrizzleStockTransaction): StockTransaction {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productId: record.productId,
      brandId: record.brandId ?? undefined,
      productionId: record.productionId ?? undefined,
      orderId: record.orderId ?? undefined,
      productName: record.productName,
      brandName: record.brandName ?? undefined,
      unit: record.unit as StockTransaction['unit'],
      type: DrizzleStockTransactionMapper.toType(record.type),
      quantity: Number(record.quantity),
      balanceAfter: Number(record.balanceAfter),
      performedBy: record.performedBy,
      performedByName: record.performedByName,
      occurredAt: record.occurredAt,
    }
  }

  private static toType(type: string): StockTransaction['type'] {
    switch (type) {
      case StockTransactionType.Entry:
        return StockTransactionType.Entry
      case StockTransactionType.WriteOff:
        return StockTransactionType.WriteOff
      case StockTransactionType.ProductionConsumption:
        return StockTransactionType.ProductionConsumption
      case StockTransactionType.ProductionOutput:
        return StockTransactionType.ProductionOutput
      case StockTransactionType.Sale:
        return StockTransactionType.Sale
      case StockTransactionType.SaleCancellation:
        return StockTransactionType.SaleCancellation
      default:
        throw new ConflictError('Database operation conflicted')
    }
  }
}
