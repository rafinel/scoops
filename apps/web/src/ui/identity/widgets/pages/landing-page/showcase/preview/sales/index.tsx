import { Icon } from '@/ui/shared/widgets/components/icon'

export type SalesPreviewProps = { activeIndex: number }

const ORDERS = [
  { id: '#1048', description: 'Açaí 300 ml + água', time: '15:42', total: 'R$ 22,00' },
  { id: '#1047', description: '2 sorvetes 200 ml', time: '15:36', total: 'R$ 28,00' },
  { id: '#1046', description: 'Açaí 500 ml', time: '15:28', total: 'R$ 26,00' },
]

export const SalesPreview = ({ activeIndex }: SalesPreviewProps) => (
  <div>
    <div className='mb-5 flex items-center justify-between'>
      <div>
        <p className='text-xs text-muted-foreground'>Vendas / Balcão</p>
        <h3 className='mt-1 text-2xl font-extrabold tracking-tight'>
          {activeIndex === 2 ? 'Pedidos registrados' : 'Nova venda'}
        </h3>
      </div>
      <span className='flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold'>
        <Icon name='store' className='size-4 text-primary' />
        Balcão
      </span>
    </div>
    {activeIndex === 2 ? (
      <div className='rounded-2xl border border-border bg-card p-5'>
        <div className='mb-4 flex items-center justify-between'>
          <p className='font-bold'>Histórico de pedidos</p>
          <span className='text-xs text-muted-foreground'>Hoje</span>
        </div>
        <ul className='divide-y divide-border'>
          {ORDERS.map((order) => (
            <li key={order.id} className='flex items-center gap-4 py-5'>
              <span className='rounded-xl bg-primary-soft p-3 text-primary'>
                <Icon name='shopping-bag' className='size-5' />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-bold'>
                  {order.id}{' '}
                  <span className='ml-2 font-normal text-muted-foreground'>
                    {order.time}
                  </span>
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>{order.description}</p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-extrabold tabular-nums'>{order.total}</p>
                <p className='mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground'>
                  <Icon name='check' className='size-3' /> Registrado
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className='mt-3 text-xs text-muted-foreground'>
          Itens, preços e descontos preservados no pedido.
        </p>
      </div>
    ) : (
      <div className='grid grid-cols-2 gap-4'>
        <div className='rounded-2xl border border-border bg-card p-5'>
          <div className='mb-4 flex items-center gap-3'>
            <span className='rounded-xl bg-primary-soft p-3 text-primary'>
              <Icon name='ice-cream-bowl' className='size-6' />
            </span>
            <div>
              <p className='font-extrabold'>Açaí</p>
              <p className='text-xs text-muted-foreground'>Porção</p>
            </div>
          </div>
          <p className='mb-2 text-xs font-bold text-muted-foreground'>Tamanho</p>
          <div className='mb-5 grid grid-cols-3 gap-2 text-center text-xs font-bold'>
            <span className='rounded-lg border border-border py-3'>200 ml</span>
            <span className='rounded-lg border border-primary bg-primary-soft py-3 text-primary'>
              300 ml
            </span>
            <span className='rounded-lg border border-border py-3'>500 ml</span>
          </div>
          <p className='mb-2 text-xs font-bold text-muted-foreground'>Acompanhamentos</p>
          <div className='space-y-2'>
            {['Granola', 'Leite em pó'].map((name) => (
              <div
                key={name}
                className='flex items-center justify-between rounded-lg bg-muted p-3 text-xs font-semibold'
              >
                {name}
                <Icon name='circle-check' className='size-4 text-primary' />
              </div>
            ))}
          </div>
          <div className='mt-5 flex items-end justify-between'>
            <span className='text-xs text-muted-foreground'>Preço da porção</span>
            <span className='text-xl font-extrabold'>R$ 20,00</span>
          </div>
        </div>
        <div className='rounded-2xl border border-border bg-card p-5'>
          <div className='mb-5 flex items-center justify-between'>
            <p className='font-extrabold'>Pedido</p>
            <Icon name='shopping-cart' className='size-5 text-muted-foreground' />
          </div>
          <div className='flex items-start justify-between border-b border-border pb-4 text-sm'>
            <div>
              <p className='font-bold'>1 × Açaí 300 ml</p>
              <p className='mt-1 text-xs text-muted-foreground'>Granola, leite em pó</p>
            </div>
            <span className='font-bold'>R$ 20,00</span>
          </div>
          {activeIndex === 1 && (
            <>
              <div className='flex justify-between py-4 text-sm'>
                <span className='font-bold'>1 × Água 500 ml</span>
                <span className='font-bold'>R$ 5,00</span>
              </div>
              <div className='rounded-xl bg-primary-soft p-3 text-primary'>
                <p className='flex items-center gap-2 text-xs font-extrabold'>
                  <Icon name='tags' className='size-4' />
                  Combo açaí + água
                </p>
                <p className='mt-1 text-xs'>Economia aplicada: R$ 3,00</p>
              </div>
            </>
          )}
          <dl className='mt-5 space-y-3 text-xs'>
            <div className='flex justify-between text-muted-foreground'>
              <dt>Subtotal</dt>
              <dd>{activeIndex === 1 ? 'R$ 25,00' : 'R$ 20,00'}</dd>
            </div>
            {activeIndex === 1 && (
              <div className='flex justify-between text-muted-foreground'>
                <dt>Desconto do combo</dt>
                <dd>− R$ 3,00</dd>
              </div>
            )}
            <div className='flex items-center justify-between border-t border-border pt-4'>
              <dt className='font-bold'>Total</dt>
              <dd className='text-2xl font-extrabold'>
                {activeIndex === 1 ? 'R$ 22,00' : 'R$ 20,00'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    )}
  </div>
)
