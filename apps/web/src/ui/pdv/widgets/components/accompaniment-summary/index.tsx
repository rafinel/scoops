import { useAccompanimentSummary } from './use-accompaniment-summary'

export type AccompanimentSummaryProps = {
  accompaniments: readonly { readonly name: string; readonly type: string }[]
}

export const AccompanimentSummary = ({ accompaniments }: AccompanimentSummaryProps) => {
  const { groups } = useAccompanimentSummary({ accompaniments })

  if (groups.length === 0) return null

  return (
    <div className='mt-2 space-y-2 text-xs'>
      <p className='font-extrabold text-foreground'>Acompanhamentos</p>
      <dl className='space-y-2'>
        {groups.map((group) => (
          <div key={group.type}>
            <dt className='font-medium text-muted-foreground'>{group.type}</dt>
            <dd className='mt-0.5 break-words font-semibold text-foreground'>
              {group.accompaniments
                .map((accompaniment) => accompaniment.name)
                .join(' · ')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
