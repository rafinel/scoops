import type { Order, OrderCreate } from '@scoops/core/pdv/domain/entities'
import type { OrderLine, OrderListParams } from '@scoops/core/pdv/domain/structures'
import type { OrdersRepository } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { and, asc, count, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleOrderMapper } from '@/pdv/database/drizzle/mappers/drizzle-order-mapper'
import { orderDiscountComponentAccompanimentModel } from '@/pdv/database/drizzle/models/order-discount-component-accompaniment-model'
import { orderDiscountComponentModel } from '@/pdv/database/drizzle/models/order-discount-component-model'
import { orderDiscountLineModel } from '@/pdv/database/drizzle/models/order-discount-line-model'
import { orderDiscountModel } from '@/pdv/database/drizzle/models/order-discount-model'
import { orderLineAccompanimentModel } from '@/pdv/database/drizzle/models/order-line-accompaniment-model'
import { orderLineConsumptionModel } from '@/pdv/database/drizzle/models/order-line-consumption-model'
import { orderLineModel } from '@/pdv/database/drizzle/models/order-line-model'
import { orderModel } from '@/pdv/database/drizzle/models/order-model'
import { orderSequenceModel } from '@/pdv/database/drizzle/models/order-sequence-model'

type AggregateRows = {
  readonly lines: readonly (typeof orderLineModel.$inferSelect)[]
  readonly lineAccompaniments: readonly (typeof orderLineAccompanimentModel.$inferSelect)[]
  readonly lineConsumptions: readonly (typeof orderLineConsumptionModel.$inferSelect)[]
  readonly discounts: readonly (typeof orderDiscountModel.$inferSelect)[]
  readonly components: readonly (typeof orderDiscountComponentModel.$inferSelect)[]
  readonly componentAccompaniments: readonly (typeof orderDiscountComponentAccompanimentModel.$inferSelect)[]
  readonly discountLines: readonly (typeof orderDiscountLineModel.$inferSelect)[]
}

