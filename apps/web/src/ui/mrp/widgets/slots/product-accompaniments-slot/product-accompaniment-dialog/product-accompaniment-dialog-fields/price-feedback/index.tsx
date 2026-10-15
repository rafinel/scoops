import { PriceLoadError } from '../price-load-error'
import { PriceLoading } from '../price-loading'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceFeedbackProps = {
  state: ProductAccompanimentDialogState
}

export const PriceFeedback = ({ state }: PriceFeedbackProps) => (
  <>
    {state.accompanimentPriceLoading ? <PriceLoading /> : null}
    {state.accompanimentPriceError ? (
      <PriceLoadError onRetry={state.retryAccompanimentPrice} />
    ) : null}
    {state.errors.accompanimentPrice ? (
      <span
        className='text-sm font-semibold text-destructive'
        id='accompaniment-price-validation-error'
        role='alert'
      >
        {state.errors.accompanimentPrice.message}
      </span>
    ) : null}
  </>
)
