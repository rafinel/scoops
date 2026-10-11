import { Icon } from '@/ui/shared/widgets/components/icon'

import { PreviewMetric } from '../metric'
import { PRODUCTION_PREVIEW_VIEWS } from './views'

export type ProductionPreviewProps = { activeIndex: number }

export const ProductionPreview = ({ activeIndex }: ProductionPreviewProps) => {
  const view = PRODUCTION_PREVIEW_VIEWS[activeIndex] ?? PRODUCTION_PREVIEW_VIEWS[0]

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <div>
          <p className='text-xs text-muted-foreground'>Produtos / Açaí</p>
          <h3 className='mt-1 text-2xl font-extrabold tracking-tight'>{view.title}</h3>
        </div>
        <span className='rounded-lg bg-primary-soft px-3 py-2 text-xs font-bold text-primary'>
          Produzível
        </span>
      </div>
      <div className='mb-4 grid grid-cols-3 gap-3'>
        {view.metrics.map((metric) => (
          <PreviewMetric key={metric.label} {...metric} />
        ))}
      </div>
      <div className='overflow-hidden rounded-2xl border border-border bg-card'>
        <div className='flex items-center justify-between border-b border-border px-5 py-4'>
          <p className='text-sm font-extrabold'>{view.rowsTitle}</p>
          <span className='text-xs text-muted-foreground'>{view.rowsDetail}</span>
        </div>
        <div className='grid grid-cols-3 bg-muted px-5 py-3 text-xs font-semibold text-muted-foreground'>
          <span>Ingrediente</span>
          <span>{view.quantityLabel}</span>
          <span className='text-right'>{view.resultLabel}</span>
        </div>
        <ul className='divide-y divide-border'>
          {view.rows.map((row) => (
            <li
              key={row.name}
              className={`grid grid-cols-3 items-center px-5 py-4 text-sm ${row.className ?? ''}`}
            >
              <span className='font-bold'>{row.name}</span>
              <span className='tabular-nums text-muted-foreground'>{row.quantity}</span>
              <span className='text-right font-bold tabular-nums'>{row.result}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon name={view.icon} className='size-4 text-primary' />
        {view.note}
      </p>
    </div>
  )
}
