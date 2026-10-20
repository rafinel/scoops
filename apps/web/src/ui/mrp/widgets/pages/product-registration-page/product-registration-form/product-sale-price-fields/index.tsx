import type { UseFormRegister } from 'react-hook-form'

import type {
  ProductRegistrationFieldErrors,
  ProductRegistrationFormValues,
} from '../../use-product-registration-page'
import { SalePriceField } from './sale-price-field'

export type ProductSalePriceFieldsProps = {
  accompanimentPrice: string
  fieldErrors: ProductRegistrationFieldErrors
  isAccompanimentPriceVisible: boolean
  isResalePriceVisible: boolean
  onAccompanimentPriceChange: (value: string) => void
  onResalePriceChange: (value: string) => void
  register: UseFormRegister<ProductRegistrationFormValues>
  resalePrice: string
}

export const ProductSalePriceFields = (props: ProductSalePriceFieldsProps) => {
  if (!props.isResalePriceVisible && !props.isAccompanimentPriceVisible) return null

  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {props.isResalePriceVisible ? (
        <SalePriceField
          error={props.fieldErrors.resalePrice}
          idPrefix='resale-price'
          label='Preço de revenda'
          name='resalePrice'
          onChange={props.onResalePriceChange}
          register={props.register}
          value={props.resalePrice}
        />
      ) : null}
      {props.isAccompanimentPriceVisible ? (
        <SalePriceField
          error={props.fieldErrors.accompanimentPrice}
          idPrefix='accompaniment-price'
          label='Preço como acompanhamento'
          name='accompanimentPrice'
          onChange={props.onAccompanimentPriceChange}
          register={props.register}
          value={props.accompanimentPrice}
        />
      ) : null}
    </div>
  )
}
