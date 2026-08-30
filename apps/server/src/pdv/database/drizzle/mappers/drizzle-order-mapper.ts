import type { Order } from '@scoops/core/pdv/domain/entities'
import { OrderStatus } from '@scoops/core/pdv/domain/structures'
import type {
  AccompanimentSnapshot,
  BrandSnapshot,
  DiscountComponent,
  OrderDiscount,
  OrderLine,
  ProductSizeSnapshot,
  ProductSnapshot,
} from '@scoops/core/pdv/domain/structures'

import type {
  DrizzleOrder,
  DrizzleOrderDiscount,
  DrizzleOrderDiscountComponent,
  DrizzleOrderDiscountComponentAccompaniment,
  DrizzleOrderDiscountLine,
  DrizzleOrderLine,
  DrizzleOrderLineAccompaniment,
  DrizzleOrderLineConsumption,
  DrizzleOrderStockRestoration,
} from '@/pdv/database/drizzle/types'
import { ConflictError } from '@scoops/core/shared/domain/errors'

export class DrizzleOrderMapper {
  static toDomain(
    record: DrizzleOrder,
    lines: readonly DrizzleOrderLine[],
    lineAccompaniments: readonly DrizzleOrderLineAccompaniment[],
    lineConsumptions: readonly DrizzleOrderLineConsumption[],
    discounts: readonly DrizzleOrderDiscount[],
    components: readonly DrizzleOrderDiscountComponent[],
    componentAccompaniments: readonly DrizzleOrderDiscountComponentAccompaniment[],
    discountLines: readonly DrizzleOrderDiscountLine[],
    restorations: readonly DrizzleOrderStockRestoration[] = [],
  ): Order {
    const cancellation = DrizzleOrderMapper.toCancellation(record, restorations)
    const lineAccompanimentsByLineId = DrizzleOrderMapper.groupBy(
      lineAccompaniments,
      (accompaniment) => accompaniment.orderLineId,
    )
    const lineConsumptionsByLineId = DrizzleOrderMapper.groupBy(
      lineConsumptions,
      (consumption) => consumption.orderLineId,
    )
    const componentsByDiscountId = DrizzleOrderMapper.groupBy(
      components,
      (component) => component.orderDiscountId,
    )
    const componentAccompanimentsByComponentId = DrizzleOrderMapper.groupBy(
      componentAccompaniments,
      (accompaniment) => accompaniment.componentId,
    )
    const discountLinesByComponentId = DrizzleOrderMapper.groupBy(
      discountLines,
      (discountLine) => discountLine.componentId,
    )
    const linesById = new Map(lines.map((line) => [line.id, line]))

    return {
      id: record.id,
      establishmentId: record.establishmentId,
      idempotencyKey: record.idempotencyKey,
      sequenceNumber: record.sequenceNumber,
      createdBy: record.createdBy,
      createdByName: record.createdByName,
      status: record.status,
      ...(record.channelId
        ? {
            channel: {
              channelId: record.channelId,
              name: record.channelName as string,
              percentage: Number(record.channelPercentage),
            },
          }
        : {}),
      lines: DrizzleOrderMapper.sortByPosition(lines).map((line) =>
        DrizzleOrderMapper.toOrderLine(
          line,
          lineAccompanimentsByLineId.get(line.id) ?? [],
          lineConsumptionsByLineId.get(line.id) ?? [],
        ),
      ),
      discounts: DrizzleOrderMapper.sortByPosition(discounts).map((discount) =>
        DrizzleOrderMapper.toOrderDiscount(
          discount,
          componentsByDiscountId.get(discount.id) ?? [],
          componentAccompanimentsByComponentId,
          discountLinesByComponentId,
          linesById,
        ),
      ),
      subtotal: Number(record.subtotal),
      totalDiscount: Number(record.totalDiscount),
      total: Number(record.total),
      ...(cancellation ? { cancellation } : {}),
      createdAt: record.createdAt,
    }
  }

  private static toCancellation(
    record: DrizzleOrder,
    restorations: readonly DrizzleOrderStockRestoration[],
  ): Order['cancellation'] {
    const hasCancellationFields =
      record.canceledAt !== null ||
      record.canceledBy !== null ||
      record.canceledByName !== null ||
      record.cancellationReason !== null

    if (record.status === OrderStatus.Registered) {
      if (hasCancellationFields || restorations.length > 0)
        throw new ConflictError('Database operation conflicted')
      return undefined
    }

    if (
      record.status !== OrderStatus.Canceled ||
      record.canceledAt === null ||
      record.canceledBy === null ||
      record.canceledByName === null ||
      record.canceledByName.trim().length === 0
    )
      throw new ConflictError('Database operation conflicted')

    return {
      canceledAt: record.canceledAt,
      canceledBy: record.canceledBy,
      canceledByName: record.canceledByName,
      ...(record.cancellationReason !== null
        ? { reason: record.cancellationReason }
        : {}),
      restorations: DrizzleOrderMapper.sortByPosition(restorations).map((restoration) => {
        if (
          (restoration.brandId === null) !== (restoration.brandName === null) ||
          restoration.brandName?.trim().length === 0
        )
          throw new ConflictError('Database operation conflicted')
        return {
          productId: restoration.productId,
          productName: restoration.productName,
          ...(restoration.brandId
            ? {
                brandId: restoration.brandId,
                brandName: restoration.brandName as string,
              }
            : {}),
          quantity: Number(restoration.quantity),
          outcome: restoration.outcome,
        }
      }),
    }
  }

