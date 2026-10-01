import { OrderStatus, type OrderDetails } from '@scoops/core/pdv/domain/structures'

import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { useFormatDecimal } from '@/ui/shared/hooks/use-format-decimal'

export type OrderPrintLineView = {
  name: string
  configurations: readonly string[]
  quantity: string
  unitPrice: string
  subtotal: string
}

type PrintFormatters = {
  currency: ReturnType<typeof useFormatCurrency>
  date: ReturnType<typeof useFormatDate>
  quantity: ReturnType<typeof useFormatQuantity>
  decimal: ReturnType<typeof useFormatDecimal>
}
type SavedLine = OrderDetails['lines'][number]
type SavedDiscount = OrderDetails['discounts'][number]
const DATE_OPTIONS = { dateStyle: 'short', timeStyle: 'short' } as const

export function useOrderPrintDocument(order: OrderDetails) {
  const currency = useFormatCurrency()
  const date = useFormatDate()
  const quantity = useFormatQuantity()
  const decimal = useFormatDecimal()
  return getPrintDocument(order, { currency, date, quantity, decimal })
}

function getPrintDocument(order: OrderDetails, formatters: PrintFormatters) {
  return {
    ...getSnapshotDisplay(order, formatters),
    ...getFinancials(order, formatters.currency),
  }
}

function getSnapshotDisplay(order: OrderDetails, formatters: PrintFormatters) {
  return {
    ...getOrderIdentity(order, formatters),
    lines: getLines(order, formatters.currency, formatters.quantity),
    cancellation: getCancellation(order, formatters.date),
    count: getCount(order, formatters.quantity),
  }
}

function getOrderIdentity(order: OrderDetails, formatters: PrintFormatters) {
  return {
    sequence: getSequence(order.sequenceNumber),
    metadata: getMetadata(order, formatters.date, formatters.decimal),
  }
}

function getSequence(number: number) {
  return String(number).padStart(5, '0')
}

function getMetadata(
  order: OrderDetails,
  formatDate: PrintFormatters['date'],
  formatDecimal: PrintFormatters['decimal'],
) {
  return [
    ['Registrado em', formatDate(order.createdAt, DATE_OPTIONS)],
    ['Registrado por', order.createdByName],
    ['Canal', getChannelLabel(order, formatDecimal)],
    ['Status', order.status === OrderStatus.Canceled ? 'Cancelado' : 'Registrado'],
  ] as const
}

function getChannelLabel(order: OrderDetails, formatDecimal: PrintFormatters['decimal']) {
  if (!order.channel) return 'Sem canal'
  const { name, percentage } = order.channel
  return `${name} · ${percentage > 0 ? '+' : ''}${formatDecimal(percentage)}%`
}

function getLines(
  order: OrderDetails,
  currency: PrintFormatters['currency'],
  quantity: PrintFormatters['quantity'],
) {
  return order.lines.map(function projectLine(line) {
    return getLineDisplay(line, currency, quantity)
  })
}

function getLineDisplay(
  line: SavedLine,
  currency: PrintFormatters['currency'],
  quantity: PrintFormatters['quantity'],
): OrderPrintLineView {
  return {
    ...getLineIdentity(line),
    quantity: quantity(line.quantity, '').trim(),
    unitPrice: currency(line.finalUnitPrice),
    subtotal: currency(line.subtotal),
  }
}

function getLineIdentity(line: SavedLine) {
  return { name: line.product.name, configurations: getConfigurations(line) }
}

function getConfigurations(line: SavedLine) {
  const names = [line.size?.name, line.brand?.name, getAccompaniments(line)]
  return names.filter(function isPresent(value): value is string {
    return Boolean(value)
  })
}

function getAccompaniments(line: SavedLine) {
  return line.accompaniments
    .map(function accompanimentName(item) {
      return item.name
    })
    .join(', ')
}

function getCancellation(order: OrderDetails, formatDate: PrintFormatters['date']) {
  if (order.status !== OrderStatus.Canceled || !order.cancellation) return null
  return getCancellationDisplay(order.cancellation, formatDate)
}

function getCancellationDisplay(
  cancellation: NonNullable<OrderDetails['cancellation']>,
  formatDate: PrintFormatters['date'],
) {
  return {
    date: formatDate(cancellation.canceledAt, DATE_OPTIONS),
    actor: cancellation.canceledByName,
    reason: cancellation.reason,
  }
}

function getTotals(
  subtotal: string,
  discounts: readonly { name: string; savings: string }[],
  totalDiscount: string | null,
  total: string,
) {
  return [
    { label: 'Subtotal dos produtos', value: subtotal, isTotal: false },
    ...getDiscountRows(discounts),
    ...getTotalDiscountRows(totalDiscount),
    { label: 'Total do pedido', value: total, isTotal: true },
  ]
}

function getDiscountRows(discounts: readonly { name: string; savings: string }[]) {
  return discounts.map(function discountRow(discount) {
    return { label: discount.name, value: discount.savings, isTotal: false }
  })
}

function getTotalDiscountRows(totalDiscount: string | null) {
  return totalDiscount
    ? [{ label: 'Desconto total', value: totalDiscount, isTotal: false }]
    : []
}

function getCount(order: OrderDetails, quantity: PrintFormatters['quantity']) {
  const products = order.lines.length
  const units = getUnitsCount(order)
  return `${products} ${products === 1 ? 'produto' : 'produtos'} · ${quantity(units, units === 1 ? 'unidade' : 'unidades')}`
}

function getUnitsCount(order: OrderDetails) {
  return order.lines.reduce(function sumUnits(count, line) {
    return count + line.quantity
  }, 0)
}

type MoneyDisplay = { subtotal: string; totalDiscount: string | null; total: string }

function getFinancials(order: OrderDetails, currency: PrintFormatters['currency']) {
  const discounts = getDiscounts(order, currency)
  const money = getMoneyDisplay(order, currency)
  return { ...money, discounts, totals: getFinancialRows(money, discounts) }
}

function getMoneyDisplay(
  order: OrderDetails,
  currency: PrintFormatters['currency'],
): MoneyDisplay {
  return {
    subtotal: currency(order.subtotal),
    totalDiscount: getTotalDiscount(order, currency),
    total: currency(order.total),
  }
}

function getFinancialRows(
  money: MoneyDisplay,
  discounts: readonly { name: string; savings: string }[],
) {
  return getTotals(money.subtotal, discounts, money.totalDiscount, money.total)
}

function getDiscounts(order: OrderDetails, currency: PrintFormatters['currency']) {
  return order.discounts.map(function projectDiscount(item, index) {
    return getDiscount(item, index, currency)
  })
}

function getDiscount(
  item: SavedDiscount,
  index: number,
  currency: PrintFormatters['currency'],
) {
  return { key: index, name: item.discount.name, savings: `− ${currency(item.savings)}` }
}

function getTotalDiscount(order: OrderDetails, currency: PrintFormatters['currency']) {
  return order.totalDiscount > 0 ? `− ${currency(order.totalDiscount)}` : null
}
