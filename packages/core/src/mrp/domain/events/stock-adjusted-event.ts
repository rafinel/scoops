import type { StockAdjustment } from '#mrp/domain/structures/stock-adjustment.ts'
import { Event } from '#shared/domain/events/event.ts'

export class StockAdjustedEvent extends Event<StockAdjustment> {
  static readonly _NAME = 'mrp/stock.adjusted'

  constructor(payload: StockAdjustedEvent['payload']) {
    super(StockAdjustedEvent._NAME, payload)
  }
}
