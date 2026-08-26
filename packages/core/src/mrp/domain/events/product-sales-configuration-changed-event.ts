import type { ProductSalesConfiguration } from '#mrp/domain/structures/product-sales-configuration.ts'
import { Event } from '#shared/domain/events/event.ts'

type ProductSalesConfigurationChangedEventPayload =
  | {
      readonly establishmentId: ProductSalesConfiguration['establishmentId']
      readonly productId: ProductSalesConfiguration['productId']
      readonly state: 'available'
      readonly configuration: ProductSalesConfiguration
    }
  | {
      readonly establishmentId: string
      readonly productId: string
      readonly state: 'deleted'
      readonly configuration: null
    }

export class ProductSalesConfigurationChangedEvent extends Event<ProductSalesConfigurationChangedEventPayload> {
  static readonly _NAME = 'mrp/product.sales-configuration-changed'

  constructor(payload: ProductSalesConfigurationChangedEvent['payload']) {
    super(ProductSalesConfigurationChangedEvent._NAME, payload)
  }
}
