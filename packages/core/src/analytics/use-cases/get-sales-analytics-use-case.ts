import type { AnalyticsAccessContext } from '#analytics/domain/structures/analytics-access-context.ts'
import type { AnalyticsActor } from '#analytics/domain/structures/analytics-actor.ts'
import type { AnalyticsInterval } from '#analytics/domain/structures/analytics-interval.ts'
import type { AnalyticsPeriod } from '#analytics/domain/structures/analytics-period.ts'
import type { AnalyticsSalesFact } from '#analytics/domain/structures/analytics-sales-fact.ts'
import type { SalesAnalytics } from '#analytics/domain/structures/sales-analytics.ts'
import type { AnalyticsContextProvider } from '#analytics/interfaces/analytics-context-provider.ts'
import type { AnalyticsSalesFactsProvider } from '#analytics/interfaces/analytics-sales-facts-provider.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { actor: AnalyticsActor; period: AnalyticsPeriod }
type DateParts = { year: number; month: number; day: number; hour: number }
type CalendarDateParts = Omit<DateParts, 'hour'>
type AggregatedProduct = {
  productSnapshotId: string
  name: string
  currentProductId: string | null
  netSalesCents: number
  quantity: number
  cogsCents: number
  isCovered: boolean
}
type AggregatedChannel = {
  snapshotId: string | null
  name: string
  currentId: string | null
  netSalesCents: number
  validOrders: number
}
type SalesAggregate = {
  netSalesCents: number
  validOrders: number
  averageTicketCents: number | null
  coveredNetSalesCents: number
  cogsCents: number
  uncoveredNetSalesCents: number
  affectedProducts: Map<string, { name: string; currentProductId: string | null }>
  products: Map<string, AggregatedProduct>
  channels: Map<string, AggregatedChannel>
}
type EvolutionBucket = {
  key: string
  startAt: Date
  endAt: Date
  label: string
}
type IntervalPair = {
  selected: AnalyticsInterval
  comparison: AnalyticsInterval
}
type SalesAnalyticsBuildInput = IntervalPair & {
  period: AnalyticsPeriod
  updatedAt: Date
  facts: readonly AnalyticsSalesFact[]
  selectedAggregate: SalesAggregate
  comparisonAggregate: SalesAggregate
}

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  today: 1,
  'last-7-days': 7,
  'last-30-days': 30,
  'last-90-days': 90,
}

