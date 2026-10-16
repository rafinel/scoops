export type CostEstimateDetailsProps = {
  formattedQuantity: string
  formattedUnitCost: string
  hasDetails: boolean
  unit: string
}

export const CostEstimateDetails = ({
  formattedQuantity,
  formattedUnitCost,
  hasDetails,
  unit,
}: CostEstimateDetailsProps) => (
  <p
    className='break-words text-xs text-muted-foreground sm:text-right'
    hidden={!hasDetails}
  >
    {formattedQuantity} × R$ {formattedUnitCost}/{unit}
  </p>
)
