import type { Order } from '@scoops/core/pdv/domain/entities'
import type { PdvDatabase, SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import type { AnalyticsSalesFact } from '@scoops/core/analytics/domain/structures'
import type { AnalyticsSalesFactsProvider } from '@scoops/core/analytics/interfaces'
import { ServiceUnavailableError } from '@scoops/core/shared/domain/errors'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PdvAnalyticsSalesFactsProvider implements AnalyticsSalesFactsProvider {
  constructor(
    private readonly pdvDatabase: PdvDatabase,
    private readonly mrpDatabase: MrpDatabase,
  ) {}

  async forEachBatch(
    input: Parameters<AnalyticsSalesFactsProvider['forEachBatch']>[0],
    consume: Parameters<AnalyticsSalesFactsProvider['forEachBatch']>[1],
  ): Promise<void> {
    if (!this.pdvDatabase.readSnapshot)
      throw new ServiceUnavailableError('A fonte de vendas não está disponível.')
    try {
      await this.pdvDatabase.readSnapshot(async (repositories) => {
        const channels = await repositories.salesChannelsRepository.findMany(
          input.establishmentId,
        )
        let cursor: string | undefined
        do {
          const page = await repositories.ordersRepository.findActivityBatch({
            establishmentId: input.establishmentId,
            registrationStartAt: input.comparison.startAt,
            registrationEndAt: input.selected.endAt,
            cancellationStartAt: input.selected.startAt,
            cancellationEndAt: input.selected.endAt,
            ...(cursor ? { cursor } : {}),
            limit: 500,
          })
          if (page.orders.length > 0) {
            const productIds = [
              ...new Set(
                page.orders.flatMap((order) =>
                  order.lines.map((line) => line.product.productId),
                ),
              ),
            ]
            const currentProducts = await this.mrpDatabase.run((repositories) =>
              repositories.productsRepository.findManyByIds(
                input.establishmentId,
                productIds,
              ),
            )
            await consume(
              page.orders.map((order) =>
                this.toFact(order, input.establishmentId, currentProducts, channels),
              ),
            )
          }
          cursor = page.nextCursor
        } while (cursor)
      })
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error
      throw new ServiceUnavailableError('A fonte de vendas não está disponível.')
    }
  }

  private toFact(
    order: Order,
    establishmentId: string,
    currentProducts: readonly { id: string; establishmentId: string }[],
    channels: Awaited<ReturnType<SalesChannelsRepository['findMany']>>,
  ): AnalyticsSalesFact {
    const currentProductIds = new Set(
      currentProducts
        .filter((product) => product.establishmentId === establishmentId)
        .map((product) => product.id),
    )
    const currentChannelIds = new Set(
      channels
        .filter((channel) => channel.establishmentId === establishmentId)
        .map((channel) => channel.id),
    )
    return {
      orderId: order.id,
      registeredAt: order.createdAt,
      status: order.status,
      canceledAt: order.cancellation?.canceledAt ?? null,
      totalCents: Math.round(order.total * 100),
      channel: {
        snapshotId: order.channel?.channelId ?? null,
        name: order.channel?.name ?? 'Sem canal',
        currentId:
          order.channel && currentChannelIds.has(order.channel.channelId)
            ? order.channel.channelId
            : null,
      },
      lines: order.lines.map((line) => ({
        productSnapshotId: line.product.productId,
        productName: line.product.name,
        currentProductId: currentProductIds.has(line.product.productId)
          ? line.product.productId
          : null,
        quantity: line.quantity,
        allocatedNetSalesCents: line.allocatedNetSalesCents,
        cogsCents: line.cogsCents,
      })),
    }
  }
}
