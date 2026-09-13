import type { ReactNode } from 'react'

export type HistoryDetailProps = {
  label: string
  value: ReactNode
}

export const HistoryDetail = ({ label, value }: HistoryDetailProps) => (
  <div className='flex justify-between gap-3'>
    <dt className='text-muted-foreground'>{label}</dt>
    <dd className='text-right font-medium'>{value}</dd>
  </div>
)
