import type { OrderListParams } from '@scoops/core/pdv/domain/structures'

export const orderQueryKeys = {
  all: ['pdv', 'orders'] as const,
  list: (establishmentId: string, input: Omit<OrderListParams, 'establishmentId'>) =>
    ['pdv', 'orders', 'list', establishmentId, input] as const,
  detail: (establishmentId: string, orderId: string) =>
    ['pdv', 'orders', 'detail', establishmentId, orderId] as const,
}
