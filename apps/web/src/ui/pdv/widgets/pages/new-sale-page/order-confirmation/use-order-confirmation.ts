import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'

import type { OrderConfirmationProps } from '.'

export type OrderConfirmationLineView = {
  name: string
  details: string
  accompaniments?: readonly string[]
  subtotal: string
}
export type OrderConfirmationMetadataItem = readonly [label: string, value: string]
type ConfirmationFormatters = {
  currency: ReturnType<typeof useFormatCurrency>
  date: ReturnType<typeof useFormatDate>
  quantity: ReturnType<typeof useFormatQuantity>
}
const DATE_OPTIONS = { dateStyle: 'medium', timeStyle: 'short' } as const

export function useOrderConfirmation({ order, onNewSale }: OrderConfirmationProps) {
  const currency = useFormatCurrency()
  const date = useFormatDate()
  const quantity = useFormatQuantity()
  return getConfirmationDisplay(order, onNewSale, { currency, date, quantity })
}

function getConfirmationDisplay(
  order: OrderDetails,
  onNewSale: () => void,
  formatters: ConfirmationFormatters,
) {
  const sequence = String(order.sequenceNumber).padStart(4, '0')
  const total = formatters.currency(order.total)
  const metadata = getMetadata(order, formatters)
  const lines = getConfirmationLines(order, formatters)
  const baseSubtotalCents = order.lines.reduce(
    (sum, line) => sum + Math.round(line.baseUnitPrice * 100) * line.quantity,
    0,
  )
  const adjustedSubtotalCents = order.lines.reduce(
    (sum, line) => sum + Math.round(line.subtotal * 100),
    0,
  )
  const adjustment = (adjustedSubtotalCents - baseSubtotalCents) / 100
  const breakdown: OrderConfirmationMetadataItem[] = [
    ['Subtotal', formatters.currency(baseSubtotalCents / 100)],
    ...(order.channel
      ? [
          [
            getChannelLabel(order),
            `${adjustment > 0 ? '+ ' : adjustment < 0 ? '− ' : ''}${formatters.currency(Math.abs(adjustment))}`,
          ] as const,
        ]
      : []),
    ...order.discounts.map(
      (item) => [item.discount.name, `− ${formatters.currency(item.savings)}`] as const,
    ),
  ]
  return { sequence, metadata, lines, total, breakdown, handleNewSale: onNewSale }
}

function getMetadata(
  order: OrderDetails,
  formatters: ConfirmationFormatters,
): readonly OrderConfirmationMetadataItem[] {
  return [
    ['Data e hora', formatters.date(order.createdAt, DATE_OPTIONS)],
    ['Canal de venda', getChannelLabel(order)],
    ['Quantidade', formatters.quantity(getUnitsCount(order), 'itens')],
  ]
}

function getUnitsCount(order: OrderDetails) {
  return order.lines.reduce(function sumUnits(count, line) {
    return count + line.quantity
  }, 0)
}

function getChannelLabel(order: OrderDetails) {
  return order.channel
    ? `${order.channel.name} · ${order.channel.percentage > 0 ? '+' : ''}${order.channel.percentage}%`
    : 'Sem canal'
}

function getConfirmationLines(order: OrderDetails, formatters: ConfirmationFormatters) {
  return order.lines.map(function projectLine(line) {
    return getLineDisplay(line, formatters)
  })
}

function getLineDisplay(
  line: OrderDetails['lines'][number],
  formatters: ConfirmationFormatters,
): OrderConfirmationLineView {
  return {
    name: line.product.name,
    details: getLineDetails(line, formatters.quantity),
    ...getLineAccompaniments(line, formatters.currency),
    subtotal: formatters.currency(
      (Math.round(line.baseUnitPrice * 100) * line.quantity) / 100,
    ),
  }
}

function getLineDetails(
  line: OrderDetails['lines'][number],
  formatQuantity: ConfirmationFormatters['quantity'],
): string {
  const unitName = line.size?.name ?? line.brand?.name ?? 'Unidade'
  return `${unitName} · ${formatQuantity(line.quantity, 'un.')}`
}

function getLineAccompaniments(
  line: OrderDetails['lines'][number],
  currency: ConfirmationFormatters['currency'],
): Partial<Pick<OrderConfirmationLineView, 'accompaniments'>> {
  if (line.accompaniments.length === 0) return {}
  return {
    accompaniments: line.accompaniments.map(
      (accompaniment) =>
        `${accompaniment.name} · ${accompaniment.basePrice > 0 ? '+ ' : ''}${currency(accompaniment.basePrice)}`,
    ),
  }
}
