import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { useState } from 'react'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  )

export const ProductPerformance = ({ analytics }: { analytics: SalesAnalytics }) => {
  const [mode, setMode] = useState<'net-sales' | 'quantity'>('net-sales')
  const products =
    mode === 'net-sales' ? analytics.products.byNetSales : analytics.products.byQuantity

  return (
    <section aria-labelledby='product-performance-heading'>
      <div className='flex flex-col items-start gap-3 sm:flex-row sm:justify-between'>
        <div>
          <h2 id='product-performance-heading' className='text-lg font-extrabold'>
            Mais vendidos por {mode === 'net-sales' ? 'valor' : 'quantidade'}
          </h2>
          <p className='mt-1 text-xs text-muted-foreground'>
            Ordenados por desempenho no período
          </p>
        </div>
        <div className='flex shrink-0 rounded-lg border bg-muted p-1 text-xs font-bold'>
          {(['net-sales', 'quantity'] as const).map((value) => (
            <button
              key={value}
              type='button'
              aria-pressed={mode === value}
              className='whitespace-nowrap rounded-md px-3 py-1.5 aria-pressed:bg-card aria-pressed:text-primary aria-pressed:shadow-tab'
              onClick={() => setMode(value)}
            >
              {value === 'net-sales' ? 'Valor' : 'Qtd.'}
            </button>
          ))}
        </div>
      </div>
      {products.length === 0 ? (
        <p className='mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground'>
          Nenhuma venda neste período.
        </p>
      ) : (
        <ol className='mt-4 divide-y'>
          {products.map((product, index) => (
            <li
              key={product.productSnapshotId}
              className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'
            >
              <span className='grid size-6 shrink-0 place-items-center rounded-md bg-accent text-xs font-bold text-primary'>
                {index + 1}
              </span>
              <div className='min-w-0 flex-1'>
                {product.currentProductId ? (
                  <Anchor
                    route='productDetails'
                    params={{ productId: product.currentProductId }}
                    className='block truncate text-sm font-bold hover:text-primary'
                  >
                    {product.name}
                  </Anchor>
                ) : (
                  <span className='block truncate text-sm font-bold'>{product.name}</span>
                )}
                <p className='text-xs text-muted-foreground'>
                  {product.quantity} unidades ·{' '}
                  {product.marginPercentage === null
                    ? `Cobertura ${product.coveragePercentage.toFixed(0)}% · margem indisponível`
                    : `margem ${product.marginPercentage.toFixed(0)}%`}
                </p>
              </div>
              <strong className='shrink-0 text-sm'>
                <span className='block text-right'>
                  {mode === 'net-sales'
                    ? formatCurrency(product.netSalesCents)
                    : product.quantity}
                </span>
                <span className='block text-right text-[11px] font-medium text-muted-foreground'>
                  {mode === 'net-sales'
                    ? `${product.quantity} un.`
                    : formatCurrency(product.netSalesCents)}
                </span>
              </strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
