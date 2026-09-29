import type { GlobalSearchHit } from '@scoops/core/identity/domain/structures'
import type { GlobalSearchProviderInput } from '@scoops/core/identity/domain/structures'
import type { PdvGlobalSearchProvider } from '@scoops/core/identity/interfaces'
import type {
  DiscountsRepository,
  OrdersRepository,
  SalesChannelsRepository,
} from '@scoops/core/pdv/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { PDV_REPOSITORIES } from '@/pdv/constants'

@Injectable()
export class PdvGlobalSearchProviderAdapter implements PdvGlobalSearchProvider {
  constructor(
    @Inject(PDV_REPOSITORIES.orders)
    private readonly ordersRepository: OrdersRepository,
    @Inject(PDV_REPOSITORIES.salesChannels)
    private readonly salesChannelsRepository: SalesChannelsRepository,
    @Inject(PDV_REPOSITORIES.discounts)
    private readonly discountsRepository: DiscountsRepository,
  ) {}

  searchOrders(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]> {
    return this.ordersRepository
      .findMany(toOrderSearchParams(input))
      .then(({ items }) => items.map(toOrderHit))
  }

  async searchSalesChannels(
    input: GlobalSearchProviderInput,
  ): Promise<GlobalSearchHit[]> {
    const channels = await this.salesChannelsRepository.searchByName(
      input.establishmentId,
      input.query,
      input.limit,
    )

    return channels.map(toSalesChannelHit)
  }

  searchDiscounts(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]> {
    return this.discountsRepository
      .findPage(toDiscountSearchParams(input))
      .then(({ items }) => items.map(toDiscountHit))
  }
}

function toOrderSearchParams(
  input: GlobalSearchProviderInput,
): Parameters<OrdersRepository['findMany']>[0] {
  return {
    establishmentId: input.establishmentId,
    search: input.query,
    page: 1,
    pageSize: input.limit,
  }
}

function toDiscountSearchParams(
  input: GlobalSearchProviderInput,
): Parameters<DiscountsRepository['findPage']>[0] {
  return {
    establishmentId: input.establishmentId,
    search: input.query,
    page: 1,
    pageSize: input.limit,
  }
}

function toOrderHit(
  order: Awaited<ReturnType<OrdersRepository['findMany']>>['items'][number],
): GlobalSearchHit {
  return {
    kind: 'order',
    orderId: order.id,
    label: `#${order.sequenceNumber}`,
    context: orderProductNames(order.lines),
    status: order.status,
  }
}

function orderProductNames(
  lines: Awaited<ReturnType<OrdersRepository['findMany']>>['items'][number]['lines'],
): string {
  return lines.map(({ product }) => product.name).join(', ')
}

function toSalesChannelHit(
  channel: Awaited<ReturnType<SalesChannelsRepository['searchByName']>>[number],
): GlobalSearchHit {
  return {
    kind: 'salesChannel',
    salesChannelId: channel.id,
    label: channel.name,
    status: channel.status,
  }
}

function toDiscountHit(
  discount: Awaited<ReturnType<DiscountsRepository['findPage']>>['items'][number],
): GlobalSearchHit {
  return {
    kind: 'discount',
    discountId: discount.id,
    label: discount.name,
    status: discount.status,
  }
}
