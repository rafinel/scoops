import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { BrandField } from './brand-field'
import { CostEstimate } from './cost-estimate'
import { PriceField } from './price-field'
import { ProductField } from './product-field'
import { QuantityField } from './quantity-field'
import { TypeField } from './type-field'
import type { ProductAccompanimentDialogState } from '../use-product-accompaniment-dialog'

export type ProductAccompanimentDialogFieldsProps = {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}

export const ProductAccompanimentDialogFields = ({
  item,
  state,
}: ProductAccompanimentDialogFieldsProps) => (
  <div className='grid min-h-0 gap-3 overflow-y-auto p-4 sm:gap-5 sm:p-6'>
    <ProductField item={item} state={state} />
    <TypeField state={state} />
    <BrandField item={item} state={state} />
    <PriceField state={state} />
    <QuantityField item={item} state={state} />
    <CostEstimate item={item} state={state} />
    {state.actionError ? (
      <p className='text-sm font-semibold text-destructive' role='alert'>
        {state.actionError}
      </p>
    ) : null}
  </div>
)
