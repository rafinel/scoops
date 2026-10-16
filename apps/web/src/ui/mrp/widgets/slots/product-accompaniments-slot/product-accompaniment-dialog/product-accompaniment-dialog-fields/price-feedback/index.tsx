import { PriceLoadError } from '../price-load-error'
import { PriceLoading } from '../price-loading'
import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type PriceFeedbackProps = {
  accompanimentPriceError: boolean
  accompanimentPriceLoading: boolean
  priceError?: string
  retryAccompanimentPrice: ProductAccompanimentDialogState['retryAccompanimentPrice']
}

export const PriceFeedback = ({
  accompanimentPriceError,
  accompanimentPriceLoading,
  priceError,
  retryAccompanimentPrice,
}: PriceFeedbackProps) => (
  <>
    {accompanimentPriceLoading ? <PriceLoading /> : null}
    {accompanimentPriceError ? (
      <PriceLoadError onRetry={retryAccompanimentPrice} />
    ) : null}
    {priceError ? (
      <span
        className='text-sm font-semibold text-destructive'
        id='accompaniment-price-validation-error'
        role='alert'
      >
        {priceError}
      </span>
    ) : null}
  </>
)
