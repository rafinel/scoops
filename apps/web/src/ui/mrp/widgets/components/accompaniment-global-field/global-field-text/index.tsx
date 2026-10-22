export type GlobalFieldTextProps = {
  helpId: string
  helpText: string
  labelId: string
}

export const GlobalFieldText = ({ helpId, helpText, labelId }: GlobalFieldTextProps) => (
  <span className='grid gap-0.5'>
    <span className='text-sm font-bold text-foreground' id={labelId}>
      Disponível para todas as porções
    </span>
    <span className='text-xs font-medium text-muted-foreground' id={helpId}>
      {helpText}
    </span>
  </span>
)
