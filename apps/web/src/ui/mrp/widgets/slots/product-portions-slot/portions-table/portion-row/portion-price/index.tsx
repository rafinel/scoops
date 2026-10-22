export type PortionPriceProps = {
  formatCurrency: (value: number) => string
  salePrice: number | null
}

export const PortionPrice = ({ formatCurrency, salePrice }: PortionPriceProps) => {
  if (salePrice === null) {
    return <span className='font-medium text-muted-foreground'>Não configurado</span>
  }
  return <>{salePrice === 0 ? 'Grátis' : formatCurrency(salePrice)}</>
}
