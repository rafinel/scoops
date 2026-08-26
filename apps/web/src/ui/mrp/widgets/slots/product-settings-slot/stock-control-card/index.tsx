import type { Product } from '@scoops/core/mrp/domain/entities'

import { Icon } from '@/ui/shared/widgets/components/icon'

import { useStockControlCard } from './use-stock-control-card'

export type StockControlCardProps = { product: Product }

export const StockControlCard = ({ product }: StockControlCardProps) => {
  const {
    allowNegativeStock,
    error,
    handleAllowNegativeStockChange,
    handleRetry,
    handleRevert,
    isPending,
  } = useStockControlCard(product)
  const stockControlLabel = product.stockControl === 'by-brand' ? 'Por marca' : 'Único'

  return (
    <section
      aria-labelledby='stock-control-title'
      className='rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'
    >
      <div className='flex items-start gap-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-info/10 text-info'>
          <Icon name='layers' />
        </span>
        <div>
          <h2 className='text-lg font-extrabold' id='stock-control-title'>
            Controle de estoque
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Defina como o saldo deste produto é controlado.
          </p>
        </div>
      </div>
      <div className='mt-5 grid gap-3 sm:grid-cols-2'>
        <div className='rounded-xl border border-border-soft bg-muted/30 p-4'>
          <p className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
            Modo atual
          </p>
          <p className='mt-1 font-extrabold'>{stockControlLabel}</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Configurado no cadastro de marcas.
          </p>
        </div>
        <label className='flex cursor-pointer items-center gap-3 rounded-xl border border-border-soft p-4 text-sm font-bold'>
          <input
            aria-label='Permitir estoque negativo'
            checked={allowNegativeStock}
            className='peer sr-only'
            disabled={isPending}
            onChange={(event) =>
              void handleAllowNegativeStockChange(event.target.checked)
            }
            type='checkbox'
          />
          <span className='relative h-6 w-11 shrink-0 rounded-full bg-border transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none' />
          <span>Permitir estoque negativo</span>
        </label>
      </div>
      {error ? (
        <div className='mt-3 grid gap-2 text-sm font-semibold text-danger' role='alert'>
          <p>{error}</p>
          <div className='flex flex-wrap gap-3'>
            <button
              className='w-fit text-xs underline-offset-2 hover:underline'
              onClick={handleRetry}
              type='button'
            >
              Tentar novamente
            </button>
            <button
              className='w-fit text-xs text-muted-foreground underline-offset-2 hover:underline'
              onClick={handleRevert}
              type='button'
            >
              Reverter
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