  private static toOrderLine(
    record: DrizzleOrderLine,
    lineAccompaniments: readonly DrizzleOrderLineAccompaniment[],
    lineConsumptions: readonly DrizzleOrderLineConsumption[],
  ): OrderLine {
    const product: ProductSnapshot = {
      productId: record.productId,
      name: record.productName,
      kind: record.kind,
    }
    const brand: BrandSnapshot | undefined =
      record.brandId && record.brandName
        ? { brandId: record.brandId, name: record.brandName }
        : undefined
    const size: ProductSizeSnapshot | undefined =
      record.sizeId && record.sizeName && record.sizeQuantity !== null
        ? {
            sizeId: record.sizeId,
            name: record.sizeName,
            quantity: Number(record.sizeQuantity),
          }
        : undefined

    return {
      product,
      ...(brand ? { brand } : {}),
      ...(size ? { size } : {}),
      accompaniments: DrizzleOrderMapper.sortByPosition(lineAccompaniments).map(
        (accompaniment): AccompanimentSnapshot => ({
          accompanimentId: accompaniment.accompanimentId,
          name: accompaniment.name,
          type: accompaniment.type,
          quantity: Number(accompaniment.quantity),
          basePrice: Number(accompaniment.basePrice),
          finalPrice: Number(accompaniment.finalPrice),
        }),
      ),
      quantity: record.quantity,
      baseUnitPrice: Number(record.baseUnitPrice),
      finalUnitPrice: Number(record.finalUnitPrice),
      subtotal: Number(record.subtotal),
      consumptions: DrizzleOrderMapper.sortByPosition(lineConsumptions).map(
        (consumption) => ({
          productId: consumption.productId,
          ...(consumption.brandId ? { brandId: consumption.brandId } : {}),
          quantity: Number(consumption.quantity),
        }),
      ),
    }
  }

  private static toOrderDiscount(
    record: DrizzleOrderDiscount,
    components: readonly DrizzleOrderDiscountComponent[],
    componentAccompanimentsByComponentId: ReadonlyMap<
      string,
      readonly DrizzleOrderDiscountComponentAccompaniment[]
    >,
    discountLinesByComponentId: ReadonlyMap<string, readonly DrizzleOrderDiscountLine[]>,
    linesById: ReadonlyMap<string, DrizzleOrderLine>,
  ): OrderDiscount {
    const orderedComponents = DrizzleOrderMapper.sortByPosition(components)
    const discountComponents = orderedComponents.map((component) =>
      DrizzleOrderMapper.toDiscountComponent(
        component,
        componentAccompanimentsByComponentId.get(component.id) ?? [],
      ),
    )
    const lineProductIds = orderedComponents.map((component) => {
      const link = discountLinesByComponentId.get(component.id)?.[0]
      return link
        ? (linesById.get(link.orderLineId)?.productId ?? component.productId)
        : component.productId
    })

    return {
      discount: {
        discountId: record.discountId,
        name: record.name,
        type: record.type,
        fixedPrice: Number(record.fixedPrice),
        components: discountComponents,
      },
      savings: Number(record.savings),
      lineProductIds,
    }
  }

  private static toDiscountComponent(
    record: DrizzleOrderDiscountComponent,
    accompaniments: readonly DrizzleOrderDiscountComponentAccompaniment[],
  ): DiscountComponent {
    if (record.kind === 'portion') {
      return {
        kind: record.kind,
        productId: record.productId,
        quantity: record.quantity,
        sizeId: record.sizeId as string,
        accompanimentIds: DrizzleOrderMapper.sortByPosition(accompaniments).map(
          (accompaniment) => accompaniment.accompanimentId,
        ),
      }
    }

    return {
      kind: record.kind,
      productId: record.productId,
      quantity: record.quantity,
      ...(record.brandId ? { brandId: record.brandId } : {}),
    }
  }

  private static sortByPosition<Row extends { readonly position: number }>(
    rows: readonly Row[],
  ): readonly Row[] {
    return [...rows].sort((left, right) => left.position - right.position)
  }

  private static groupBy<Row>(
    rows: readonly Row[],
    keyOf: (row: Row) => string,
  ): ReadonlyMap<string, readonly Row[]> {
    const groups = new Map<string, Row[]>()
    for (const row of rows) {
      const key = keyOf(row)
      const group = groups.get(key)
      if (group) group.push(row)
      else groups.set(key, [row])
    }
    return groups
  }
}