@Injectable()
export class DrizzleOrdersRepository
  extends DrizzleRepository
  implements OrdersRepository
{
  async add(input: OrderCreate): Promise<Order> {
    try {
      const sequenceNumber = await this.findReservedSequenceNumber(input.establishmentId)
      const orderId = crypto.randomUUID()
      const createdAt = new Date()
      const [record] = await this.database
        .insert(orderModel)
        .values({
          id: orderId,
          establishmentId: input.establishmentId,
          idempotencyKey: input.idempotencyKey,
          sequenceNumber,
          createdBy: input.createdBy,
          channelId: input.channel?.channelId ?? null,
          channelName: input.channel?.name ?? null,
          channelPercentage:
            input.channel?.percentage === undefined
              ? null
              : String(input.channel.percentage),
          subtotal: String(input.subtotal),
          totalDiscount: String(input.totalDiscount),
          total: String(input.total),
          createdAt,
        })
        .returning()

      if (!record) throw new ConflictError('Database operation conflicted')

      const lineRows = input.lines.map((line, position) =>
        this.toLineRow(orderId, line, position),
      )
      const lineRecords = lineRows.length
        ? await this.database.insert(orderLineModel).values(lineRows).returning()
        : []
      const lineIdsByProductId = new Map(
        lineRecords.map((line) => [line.productId, line.id]),
      )
      const linesByProductId = new Map(
        input.lines.map((line) => [line.product.productId, line]),
      )

      const lineAccompanimentRows = input.lines.flatMap((line, linePosition) => {
        const orderLineId = lineRecords[linePosition]?.id
        if (!orderLineId) return []
        return line.accompaniments.map((accompaniment, position) => ({
          orderLineId,
          accompanimentId: accompaniment.accompanimentId,
          position,
          name: accompaniment.name,
          type: accompaniment.type,
          quantity: String(accompaniment.quantity),
          basePrice: String(accompaniment.basePrice),
          finalPrice: String(accompaniment.finalPrice),
        }))
      })
      const lineAccompanimentRecords = lineAccompanimentRows.length
        ? await this.database
            .insert(orderLineAccompanimentModel)
            .values(lineAccompanimentRows)
            .returning()
        : []

      const lineConsumptionRows = input.lines.flatMap((line, linePosition) => {
        const orderLineId = lineRecords[linePosition]?.id
        if (!orderLineId) return []
        return line.consumptions.map((consumption, position) => ({
          orderLineId,
          position,
          productId: consumption.productId,
          brandId: consumption.brandId ?? null,
          quantity: String(consumption.quantity),
        }))
      })
      const lineConsumptionRecords = lineConsumptionRows.length
        ? await this.database
            .insert(orderLineConsumptionModel)
            .values(lineConsumptionRows)
            .returning()
        : []

      const discountRows = input.discounts.map((discount, position) =>
        this.toDiscountRows(
          orderId,
          discount,
          position,
          linesByProductId,
          lineIdsByProductId,
        ),
      )
      const discountRecords = discountRows.length
        ? await this.database
            .insert(orderDiscountModel)
            .values(discountRows.map(({ discount }) => discount))
            .returning()
        : []
      const componentRows = discountRows.flatMap(({ components }) => components)
      const componentRecords = componentRows.length
        ? await this.database
            .insert(orderDiscountComponentModel)
            .values(componentRows)
            .returning()
        : []
      const componentAccompanimentRows = discountRows.flatMap(
        ({ componentAccompaniments }) => componentAccompaniments,
      )
      const componentAccompanimentRecords = componentAccompanimentRows.length
        ? await this.database
            .insert(orderDiscountComponentAccompanimentModel)
            .values(componentAccompanimentRows)
            .returning()
        : []
      const discountLineRows = discountRows.flatMap(({ discountLines }) => discountLines)
      const discountLineRecords = discountLineRows.length
        ? await this.database
            .insert(orderDiscountLineModel)
            .values(discountLineRows)
            .returning()
        : []

      return DrizzleOrderMapper.toDomain(
        record,
        lineRecords,
        lineAccompanimentRecords,
        lineConsumptionRecords,
        discountRecords,
        componentRecords,
        componentAccompanimentRecords,
        discountLineRecords,
      )
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(establishmentId: string, orderId: string): Promise<Order | undefined> {
    const [record] = await this.database
      .select()
      .from(orderModel)
      .where(
        and(eq(orderModel.establishmentId, establishmentId), eq(orderModel.id, orderId)),
      )
      .limit(1)
    if (!record) return undefined
    return this.toDomain(record)
  }

  async findByIdempotencyKey(
    establishmentId: string,
    idempotencyKey: string,
  ): Promise<Order | undefined> {
    const [record] = await this.database
      .select()
      .from(orderModel)
      .where(
        and(
          eq(orderModel.establishmentId, establishmentId),
          eq(orderModel.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1)
    if (!record) return undefined
    return this.toDomain(record)
  }

  async findMany(input: OrderListParams): Promise<PaginationResponse<Order>> {
    const filters = [eq(orderModel.establishmentId, input.establishmentId)]
    if (input.createdFrom) filters.push(gte(orderModel.createdAt, input.createdFrom))
    if (input.createdTo) filters.push(lte(orderModel.createdAt, input.createdTo))
    if (input.channelId) filters.push(eq(orderModel.channelId, input.channelId))
    const where = and(...filters)
    const [records, totalRecords] = await Promise.all([
      this.database
        .select()
        .from(orderModel)
        .where(where)
        .orderBy(desc(orderModel.createdAt), desc(orderModel.id))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.select({ count: count() }).from(orderModel).where(where),
    ])
    const aggregates = await this.findAggregateRows(records.map((record) => record.id))
    const orders = await Promise.all(
      records.map((record) => this.toDomain(record, aggregates.get(record.id))),
    )
    const total = Number(totalRecords[0]?.count ?? 0)
    return new PaginationResponse(
      orders,
      input.page,
      input.pageSize,
      total,
      Math.ceil(total / input.pageSize),
    )
  }

  async removeAll(): Promise<void> {
    await this.database.delete(orderDiscountLineModel)
    await this.database.delete(orderDiscountComponentAccompanimentModel)
    await this.database.delete(orderLineAccompanimentModel)
    await this.database.delete(orderLineConsumptionModel)
    await this.database.delete(orderDiscountComponentModel)
    await this.database.delete(orderDiscountModel)
    await this.database.delete(orderLineModel)
    await this.database.delete(orderModel)
  }

  private async findReservedSequenceNumber(establishmentId: string): Promise<number> {
    const [record] = await this.database
      .select({ sequenceNumber: orderSequenceModel.lastSequenceNumber })
      .from(orderSequenceModel)
      .where(eq(orderSequenceModel.establishmentId, establishmentId))
      .limit(1)
    if (!record) throw new ConflictError('Database operation conflicted')
    return record.sequenceNumber
  }

  private toLineRow(orderId: string, line: OrderLine, position: number) {
    return {
      id: crypto.randomUUID(),
      orderId,
      position,
      productId: line.product.productId,
      productName: line.product.name,
      kind: line.product.kind,
      brandId: line.brand?.brandId ?? null,
      brandName: line.brand?.name ?? null,
      sizeId: line.size?.sizeId ?? null,
      sizeName: line.size?.name ?? null,
      sizeQuantity: line.size ? String(line.size.quantity) : null,
      quantity: line.quantity,
      baseUnitPrice: String(line.baseUnitPrice),
      finalUnitPrice: String(line.finalUnitPrice),
      subtotal: String(line.subtotal),
    }
  }

  private toDiscountRows(
    orderId: string,
    orderDiscount: Order['discounts'][number],
    position: number,
    linesByProductId: ReadonlyMap<string, OrderLine>,
    lineIdsByProductId: ReadonlyMap<string, string>,
  ) {
    const id = crypto.randomUUID()
    const linkedProductIds = new Set(orderDiscount.lineProductIds)
    const components = orderDiscount.discount.components.map(
      (component, componentPosition) => {
        const line = linesByProductId.get(component.productId)
        const unitPrice = this.findComponentUnitPrice(
          component.productId,
          linesByProductId,
        )
        return {
          id: crypto.randomUUID(),
          orderDiscountId: id,
          productId: component.productId,
          kind: component.kind,
          quantity: component.quantity,
          sizeId: component.kind === 'portion' ? component.sizeId : null,
          brandId: component.kind === 'resale' ? (component.brandId ?? null) : null,
          unitPrice: String(unitPrice),
          subtotal: String(unitPrice * component.quantity),
          position: componentPosition,
          lineProductId:
            line && linkedProductIds.has(component.productId)
              ? component.productId
              : undefined,
        }
      },
    )
    return {
      discount: {
        id,
        orderId,
        discountId: orderDiscount.discount.discountId,
        name: orderDiscount.discount.name,
        type: orderDiscount.discount.type,
        fixedPrice: String(orderDiscount.discount.fixedPrice),
        preDiscountTotal: String(
          orderDiscount.discount.fixedPrice + orderDiscount.savings,
        ),
        savings: String(orderDiscount.savings),
        position,
      },
      components: components.map(
        ({ lineProductId: _lineProductId, ...component }) => component,
      ),
      componentAccompaniments: components.flatMap((component, componentPosition) => {
        const source = orderDiscount.discount.components[componentPosition]
        if (source?.kind !== 'portion') return []
        return source.accompanimentIds.map((accompanimentId, accompanimentPosition) => ({
          componentId: component.id,
          accompanimentId,
          position: accompanimentPosition,
        }))
      }),
      discountLines: components.flatMap((component) =>
        component.lineProductId && lineIdsByProductId.has(component.lineProductId)
          ? [
              {
                componentId: component.id,
                orderLineId: lineIdsByProductId.get(component.lineProductId) as string,
              },
            ]
          : [],
      ),
    }
  }

  private findComponentUnitPrice(
    productId: string,
    linesByProductId: ReadonlyMap<string, OrderLine>,
  ): number {
    return linesByProductId.get(productId)?.finalUnitPrice ?? 0
  }

  private async toDomain(
    record: typeof orderModel.$inferSelect,
    aggregateRows?: AggregateRows,
  ): Promise<Order> {
    const aggregates =
      aggregateRows ?? (await this.findAggregateRows([record.id])).get(record.id)
    if (!aggregates) throw new ConflictError('Database operation conflicted')
    return DrizzleOrderMapper.toDomain(
      record,
      aggregates.lines,
      aggregates.lineAccompaniments,
      aggregates.lineConsumptions,
      aggregates.discounts,
      aggregates.components,
      aggregates.componentAccompaniments,
      aggregates.discountLines,
    )
  }

  private async findAggregateRows(
    orderIds: readonly string[],
  ): Promise<Map<string, AggregateRows>> {
    const rowsByOrderId = new Map<string, AggregateRows>()
    if (orderIds.length === 0) return rowsByOrderId

    const lines = await this.database
      .select()
      .from(orderLineModel)
      .where(inArray(orderLineModel.orderId, [...orderIds]))
      .orderBy(asc(orderLineModel.position), asc(orderLineModel.id))
    const lineIds = lines.map((line) => line.id)
    const lineAccompaniments = lineIds.length
      ? await this.database
          .select()
          .from(orderLineAccompanimentModel)
          .where(inArray(orderLineAccompanimentModel.orderLineId, lineIds))
          .orderBy(asc(orderLineAccompanimentModel.position))
      : []
    const lineConsumptions = lineIds.length
      ? await this.database
          .select()
          .from(orderLineConsumptionModel)
          .where(inArray(orderLineConsumptionModel.orderLineId, lineIds))
          .orderBy(asc(orderLineConsumptionModel.position))
      : []
    const discounts = await this.database
      .select()
      .from(orderDiscountModel)
      .where(inArray(orderDiscountModel.orderId, [...orderIds]))
      .orderBy(asc(orderDiscountModel.position), asc(orderDiscountModel.id))
    const discountIds = discounts.map((discount) => discount.id)
    const components = discountIds.length
      ? await this.database
          .select()
          .from(orderDiscountComponentModel)
          .where(inArray(orderDiscountComponentModel.orderDiscountId, discountIds))
          .orderBy(
            asc(orderDiscountComponentModel.position),
            asc(orderDiscountComponentModel.id),
          )
      : []
    const componentIds = components.map((component) => component.id)
    const componentAccompaniments = componentIds.length
      ? await this.database
          .select()
          .from(orderDiscountComponentAccompanimentModel)
          .where(
            inArray(orderDiscountComponentAccompanimentModel.componentId, componentIds),
          )
          .orderBy(asc(orderDiscountComponentAccompanimentModel.position))
      : []
    const discountLines = componentIds.length
      ? await this.database
          .select()
          .from(orderDiscountLineModel)
          .where(inArray(orderDiscountLineModel.componentId, componentIds))
      : []

    for (const orderId of orderIds) {
      const orderLineIds = new Set(
        lines.filter((line) => line.orderId === orderId).map((line) => line.id),
      )
      const orderDiscountIds = new Set(
        discounts
          .filter((discount) => discount.orderId === orderId)
          .map((discount) => discount.id),
      )
      const orderComponentIds = new Set(
        components
          .filter((component) => orderDiscountIds.has(component.orderDiscountId))
          .map((component) => component.id),
      )
      rowsByOrderId.set(orderId, {
        lines: lines.filter((line) => line.orderId === orderId),
        lineAccompaniments: lineAccompaniments.filter((row) =>
          orderLineIds.has(row.orderLineId),
        ),
        lineConsumptions: lineConsumptions.filter((row) =>
          orderLineIds.has(row.orderLineId),
        ),
        discounts: discounts.filter((discount) => discount.orderId === orderId),
        components: components.filter((component) => orderComponentIds.has(component.id)),
        componentAccompaniments: componentAccompaniments.filter((row) =>
          orderComponentIds.has(row.componentId),
        ),
        discountLines: discountLines.filter((row) =>
          orderComponentIds.has(row.componentId),
        ),
      })
    }
    return rowsByOrderId
  }

  private toConflictError(error: unknown): unknown {
    if (error instanceof ConflictError) return error
    if (this.isIntegrityConstraintError(error))
      return new ConflictError('Database operation conflicted')
    return error
  }

  private isIntegrityConstraintError(error: unknown): boolean {
    let currentError: unknown = error
    while (currentError && typeof currentError === 'object') {
      if (
        'code' in currentError &&
        (currentError.code === '23505' ||
          currentError.code === '23503' ||
          currentError.code === '23514')
      )
        return true
      if (!('cause' in currentError)) return false
      currentError = currentError.cause
    }
    return false
  }
}
