import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { CATEGORY_ICONS } from '@/constants'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { cn } from '@/ui/shared/lib/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderItemsProps = { order: OrderDetails }

export const OrderItems = ({ order }: OrderItemsProps) => {
  const formatCurrency = useFormatCurrency()

  return (
    <section
      className='overflow-hidden rounded-2xl border border-border bg-card shadow-card'
      aria-labelledby='order-items-title'
    >
      <header className='border-b border-border-soft px-5 py-5 sm:px-6'>
        <h2 className='text-lg font-extrabold' id='order-items-title'>
          Itens do pedido
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Configuração e valores preservados no momento da venda.
        </p>
      </header>
      <div
        className='hidden border-b border-border-soft bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_80px_100px_100px] sm:gap-4 sm:px-6'
        data-slot='order-items-header'
      >
        <span>Produto</span>
        <span className='text-right'>Qtd.</span>
        <span className='text-right'>Unitário</span>
        <span className='text-right'>Total</span>
      </div>
      <div className='divide-y divide-border-soft'>
        {order.lines.map((line) => {
          const configuration = [
            line.size?.name,
            line.brand?.name,
            line.accompaniments.map((accompaniment) => accompaniment.name).join(' · '),
          ]
            .filter(Boolean)
            .join(' · ')
          const channelAdjustment = line.finalUnitPrice - line.baseUnitPrice

          return (
            <article
              className='grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_80px_100px_100px] sm:items-center sm:px-6'
              data-slot='order-item-row'
              key={`${line.product.productId}-${line.size?.sizeId ?? 'default'}-${line.brand?.brandId ?? 'no-brand'}-${line.baseUnitPrice}`}
            >
              <div className='flex min-w-0 items-start gap-3'>
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-xl',
                    line.product.kind === 'portion'
                      ? 'bg-accent text-primary'
                      : 'bg-info-soft text-info',
                  )}
                >
                  <Icon className='size-5' name={CATEGORY_ICONS[line.product.kind]} />
                </span>
                <div className='min-w-0'>
                  <h3 className='font-extrabold'>{line.product.name}</h3>
                  <p className='mt-1 truncate text-xs text-muted-foreground'>
                    {configuration || 'Configuração padrão'}
                  </p>
                  {order.channel ? (
                    <p className='mt-1 truncate text-xs text-primary'>
                      {order.channel.name}
                      {channelAdjustment !== 0
                        ? ` · ${channelAdjustment > 0 ? 'acréscimo' : 'desconto'} de ${formatCurrency(Math.abs(channelAdjustment))}`
                        : ''}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className='sm:text-right'>
                <span className='text-xs text-muted-foreground sm:sr-only'>
                  Quantidade{' '}
                </span>
                <span className='font-semibold'>{line.quantity}</span>
              </div>
              <div className='sm:text-right'>
                <span className='text-xs text-muted-foreground sm:sr-only'>
                  Unitário{' '}
                </span>
                <span className='font-semibold'>
                  {formatCurrency(line.finalUnitPrice)}
                </span>
              </div>
              <div className='sm:text-right'>
                <span className='text-xs text-muted-foreground sm:sr-only'>Total </span>
                <span className='font-extrabold'>{formatCurrency(line.subtotal)}</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
