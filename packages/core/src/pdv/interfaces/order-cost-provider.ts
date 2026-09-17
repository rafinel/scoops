import type { OrderCostComponentSnapshot } from '#pdv/domain/structures/order-cost-component-snapshot.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'

export interface OrderCostProvider {
  resolve(request: {
    readonly establishmentId: string
    readonly lines: OrderPreviewInput['lines']
  }): Promise<
    readonly {
      readonly linePosition: number
      readonly components: readonly OrderCostComponentSnapshot[]
    }[]
  >
}