export class GetSalesAnalyticsUseCase implements UseCase<Request, SalesAnalytics> {
  constructor(
    private readonly contextProvider: AnalyticsContextProvider,
    private readonly salesFactsProvider: AnalyticsSalesFactsProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute({ actor, period }: Request): Promise<SalesAnalytics> {
    const context = await this.resolveContext(actor)
    const updatedAt = this.datetimeProvider.now()
    const intervals = this.buildIntervals(updatedAt, period, context.timeZone)
    const facts = await this.loadFacts(context.establishmentId, intervals)
    const selectedAggregate = this.aggregate(facts, intervals.selected)
    const comparisonAggregate = this.aggregate(facts, intervals.comparison)

    return this.buildSalesAnalytics({
      period,
      updatedAt,
      facts,
      ...intervals,
      selectedAggregate,
      comparisonAggregate,
    })
  }

  private async resolveContext(actor: AnalyticsActor): Promise<AnalyticsAccessContext> {
    if (actor.profile !== 'manager')
      throw new AuthorizationError('Acesso não autorizado.')

    const context = await this.contextProvider.resolve(actor)
    if (
      context.establishmentId !== actor.establishmentId ||
      !context.establishmentIsActive ||
      context.commercialAccess !== 'full'
    ) {
      throw new AuthorizationError('Acesso não autorizado.')
    }
    return context
  }

  private async loadFacts(
    establishmentId: string,
    intervals: IntervalPair,
  ): Promise<AnalyticsSalesFact[]> {
    const facts: AnalyticsSalesFact[] = []
    await this.salesFactsProvider.forEachBatch(
      { establishmentId, ...intervals },
      async (batch) => {
        facts.push(...batch)
      },
    )
    return facts
  }

  private buildSalesAnalytics(input: SalesAnalyticsBuildInput): SalesAnalytics {
    return {
      period: input.period,
      selected: input.selected,
      comparison: input.comparison,
      updatedAt: input.updatedAt,
      summary: this.buildSummary(input.selectedAggregate, input.comparisonAggregate),
      margin: this.buildMargin(input.selectedAggregate),
      cancellations: this.buildCancellations(input.facts, input.selected),
      evolution: this.buildEvolution(input.facts, input.period, input.selected),
      products: {
        byNetSales: this.buildProductRows(input.selectedAggregate, false),
        byQuantity: this.buildProductRows(input.selectedAggregate, true),
      },
      channels: this.buildChannels(input.selectedAggregate),
    }
  }

  private buildSummary(
    selected: SalesAggregate,
    comparison: SalesAggregate,
  ): SalesAnalytics['summary'] {
    return {
      netSalesCents: selected.netSalesCents,
      validOrders: selected.validOrders,
      averageTicketCents: selected.averageTicketCents,
      comparison: {
        netSales: this.calculateDelta(selected.netSalesCents, comparison.netSalesCents),
        validOrders: this.calculateDelta(selected.validOrders, comparison.validOrders),
        averageTicket: this.calculateDelta(
          selected.averageTicketCents,
          comparison.averageTicketCents,
        ),
      },
    }
  }

  private buildMargin(aggregate: SalesAggregate): SalesAnalytics['margin'] {
    const covered = aggregate.coveredNetSalesCents
    const cogs = aggregate.cogsCents
    return {
      coveredNetSalesCents: covered,
      cogsCents: cogs,
      grossMarginCents: covered === 0 ? null : covered - cogs,
      grossMarginPercentage:
        covered === 0 ? null : this.calculatePercentage(covered - cogs, covered),
      coveragePercentage: this.calculatePercentage(covered, aggregate.netSalesCents) ?? 0,
      uncoveredNetSalesCents: aggregate.uncoveredNetSalesCents,
      affectedProducts: [...aggregate.affectedProducts.values()],
    }
  }

  private buildCancellations(
    facts: readonly AnalyticsSalesFact[],
    interval: AnalyticsInterval,
  ): SalesAnalytics['cancellations'] {
    const cancellations = facts.filter(
      (fact) =>
        fact.status === 'canceled' &&
        fact.canceledAt !== null &&
        this.isInRange(fact.canceledAt, interval),
    )
    return {
      count: cancellations.length,
      valueCents: cancellations.reduce((sum, fact) => sum + fact.totalCents, 0),
    }
  }

  private buildChannels(aggregate: SalesAggregate): SalesAnalytics['channels'] {
    return [...aggregate.channels.values()]
      .sort(
        (left, right) =>
          right.netSalesCents - left.netSalesCents || left.name.localeCompare(right.name),
      )
      .map((channel) => ({
        ...channel,
        sharePercentage:
          this.calculatePercentage(channel.netSalesCents, aggregate.netSalesCents) ?? 0,
        averageTicketCents: Math.round(channel.netSalesCents / channel.validOrders),
      }))
  }

  private buildProductRows(
    aggregate: SalesAggregate,
    byQuantity: boolean,
  ): SalesAnalytics['products']['byNetSales'] {
    return [...aggregate.products.values()]
      .sort((left, right) => {
        const primary = byQuantity
          ? right.quantity - left.quantity
          : right.netSalesCents - left.netSalesCents
        if (primary !== 0) return primary
        return left.productSnapshotId.localeCompare(right.productSnapshotId)
      })
      .slice(0, 5)
      .map((product) => ({
        productSnapshotId: product.productSnapshotId,
        name: product.name,
        currentProductId: product.currentProductId,
        netSalesCents: product.netSalesCents,
        quantity: product.quantity,
        cogsCents: product.cogsCents,
        marginPercentage: product.isCovered
          ? this.calculatePercentage(
              product.netSalesCents - product.cogsCents,
              product.netSalesCents,
            )
          : null,
        coveragePercentage: product.isCovered ? 100 : 0,
      }))
  }

  private aggregate(
    facts: readonly AnalyticsSalesFact[],
    interval: AnalyticsInterval,
  ): SalesAggregate {
    const aggregate = this.createEmptyAggregate()
    for (const fact of facts) {
      if (fact.status === 'canceled' || !this.isInRange(fact.registeredAt, interval))
        continue

      aggregate.netSalesCents += fact.totalCents
      aggregate.validOrders += 1
      const coverage = this.aggregateProducts(aggregate, fact)
      this.aggregateCoverage(aggregate, coverage)
      this.aggregateChannel(aggregate, fact)
    }
    aggregate.averageTicketCents =
      aggregate.validOrders === 0
        ? null
        : Math.round(aggregate.netSalesCents / aggregate.validOrders)
    return aggregate
  }

  private aggregateProducts(
    aggregate: SalesAggregate,
    fact: AnalyticsSalesFact,
  ): { coveredNetSalesCents: number; uncoveredNetSalesCents: number; cogsCents: number } {
    let coveredNetSalesCents = 0
    let uncoveredNetSalesCents = 0
    let cogsCents = 0
    for (const line of fact.lines) {
      const product = aggregate.products.get(line.productSnapshotId) ?? {
        productSnapshotId: line.productSnapshotId,
        name: line.productName,
        currentProductId: line.currentProductId,
        netSalesCents: 0,
        quantity: 0,
        cogsCents: 0,
        isCovered: true,
      }
      product.netSalesCents += line.allocatedNetSalesCents
      product.quantity += line.quantity
      if (line.cogsCents === null) {
        product.isCovered = false
        aggregate.affectedProducts.set(line.productSnapshotId, {
          name: line.productName,
          currentProductId: line.currentProductId,
        })
      } else {
        product.cogsCents += line.cogsCents
        cogsCents += line.cogsCents
        coveredNetSalesCents += line.allocatedNetSalesCents
      }
      if (line.cogsCents === null) uncoveredNetSalesCents += line.allocatedNetSalesCents
      aggregate.products.set(line.productSnapshotId, product)
    }
    return { coveredNetSalesCents, uncoveredNetSalesCents, cogsCents }
  }

  private aggregateCoverage(
    aggregate: SalesAggregate,
    coverage: {
      coveredNetSalesCents: number
      uncoveredNetSalesCents: number
      cogsCents: number
    },
  ): void {
    aggregate.coveredNetSalesCents += coverage.coveredNetSalesCents
    aggregate.uncoveredNetSalesCents += coverage.uncoveredNetSalesCents
    aggregate.cogsCents += coverage.cogsCents
  }

  private aggregateChannel(aggregate: SalesAggregate, fact: AnalyticsSalesFact): void {
    const key = `${fact.channel.snapshotId ?? 'none'}:${fact.channel.name}`
    const channel = aggregate.channels.get(key) ?? {
      snapshotId: fact.channel.snapshotId,
      name: fact.channel.name,
      currentId: fact.channel.currentId,
      netSalesCents: 0,
      validOrders: 0,
    }
    channel.netSalesCents += fact.totalCents
    channel.validOrders += 1
    aggregate.channels.set(key, channel)
  }

  private createEmptyAggregate(): SalesAggregate {
    return {
      netSalesCents: 0,
      validOrders: 0,
      averageTicketCents: null,
      coveredNetSalesCents: 0,
      cogsCents: 0,
      uncoveredNetSalesCents: 0,
      affectedProducts: new Map(),
      products: new Map(),
      channels: new Map(),
    }
  }

  private buildEvolution(
    facts: readonly AnalyticsSalesFact[],
    period: AnalyticsPeriod,
    interval: AnalyticsInterval,
  ): SalesAnalytics['evolution'] {
    return this.buildEvolutionBuckets(period, interval).map((bucket) => {
      const matchingFacts = facts.filter(
        (fact) => fact.status !== 'canceled' && this.isInRange(fact.registeredAt, bucket),
      )
      return {
        ...bucket,
        netSalesCents: matchingFacts.reduce((sum, fact) => sum + fact.totalCents, 0),
        validOrders: matchingFacts.length,
      }
    })
  }

  private buildEvolutionBuckets(
    period: AnalyticsPeriod,
    interval: AnalyticsInterval,
  ): EvolutionBucket[] {
    if (period === 'today') return this.buildHourlyBuckets(interval)
    if (PERIOD_DAYS[period] < 90) return this.buildDailyBuckets(interval)
    return this.buildWeeklyBuckets(interval)
  }

  private buildHourlyBuckets(interval: AnalyticsInterval): EvolutionBucket[] {
    return Array.from({ length: 24 }, (_, hour) => ({
      key: `${interval.localStartDate}T${this.pad(hour)}`,
      startAt: this.getLocalStart(interval.localStartDate, interval.timeZone, hour),
      endAt:
        hour === 23
          ? interval.endAt
          : this.getLocalStart(interval.localStartDate, interval.timeZone, hour + 1),
      label: `${this.pad(hour)}h`,
    }))
  }

  private buildDailyBuckets(interval: AnalyticsInterval): EvolutionBucket[] {
    const buckets: EvolutionBucket[] = []
    for (
      let date = interval.localStartDate;
      date < this.addDays(interval.localEndDate, 1);
      date = this.addDays(date, 1)
    ) {
      buckets.push({
        key: date,
        startAt: this.getLocalStart(date, interval.timeZone),
        endAt: this.getLocalStart(this.addDays(date, 1), interval.timeZone),
        label: this.formatCalendarLabel(date),
      })
    }
    return buckets
  }

  private buildWeeklyBuckets(interval: AnalyticsInterval): EvolutionBucket[] {
    const buckets: EvolutionBucket[] = []
    const intervalEnd = this.addDays(interval.localEndDate, 1)
    let date = this.addDays(
      interval.localStartDate,
      -((this.getDayOfWeek(interval.localStartDate) + 6) % 7),
    )
    while (date < intervalEnd) {
      const next = this.addDays(date, 7)
      buckets.push({
        key: date,
        startAt: this.getLocalStart(
          date < interval.localStartDate ? interval.localStartDate : date,
          interval.timeZone,
        ),
        endAt: this.getLocalStart(
          next > intervalEnd ? intervalEnd : next,
          interval.timeZone,
        ),
        label: this.formatCalendarLabel(date),
      })
      date = next
    }
    return buckets
  }

  private buildIntervals(
    now: Date,
    period: AnalyticsPeriod,
    timeZone: string,
  ): IntervalPair {
    const days = PERIOD_DAYS[period]
    const today = this.formatDate(this.getPartsAt(now, timeZone))
    const selectedStart = this.addDays(today, 1 - days)
    const selectedEnd = this.addDays(today, 1)
    const comparisonStart = this.addDays(selectedStart, -days)
    return {
      selected: this.createInterval(selectedStart, selectedEnd, timeZone),
      comparison: this.createInterval(comparisonStart, selectedStart, timeZone),
    }
  }

  private createInterval(
    startDate: string,
    endDate: string,
    timeZone: string,
  ): AnalyticsInterval {
    return {
      timeZone,
      localStartDate: startDate,
      localEndDate: this.addDays(endDate, -1),
      startAt: this.getLocalStart(startDate, timeZone),
      endAt: this.getLocalStart(endDate, timeZone),
    }
  }

  private isInRange(
    instant: Date,
    range: Pick<AnalyticsInterval, 'startAt' | 'endAt'>,
  ): boolean {
    return instant >= range.startAt && instant < range.endAt
  }

  private calculateDelta(selected: number | null, comparison: number | null) {
    const selectedValue = selected ?? 0
    const comparisonValue = comparison ?? 0
    const absolute = selectedValue - comparisonValue
    return {
      absolute,
      percentage: this.calculatePercentage(absolute, comparisonValue),
    }
  }

  private calculatePercentage(value: number, base: number): number | null {
    return base === 0 ? null : (value / base) * 100
  }

  private addDays(date: string, days: number): string {
    const parts = this.parseDate(date)
    const instant = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days))
    return this.formatDate({
      year: instant.getUTCFullYear(),
      month: instant.getUTCMonth() + 1,
      day: instant.getUTCDate(),
    })
  }

  private getDayOfWeek(date: string): number {
    const parts = this.parseDate(date)
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
  }

  private getLocalStart(date: string, timeZone: string, hour = 0): Date {
    const parts = this.parseDate(date)
    const guess = Date.UTC(parts.year, parts.month - 1, parts.day, hour)
    const local = this.getPartsAt(new Date(guess), timeZone)
    const actualLocalAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour)
    return new Date(guess - (actualLocalAsUtc - guess))
  }

  private getPartsAt(instant: Date, timeZone: string): DateParts {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instant)
    const getValue = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value)
    return {
      year: getValue('year'),
      month: getValue('month'),
      day: getValue('day'),
      hour: getValue('hour'),
    }
  }

  private parseDate(date: string): CalendarDateParts {
    const [year, month, day] = date.split('-').map(Number)
    return { year, month, day }
  }

  private formatDate(parts: CalendarDateParts): string {
    return `${parts.year}-${this.pad(parts.month)}-${this.pad(parts.day)}`
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0')
  }

  private formatCalendarLabel(date: string): string {
    return `${date.slice(8)}/${date.slice(5, 7)}`
  }
}
