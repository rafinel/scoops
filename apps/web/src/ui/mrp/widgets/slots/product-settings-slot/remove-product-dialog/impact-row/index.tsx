export type ImpactRowProps = {
  label: string
  value: number
}

export const ImpactRow = ({ label, value }: ImpactRowProps) => (
  <div className='flex items-center justify-between gap-4 border-t border-border-soft pt-2 first:border-t-0 first:pt-0'>
    <span className='text-sm text-muted-foreground'>{label}</span>
    <strong className='text-sm'>{value}</strong>
  </div>
)
