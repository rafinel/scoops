export type CostEstimateValueProps = {
  estimate: string
}

export const CostEstimateValue = ({ estimate }: CostEstimateValueProps) => (
  <div>
    <p className='text-xs font-semibold text-muted-foreground'>CUSTO POR PORÇÃO</p>
    <p className='font-extrabold'>{estimate}</p>
  </div>
)
