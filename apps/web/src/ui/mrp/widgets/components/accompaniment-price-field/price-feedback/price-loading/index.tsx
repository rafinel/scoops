export type PriceLoadingProps = Record<string, never>

export const PriceLoading = (_props: PriceLoadingProps) => (
  <span aria-live='polite' className='text-xs text-muted-foreground' role='status'>
    Carregando preço do acompanhamento…
  </span>
)
