import { Icon } from '@/ui/shared/widgets/components/icon'

import { COMPACT_PREVIEW_VIEWS } from './views'

export type CompactPreviewProps = {
  kind: 'sales' | 'production' | 'results'
  activeIndex: number
}

export const CompactPreview = ({ kind, activeIndex }: CompactPreviewProps) => {
  const view = COMPACT_PREVIEW_VIEWS[kind][activeIndex] ?? COMPACT_PREVIEW_VIEWS[kind][0]

  return (
    <div className='w-full overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3'>
        <span className='flex items-center gap-1 text-base font-extrabold italic text-primary'>
          <Icon name='ice-cream-cone' className='size-5' />
          Scoops
        </span>
        <span className='text-xs font-medium text-muted-foreground'>
          Dados ilustrativos
        </span>
      </div>
      <div className='p-4'>
        <h3 className='text-lg font-extrabold leading-tight tracking-tight'>
          {view.title}
        </h3>
        <p className='mt-1 text-xs text-muted-foreground'>{view.subtitle}</p>
        <div className='mt-4 rounded-xl bg-muted p-4'>
          <p className='text-xs font-medium text-muted-foreground'>{view.label}</p>
          <p className='mt-1 text-2xl font-extrabold tracking-tight tabular-nums'>
            {view.value}
          </p>
        </div>
        <dl className='mt-3 divide-y divide-border'>
          {view.rows.map((row) => (
            <div
              key={row.label}
              className='flex flex-wrap items-baseline justify-between gap-1 py-3 text-sm'
            >
              <dt className='font-bold'>{row.label}</dt>
              <dd className='font-extrabold tabular-nums'>{row.value}</dd>
              <dd className='basis-full text-xs leading-relaxed text-muted-foreground'>
                {row.detail}
              </dd>
            </div>
          ))}
        </dl>
        <p className='mt-2 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground'>
          {view.note}
        </p>
      </div>
    </div>
  )
}
