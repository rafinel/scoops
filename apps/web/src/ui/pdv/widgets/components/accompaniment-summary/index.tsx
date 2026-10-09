import { useAccompanimentSummary } from './use-accompaniment-summary'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

export type AccompanimentSummaryProps = {
  accompaniments: readonly {
    readonly name: string
    readonly type: string
    readonly basePrice?: number
  }[]
}

export const AccompanimentSummary = ({ accompaniments }: AccompanimentSummaryProps) => {
  const { groups } = useAccompanimentSummary({ accompaniments })
  const formatCurrency = useFormatCurrency()

  if (groups.length === 0) return null

  return (
    <div className='mt-2 space-y-2 text-xs'>
      <p className='font-extrabold text-foreground'>Acompanhamentos</p>
      <dl className='space-y-2'>
        {groups.map((group) => (
          <div key={group.type}>
            <dt className='font-medium text-muted-foreground'>{group.type}</dt>
            <dd className='mt-0.5 break-words font-semibold text-foreground'>
              {group.accompaniments.map((accompaniment, index) => (
                <span className='block' key={`${accompaniment.name}-${index}`}>
                  {accompaniment.name}
                  {accompaniment.basePrice !== undefined
                    ? ` · ${accompaniment.basePrice > 0 ? '+ ' : ''}${formatCurrency(accompaniment.basePrice)}`
                    : ''}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
