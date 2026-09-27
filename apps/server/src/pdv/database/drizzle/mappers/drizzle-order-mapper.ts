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
  DrizzleOrderLineCostComponent,
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
    lineCostComponents: readonly DrizzleOrderLineCostComponent[] = [],
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
    const lineCostComponentsByLineId = DrizzleOrderMapper.groupBy(
      lineCostComponents,
      (component) => component.orderLineId,
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
    const linesById = DrizzleOrderMapper.indexLinesById(lines)

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
          lineCostComponentsByLineId.get(line.id) ?? [],
        ),
      ),
      discounts: DrizzleOrderMapper.sortByPosition(discounts).map((discount) =>
        DrizzleOrderMapper.toOrderDiscount({
          record: discount,
          components: componentsByDiscountId.get(discount.id) ?? [],
          componentAccompanimentsByComponentId,
          discountLinesByComponentId,
          linesById,
        }),
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
    if (record.status === OrderStatus.Registered) {
      if (DrizzleOrderMapper.hasCancellationFields(record) || restorations.length > 0)
        throw new ConflictError('A operação no banco de dados entrou em conflito.')
      return undefined
    }

    if (
      record.status !== OrderStatus.Canceled ||
      record.canceledAt === null ||
      record.canceledBy === null ||
      record.canceledByName === null ||
      record.canceledByName.trim().length === 0
    )
      throw new ConflictError('A operação no banco de dados entrou em conflito.')

    return DrizzleOrderMapper.toCancellationSnapshot(record, restorations)
  }

  private static toOrderLine(
    record: DrizzleOrderLine,
    lineAccompaniments: readonly DrizzleOrderLineAccompaniment[],
    lineConsumptions: readonly DrizzleOrderLineConsumption[],
    lineCostComponents: readonly DrizzleOrderLineCostComponent[],
  ): OrderLine {
    return Object.assign(
      DrizzleOrderMapper.toLineProductDetails(record),
      DrizzleOrderMapper.toLineChildren(
        lineAccompaniments,
        lineConsumptions,
        lineCostComponents,
      ),
    )
  }

  private static toLineProductDetails(record: DrizzleOrderLine) {
    return Object.assign(
      DrizzleOrderMapper.toProductSnapshots(record),
      DrizzleOrderMapper.toLineAmounts(record),
    )
  }

  private static toLineAmounts(
    record: DrizzleOrderLine,
  ): Pick<
    OrderLine,
    | 'quantity'
    | 'baseUnitPrice'
    | 'finalUnitPrice'
    | 'subtotal'
    | 'allocatedNetSalesCents'
    | 'cogsCents'
  > {
    return {
      ...DrizzleOrderMapper.toLinePriceAmounts(record),
      ...DrizzleOrderMapper.toLineCostAmounts(record),
    }
  }

  private static toLinePriceAmounts(
    record: DrizzleOrderLine,
  ): Pick<OrderLine, 'quantity' | 'baseUnitPrice' | 'finalUnitPrice' | 'subtotal'> {
    return {
      quantity: record.quantity,
      baseUnitPrice: Number(record.baseUnitPrice),
      finalUnitPrice: Number(record.finalUnitPrice),
      subtotal: Number(record.subtotal),
    }
  }

  private static toLineCostAmounts(
    record: DrizzleOrderLine,
  ): Pick<OrderLine, 'allocatedNetSalesCents' | 'cogsCents'> {
    return {
      allocatedNetSalesCents: record.allocatedNetSalesCents,
      cogsCents: record.cogsCents,
    }
  }

  private static toOrderDiscount(input: DiscountMappingInput): OrderDiscount {
    return DrizzleOrderMapper.createOrderDiscount(
      input.record,
      DrizzleOrderMapper.toDiscountOrderData(input),
    )
  }

  private static toDiscountComponent(
    record: DrizzleOrderDiscountComponent,
    accompaniments: readonly DrizzleOrderDiscountComponentAccompaniment[],
  ): DiscountComponent {
    if (record.kind === 'portion')
      return DrizzleOrderMapper.toPortionDiscountComponent(record, accompaniments)
    return DrizzleOrderMapper.toProductDiscountComponent(record)
  }

  private static toPortionDiscountComponent(
    record: DrizzleOrderDiscountComponent,
    accompaniments: readonly DrizzleOrderDiscountComponentAccompaniment[],
  ): DiscountComponent {
    return {
      ...DrizzleOrderMapper.toDiscountComponentBase(record),
      sizeId: record.sizeId as string,
      accompanimentIds: DrizzleOrderMapper.sortByPosition(accompaniments).map(
        (accompaniment) => accompaniment.accompanimentId,
      ),
    }
  }

  private static toProductDiscountComponent(
    record: DrizzleOrderDiscountComponent,
  ): DiscountComponent {
    return {
      ...DrizzleOrderMapper.toDiscountComponentBase(record),
      kind: 'resale',
      ...(record.brandId ? { brandId: record.brandId } : {}),
    }
  }

  private static toDiscountComponentBase(
    record: DrizzleOrderDiscountComponent,
  ): Pick<DiscountComponent, 'kind' | 'productId' | 'quantity'> {
    return {
      kind: record.kind,
      productId: record.productId,
      quantity: record.quantity,
    }
  }

  private static toLineProductId(
    component: DrizzleOrderDiscountComponent,
    discountLinesByComponentId: ReadonlyMap<string, readonly DrizzleOrderDiscountLine[]>,
    linesById: ReadonlyMap<string, DrizzleOrderLine>,
  ): string {
    const link = discountLinesByComponentId.get(component.id)?.[0]
    if (!link) return component.productId
    return linesById.get(link.orderLineId)?.productId ?? component.productId
  }

  private static createOrderDiscount(
    record: DrizzleOrderDiscount,
    details: DiscountOrderData,
  ): OrderDiscount {
    const [components, lineProductIds] = details
    return {
      discount: DrizzleOrderMapper.toDiscountSnapshot(record, components),
      savings: Number(record.savings),
      lineProductIds,
    }
  }

  private static toDiscountOrderData(input: DiscountMappingInput): DiscountOrderData {
    return DrizzleOrderMapper.mapTogether(
      DrizzleOrderMapper.sortByPosition(input.components),
      DrizzleOrderMapper.toDiscountComponentMapper(input),
      DrizzleOrderMapper.toLineProductIdMapper(input),
    )
  }

  private static toDiscountComponentMapper(
    input: DiscountMappingInput,
  ): (component: DrizzleOrderDiscountComponent) => DiscountComponent {
    return (component) =>
      DrizzleOrderMapper.toDiscountComponent(
        component,
        input.componentAccompanimentsByComponentId.get(component.id) ?? [],
      )
  }

  private static toLineProductIdMapper(
    input: DiscountMappingInput,
  ): (component: DrizzleOrderDiscountComponent) => string {
    return (component) =>
      DrizzleOrderMapper.toLineProductId(
        component,
        input.discountLinesByComponentId,
        input.linesById,
      )
  }

  private static mapTogether<Row, First, Second>(
    rows: readonly Row[],
    mapFirst: (row: Row) => First,
    mapSecond: (row: Row) => Second,
  ): [First[], Second[]] {
    const first: First[] = []
    const second: Second[] = []
    for (const row of rows) {
      first.push(mapFirst(row))
      second.push(mapSecond(row))
    }
    return [first, second]
  }

  private static toDiscountSnapshot(
    record: DrizzleOrderDiscount,
    components: readonly DiscountComponent[],
  ): OrderDiscount['discount'] {
    return {
      discountId: record.discountId,
      name: record.name,
      type: record.type,
      fixedPrice: Number(record.fixedPrice),
      components,
    }
  }

  private static toCancellationSnapshot(
    record: DrizzleOrder,
    restorations: readonly DrizzleOrderStockRestoration[],
  ): NonNullable<Order['cancellation']> {
    return {
      ...DrizzleOrderMapper.toCancellationActor(record),
      ...DrizzleOrderMapper.toCancellationReason(record.cancellationReason),
      outcomes: DrizzleOrderMapper.toRestorationOutcomes(restorations),
    }
  }

  private static toCancellationActor(
    record: DrizzleOrder,
  ): Pick<
    NonNullable<Order['cancellation']>,
    'canceledAt' | 'canceledBy' | 'canceledByName'
  > {
    return {
      canceledAt: record.canceledAt as Date,
      canceledBy: record.canceledBy as string,
      canceledByName: record.canceledByName as string,
    }
  }

  private static toCancellationReason(
    reason: string | null,
  ): Pick<NonNullable<Order['cancellation']>, 'reason'> | Record<string, never> {
    return reason !== null ? { reason } : {}
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
    for (const row of rows) DrizzleOrderMapper.addToGroup(groups, keyOf(row), row)
    return groups
  }

  private static addToGroup<Row>(
    groups: Map<string, Row[]>,
    key: string,
    row: Row,
  ): void {
    const group = groups.get(key)
    if (group) group.push(row)
    else groups.set(key, [row])
  }
  private static toLineChildren(
    accompaniments: readonly DrizzleOrderLineAccompaniment[],
    consumptions: readonly DrizzleOrderLineConsumption[],
    costComponents: readonly DrizzleOrderLineCostComponent[],
  ): Pick<OrderLine, 'accompaniments' | 'consumptions' | 'costComponents'> {
    return {
      accompaniments: DrizzleOrderMapper.toLineAccompaniments(accompaniments),
      costComponents: DrizzleOrderMapper.toLineCostComponents(costComponents),
      consumptions: DrizzleOrderMapper.toLineConsumptions(consumptions),
    }
  }

  private static toLineAccompaniments(
    rows: readonly DrizzleOrderLineAccompaniment[],
  ): AccompanimentSnapshot[] {
    return DrizzleOrderMapper.sortByPosition(rows).map(
      DrizzleOrderMapper.toLineAccompaniment,
    )
  }

  private static toLineCostComponents(
    rows: readonly DrizzleOrderLineCostComponent[],
  ): OrderLine['costComponents'] {
    return rows.map(DrizzleOrderMapper.toLineCostComponent)
  }

  private static toLineConsumptions(
    rows: readonly DrizzleOrderLineConsumption[],
  ): OrderLine['consumptions'] {
    return DrizzleOrderMapper.sortByPosition(rows).map(
      DrizzleOrderMapper.toLineConsumption,
    )
  }

  private static toProductSnapshots(record: DrizzleOrderLine): {
    product: ProductSnapshot
    brand?: BrandSnapshot
    size?: ProductSizeSnapshot
  } {
    return {
      product: DrizzleOrderMapper.toProductSnapshot(record),
      ...(DrizzleOrderMapper.toBrandSnapshot(record) ?? {}),
      ...(DrizzleOrderMapper.toProductSizeSnapshot(record) ?? {}),
    }
  }

  private static toProductSnapshot(record: DrizzleOrderLine): ProductSnapshot {
    return { productId: record.productId, name: record.productName, kind: record.kind }
  }

  private static toBrandSnapshot(
    record: DrizzleOrderLine,
  ): { brand: BrandSnapshot } | undefined {
    return record.brandId && record.brandName
      ? { brand: { brandId: record.brandId, name: record.brandName } }
      : undefined
  }

  private static toProductSizeSnapshot(
    record: DrizzleOrderLine,
  ): { size: ProductSizeSnapshot } | undefined {
    if (!(record.sizeId && record.sizeName && record.sizeQuantity !== null))
      return undefined
    return { size: DrizzleOrderMapper.toProductSize(record) }
  }

  private static toProductSize(record: DrizzleOrderLine): ProductSizeSnapshot {
    return {
      sizeId: record.sizeId as string,
      name: record.sizeName as string,
      quantity: Number(record.sizeQuantity),
    }
  }

  private static toLineAccompaniment(
    accompaniment: DrizzleOrderLineAccompaniment,
  ): AccompanimentSnapshot {
    return {
      accompanimentId: accompaniment.accompanimentId,
      name: accompaniment.name,
      type: accompaniment.type,
      quantity: Number(accompaniment.quantity),
      ...DrizzleOrderMapper.toAccompanimentPrices(accompaniment),
    }
  }

  private static toAccompanimentPrices(
    accompaniment: DrizzleOrderLineAccompaniment,
  ): Pick<AccompanimentSnapshot, 'basePrice' | 'finalPrice'> {
    return {
      basePrice: Number(accompaniment.basePrice),
      finalPrice: Number(accompaniment.finalPrice),
    }
  }

  private static toLineCostComponent(
    component: DrizzleOrderLineCostComponent,
  ): OrderLine['costComponents'][number] {
    return {
      ...DrizzleOrderMapper.toLineCostComponentIdentity(component),
      ...DrizzleOrderMapper.toLineCostComponentAmounts(component),
    }
  }

  private static toLineCostComponentIdentity(
    component: DrizzleOrderLineCostComponent,
  ): Pick<
    OrderLine['costComponents'][number],
    'kind' | 'productId' | 'brandId' | 'accompanimentId'
  > {
    return {
      kind: component.kind as OrderLine['costComponents'][number]['kind'],
      productId: component.productId,
      ...DrizzleOrderMapper.toLineCostComponentAssociations(component),
    }
  }

  private static toLineCostComponentAssociations(
    component: DrizzleOrderLineCostComponent,
  ): Pick<OrderLine['costComponents'][number], 'brandId' | 'accompanimentId'> {
    return {
      ...(component.brandId ? { brandId: component.brandId } : {}),
      ...(component.accompanimentId
        ? { accompanimentId: component.accompanimentId }
        : {}),
    }
  }

  private static toLineCostComponentAmounts(
    component: DrizzleOrderLineCostComponent,
  ): Pick<
    OrderLine['costComponents'][number],
    'quantity' | 'unitCost' | 'extendedCostCents'
  > {
    return {
      quantity: Number(component.quantity),
      unitCost: component.unitCost === null ? null : Number(component.unitCost),
      extendedCostCents: component.extendedCostCents,
    }
  }

  private static toLineConsumption(
    consumption: DrizzleOrderLineConsumption,
  ): OrderLine['consumptions'][number] {
    return {
      productId: consumption.productId,
      ...(consumption.brandId ? { brandId: consumption.brandId } : {}),
      quantity: Number(consumption.quantity),
    }
  }

  private static indexLinesById(
    lines: readonly DrizzleOrderLine[],
  ): ReadonlyMap<string, DrizzleOrderLine> {
    return new Map(lines.map((line) => [line.id, line]))
  }

  private static hasCancellationFields(record: DrizzleOrder): boolean {
    return (
      record.canceledAt !== null ||
      record.canceledBy !== null ||
      record.canceledByName !== null ||
      record.cancellationReason !== null
    )
  }

  private static toRestorationOutcomes(
    restorations: readonly DrizzleOrderStockRestoration[],
  ): NonNullable<Order['cancellation']>['outcomes'] {
    return DrizzleOrderMapper.sortByPosition(restorations).map(
      DrizzleOrderMapper.toRestorationOutcome,
    )
  }

  private static toRestorationOutcome(
    restoration: DrizzleOrderStockRestoration,
  ): NonNullable<Order['cancellation']>['outcomes'][number] {
    DrizzleOrderMapper.validateRestorationBrand(restoration)
    return {
      ...DrizzleOrderMapper.toRestorationProduct(restoration),
      ...DrizzleOrderMapper.toRestorationMetadata(restoration),
      ...DrizzleOrderMapper.toRestorationStatus(restoration),
    }
  }

  private static toRestorationMetadata(
    restoration: DrizzleOrderStockRestoration,
  ): Pick<
    NonNullable<Order['cancellation']>['outcomes'][number],
    'linePosition' | 'brandId' | 'brandName'
  > {
    return {
      ...DrizzleOrderMapper.toRestorationLinePosition(restoration),
      ...DrizzleOrderMapper.toRestorationBrandSnapshot(restoration),
    }
  }

  private static toRestorationStatus(
    restoration: DrizzleOrderStockRestoration,
  ): Pick<
    NonNullable<Order['cancellation']>['outcomes'][number],
    'quantity' | 'outcome'
  > {
    return {
      quantity: Number(restoration.quantity),
      outcome: restoration.outcome,
    }
  }

  private static toRestorationProduct(
    restoration: DrizzleOrderStockRestoration,
  ): Pick<
    NonNullable<Order['cancellation']>['outcomes'][number],
    'productId' | 'productName'
  > {
    return {
      productId: restoration.productId,
      productName: restoration.productName,
    }
  }

  private static validateRestorationBrand(
    restoration: DrizzleOrderStockRestoration,
  ): void {
    if (
      (restoration.brandId === null) !== (restoration.brandName === null) ||
      restoration.brandName?.trim().length === 0
    )
      throw new ConflictError('A operação no banco de dados entrou em conflito.')
  }

  private static toRestorationLinePosition(
    restoration: DrizzleOrderStockRestoration,
  ): { linePosition: number } | Record<string, never> {
    return restoration.linePosition !== null
      ? { linePosition: restoration.linePosition }
      : {}
  }

  private static toRestorationBrandSnapshot(
    restoration: DrizzleOrderStockRestoration,
  ): { brandId: string; brandName: string } | Record<string, never> {
    return restoration.brandId
      ? {
          brandId: restoration.brandId,
          brandName: restoration.brandName as string,
        }
      : {}
  }
}

type DiscountOrderData = readonly [readonly DiscountComponent[], string[]]

type DiscountMappingInput = {
  record: DrizzleOrderDiscount
  components: readonly DrizzleOrderDiscountComponent[]
  componentAccompanimentsByComponentId: ReadonlyMap<
    string,
    readonly DrizzleOrderDiscountComponentAccompaniment[]
  >
  discountLinesByComponentId: ReadonlyMap<string, readonly DrizzleOrderDiscountLine[]>
  linesById: ReadonlyMap<string, DrizzleOrderLine>
}
