export type MetricProps = {
  attention?: boolean
  detail: string
  label: string
  value: string
}

export const Metric = ({ attention, detail, label, value }: MetricProps) => (
  <div
    className={`rounded-2xl p-5 ${attention ? 'bg-warning-soft text-warning' : 'bg-muted'}`}
  >
    <p className='text-xs font-bold tracking-wide uppercase'>{label}</p>
    <p className='mt-2 text-xl font-extrabold'>{value}</p>
    <p className='mt-1 text-xs'>{detail}</p>
  </div>
)
