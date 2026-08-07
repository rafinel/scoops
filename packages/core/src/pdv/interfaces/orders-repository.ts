import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { Order, OrderCreate } from '#pdv/domain/entities/order.ts'
import type { OrderListParams } from '#pdv/domain/structures/order-list-params.ts'

export interface OrdersRepository {
  add(input: OrderCreate): Promise<Order>
  findById(establishmentId: string, orderId: string): Promise<Order | undefined>
  findByIdempotencyKey(
    establishmentId: string,
    idempotencyKey: string,
  ): Promise<Order | undefined>
  findMany(input: OrderListParams): Promise<PaginationResponse<Order>>
}
