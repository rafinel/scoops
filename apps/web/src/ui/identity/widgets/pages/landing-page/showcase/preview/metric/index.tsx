export type PreviewMetricProps = {
  label: string
  value: string
  detail: string
}

export const PreviewMetric = ({ label, value, detail }: PreviewMetricProps) => (
  <div className='rounded-xl bg-muted p-4'>
    <p className='text-xs font-medium text-muted-foreground'>{label}</p>
    <p className='mt-2 text-2xl font-extrabold tracking-tight tabular-nums'>{value}</p>
    <p className='mt-2 text-xs leading-relaxed text-muted-foreground'>{detail}</p>
  </div>
)
