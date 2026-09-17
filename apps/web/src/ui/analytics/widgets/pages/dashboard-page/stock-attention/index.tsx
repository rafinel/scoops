import type { StockAttention } from '@scoops/core/analytics/domain/structures'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

export const StockAttentionWidget = ({ stock }: { stock: StockAttention }) => (
  <section
    aria-labelledby='stock-attention-heading'
    className='rounded-xl border bg-card p-5 shadow-card'
  >
    <h2 id='stock-attention-heading' className='text-lg font-extrabold'>
      Estoque agora
    </h2>
    <p className='mt-1 text-xs text-muted-foreground'>
      {stock.items.length
        ? `${stock.items.length} itens pedem sua atenção`
        : 'Nenhum item precisa de atenção'}
    </p>
    {stock.items.length === 0 ? (
      <p className='mt-4 text-sm text-muted-foreground'>Estoque saudável no momento.</p>
    ) : (
      <ul className='mt-5 divide-y'>
        {stock.items.map((item) => (
          <li
            key={item.productId}
            className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-lg ${item.kind === 'zero-stock' ? 'bg-danger-soft text-danger' : item.kind === 'limited-production' ? 'bg-info-soft text-info' : 'bg-warning-soft text-warning'}`}
            >
              <Icon
                name={
                  item.kind === 'zero-stock'
                    ? 'triangle-alert'
                    : item.kind === 'limited-production'
                      ? 'chef-hat'
                      : 'triangle-alert'
                }
                className='size-4'
              />
            </span>
            <div className='min-w-0 flex-1'>
              <Anchor
                route={
                  item.destination === 'recipe'
                    ? 'productDetailsRecipe'
                    : 'productDetailsStock'
                }
                params={{ productId: item.productId }}
                className='block truncate text-sm font-bold hover:text-primary'
              >
                {item.productName}
              </Anchor>
              <p
                className={`text-xs ${item.kind === 'zero-stock' ? 'text-danger' : item.kind === 'limited-production' ? 'text-info' : 'text-warning'}`}
              >
                {item.kind === 'zero-stock'
                  ? 'Estoque zerado'
                  : item.kind === 'below-ideal'
                    ? `${item.availableQuantity} disponível · ideal ${item.idealQuantity ?? '—'}`
                    : `Produz até ${item.maximumProducibleQuantity ?? 0} porções`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
)
