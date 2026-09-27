import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { Button, buttonVariants } from '@/ui/shadcn/button'
import { Card } from '@/ui/shadcn/card'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'

export type OrderConfirmationProps = {
  order: OrderDetails
  onNewSale: () => void
}
export const OrderConfirmation = ({ order, onNewSale }: OrderConfirmationProps) => {
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()

  return (
    <section
      aria-labelledby='order-confirmation-title'
      className='mx-auto w-full max-w-3xl py-8 sm:py-12'
    >
      <div className='text-center'>
        <span className='mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success'>
          <Icon name='circle-check' className='size-9' />
        </span>
        <h1
          className='mt-5 text-3xl font-black tracking-tight'
          id='order-confirmation-title'
        >
          Pedido registrado
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          A venda foi concluída e já está disponível no histórico de pedidos.
        </p>
      </div>

      <Card className='mt-8 rounded-2xl shadow-card'>
        <div className='border-b border-border-soft p-5 sm:p-6'>
          <p className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
            Pedido
          </p>
          <p className='mt-1 text-2xl font-black'>
            #{String(order.sequenceNumber).padStart(4, '0')}
          </p>
        </div>
        <OrderMetadata order={order} formatDate={formatDate} />
        <div className='p-5 sm:p-6'>
          <h2 className='font-extrabold'>Itens do pedido</h2>
          <OrderLineItems order={order} formatCurrency={formatCurrency} />
          <div className='mt-3 flex items-center justify-between gap-4 border-t border-border-soft pt-4'>
            <span className='font-extrabold'>Total do pedido</span>
            <strong className='text-2xl font-black'>{formatCurrency(order.total)}</strong>
          </div>
        </div>
      </Card>
      <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
        <Anchor
          className={buttonVariants({ variant: 'outline' })}
          params={{ orderId: order.id }}
          route='orderDetails'
        >
          <Icon name='clipboard-list' /> Ver pedido
        </Anchor>
        <Button onClick={onNewSale} type='button'>
          <Icon name='plus' /> Iniciar nova venda
        </Button>
      </div>
      <p className='mt-4 text-center text-xs text-muted-foreground'>
        Este pedido também pode ser consultado em Pedidos.
      </p>
    </section>
  )
}

type OrderMetadataItem = readonly [label: string, value: string]

const ORDER_METADATA_LABELS = {
  date: 'Data e hora',
  channel: 'Canal de venda',
  quantity: 'Quantidade',
}
const ORDER_DATE_FORMAT_OPTIONS = { dateStyle: 'medium', timeStyle: 'short' } as const
const ORDER_METADATA_CLASS =
  'grid gap-4 border-b border-border-soft bg-muted/45 p-5 sm:grid-cols-3 sm:p-6'
const ORDER_METADATA_LABEL_CLASS = 'text-xs text-muted-foreground'
const ORDER_METADATA_VALUE_CLASS = 'mt-1 text-sm font-bold'
const ORDER_LINES_CLASS = 'mt-3 divide-y divide-border-soft'
const ORDER_LINE_CLASS = 'flex items-center justify-between gap-4 py-3 text-sm'
const ORDER_LINE_NAME_CLASS = 'truncate font-bold'
const ORDER_LINE_DETAILS_CLASS = 'truncate text-xs text-muted-foreground'
function getOrderChannelLabel(order: OrderDetails) {
  return order.channel
    ? `${order.channel.name} · ${order.channel.percentage > 0 ? '+' : ''}${order.channel.percentage}%`
    : 'Sem canal'
}

function getOrderQuantityLabel(order: OrderDetails) {
  return `${order.lines.reduce((total, line) => total + line.quantity, 0)} itens`
}

function getOrderMetadataItems(
  order: OrderDetails,
  formatDate: ReturnType<typeof useFormatDate>,
): OrderMetadataItem[] {
  return [
    [ORDER_METADATA_LABELS.date, formatDate(order.createdAt, ORDER_DATE_FORMAT_OPTIONS)],
    [ORDER_METADATA_LABELS.channel, getOrderChannelLabel(order)],
    [ORDER_METADATA_LABELS.quantity, getOrderQuantityLabel(order)],
  ]
}

const OrderMetadata = ({
  order,
  formatDate,
}: {
  order: OrderDetails
  formatDate: ReturnType<typeof useFormatDate>
}) => (
  <dl className={ORDER_METADATA_CLASS}>
    {getOrderMetadataItems(order, formatDate).map(([label, value]) => (
      <div key={label}>
        <dt className={ORDER_METADATA_LABEL_CLASS}>{label}</dt>
        <dd className={ORDER_METADATA_VALUE_CLASS}>{value}</dd>
      </div>
    ))}
  </dl>
)

const OrderLineItems = ({
  order,
  formatCurrency,
}: {
  order: OrderDetails
  formatCurrency: ReturnType<typeof useFormatCurrency>
}) => (
  <div className={ORDER_LINES_CLASS}>
    {order.lines.map((line) => (
      <div className={ORDER_LINE_CLASS} key={line.product.productId}>
        <div className='min-w-0'>
          <p className={ORDER_LINE_NAME_CLASS}>{line.product.name}</p>
          <p className={ORDER_LINE_DETAILS_CLASS}>
            {line.size?.name ?? line.brand?.name ?? 'Unidade'} · {line.quantity} un.
          </p>
        </div>
        <strong className='shrink-0'>{formatCurrency(line.subtotal)}</strong>
      </div>
    ))}
  </div>
)
