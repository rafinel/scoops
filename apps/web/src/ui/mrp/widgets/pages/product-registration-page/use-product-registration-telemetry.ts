import { useEffect, useId, useRef } from 'react'
import type { FieldErrors } from 'react-hook-form'

import type {
  ProductTelemetryFieldName,
  WorkflowHandle,
} from '@scoops/core/shared/interfaces'
import {
  ProductCategory,
  type RegisterProductInput,
} from '@scoops/core/mrp/domain/structures'

import type {
  BrandDraft,
  ProductRegistrationFieldErrors,
  ProductRegistrationFormValues,
  SizeDraft,
  SizeFieldErrors,
} from './use-product-registration-page'
import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

function parseBrazilianDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

function getEffectiveProductStockControl(
  values: Pick<ProductRegistrationFormValues, 'categories' | 'stockControl'>,
) {
  return values.categories.includes(ProductCategory.Manufacturable)
    ? 'single'
    : values.stockControl
}

function getInitialProductStock(
  values: ProductRegistrationFormValues,
  stockControl: ProductRegistrationFormValues['stockControl'],
) {
  return stockControl === 'by-brand'
    ? values.brands.reduce((total, brand) => total + getBrandInitialStock(brand), 0)
    : parseBrazilianDecimal(values.initialStock)
}

function getBrandInitialStock(brand: BrandDraft) {
  return (
    (parseBrazilianDecimal(brand.packageQuantity) || 0) *
    (parseBrazilianDecimal(brand.packageCount) || 0)
  )
}

function getInitialProductBrandInputs(
  values: ProductRegistrationFormValues,
  stockControl: ProductRegistrationFormValues['stockControl'],
) {
  return stockControl === 'by-brand'
    ? values.brands.map((brand) => buildProductBrandInput(brand, values.unit))
    : undefined
}

function buildProductBrandInput(
  brand: BrandDraft,
  unit: ProductRegistrationFormValues['unit'],
) {
  return {
    name: brand.name,
    unit,
    ...getProductBrandPackageInput(brand),
    isPrimary: brand.isPrimary,
  }
}

function getProductBrandPackageInput(brand: BrandDraft) {
  const { packageCount, packagePrice, packageQuantity } = brand
  const quantity = parseBrazilianDecimal(packageQuantity)
  return {
    packageQuantity: quantity,
    packageValue: parseBrazilianDecimal(packagePrice),
    initialQuantity: quantity * parseBrazilianDecimal(packageCount),
  }
}

function getCurrentProductUnitCost(
  values: ProductRegistrationFormValues,
  stockControl: ProductRegistrationFormValues['stockControl'],
) {
  return stockControl === 'single' &&
    values.categories.includes(ProductCategory.Ingredient) &&
    values.currentUnitCost.trim() !== ''
    ? parseBrazilianDecimal(values.currentUnitCost)
    : undefined
}

// A sale price field is shown for a Single-stock product (or one forced to Single by
// Manufacturable) with the matching category and no Portion. Hidden fields are neither
// validated nor sent.
export function isSalePriceVisible(
  values: Pick<ProductRegistrationFormValues, 'categories' | 'stockControl'>,
  category: ProductCategory,
): boolean {
  return (
    getEffectiveProductStockControl(values) === 'single' &&
    values.categories.includes(category) &&
    !values.categories.includes(ProductCategory.Portion)
  )
}

function getResalePriceInput(values: ProductRegistrationFormValues) {
  return isSalePriceVisible(values, ProductCategory.Resale) &&
    values.resalePrice.trim() !== ''
    ? { resalePrice: parseBrazilianDecimal(values.resalePrice) }
    : {}
}

function getAccompanimentPriceInput(values: ProductRegistrationFormValues) {
  return isSalePriceVisible(values, ProductCategory.Accompaniment) &&
    values.accompanimentPrice.trim() !== ''
    ? { accompanimentPrice: parseBrazilianDecimal(values.accompanimentPrice) }
    : {}
}

// Rows are sent only while Porção is selected; completely empty rows are omitted.
function getProductRegistrationSizesInput(values: ProductRegistrationFormValues) {
  if (!values.categories.includes(ProductCategory.Portion)) return {}

  const sizes = values.sizes
    .filter((size) => !isEmptySizeDraft(size))
    .map((size) => ({
      name: size.name.trim(),
      quantity: parseBrazilianDecimal(size.quantity),
      price: parseBrazilianDecimal(size.price),
    }))
  return sizes.length > 0 ? { sizes } : {}
}

function isEmptySizeDraft({ name, price, quantity }: SizeDraft) {
  return [name, quantity, price].every((value) => value.trim() === '')
}

function getProductRegistrationPrices(values: ProductRegistrationFormValues) {
  return { ...getResalePriceInput(values), ...getAccompanimentPriceInput(values) }
}

export function buildProductRegistrationInput(
  values: ProductRegistrationFormValues,
): RegisterProductInput {
  const stockControl = getEffectiveProductStockControl(values)
  return {
    ...getProductRegistrationCatalogInput(values, stockControl),
    ...getProductRegistrationSettings(values),
    ...getProductRegistrationStockInput(values, stockControl),
  }
}

function getProductRegistrationCatalogInput(
  values: ProductRegistrationFormValues,
  stockControl: ProductRegistrationFormValues['stockControl'],
) {
  return {
    name: values.name,
    unit: values.unit,
    categories: values.categories,
    stockControl,
    ...getProductRegistrationPrices(values),
    ...getProductRegistrationSizesInput(values),
  }
}

function getProductRegistrationSettings({
  allowNegativeStock,
  idealStock,
}: ProductRegistrationFormValues) {
  return { allowNegativeStock, idealStock: Number(idealStock) }
}

function getProductRegistrationStockInput(
  values: ProductRegistrationFormValues,
  stockControl: ProductRegistrationFormValues['stockControl'],
) {
  return {
    initialStock: getInitialProductStock(values, stockControl),
    currentUnitCost: getCurrentProductUnitCost(values, stockControl),
    brands: getInitialProductBrandInputs(values, stockControl),
  }
}

export function mapProductRegistrationErrors(
  errors: FieldErrors<ProductRegistrationFormValues>,
  brands: BrandDraft[],
  sizes: SizeDraft[],
) {
  return {
    brandErrors: brands.map((_, index) => getProductBrandFieldErrors(errors, index)),
    fieldErrors: getProductScalarFieldErrors(errors),
    sizeErrors: sizes.map((_, index) => getProductSizeFieldErrors(errors, index)),
  }
}

const PRODUCT_REGISTRATION_ERROR_FIELDS = [
  'accompanimentPrice',
  'brands',
  'categories',
  'currentUnitCost',
  'idealStock',
  'initialStock',
  'name',
  'resalePrice',
] as const

function getProductScalarFieldErrors(
  errors: FieldErrors<ProductRegistrationFormValues>,
): ProductRegistrationFieldErrors {
  return Object.fromEntries(
    PRODUCT_REGISTRATION_ERROR_FIELDS.map((field) => [field, errors[field]?.message]),
  ) as ProductRegistrationFieldErrors
}

const PRODUCT_BRAND_ERROR_FIELDS = [
  'name',
  'packageCount',
  'packagePrice',
  'packageQuantity',
] as const

function getProductBrandFieldErrors(
  errors: FieldErrors<ProductRegistrationFormValues>,
  index: number,
) {
  const error = errors.brands?.[index] as
    | Partial<Record<(typeof PRODUCT_BRAND_ERROR_FIELDS)[number], { message?: string }>>
    | undefined
  return Object.fromEntries(
    PRODUCT_BRAND_ERROR_FIELDS.map((field) => [field, error?.[field]?.message]),
  ) as Record<(typeof PRODUCT_BRAND_ERROR_FIELDS)[number], string | undefined>
}

const PRODUCT_SIZE_ERROR_FIELDS = ['name', 'quantity', 'price'] as const

function getProductSizeFieldErrors(
  errors: FieldErrors<ProductRegistrationFormValues>,
  index: number,
): SizeFieldErrors {
  const error = errors.sizes?.[index] as
    | Partial<Record<(typeof PRODUCT_SIZE_ERROR_FIELDS)[number], { message?: string }>>
    | undefined
  return Object.fromEntries(
    PRODUCT_SIZE_ERROR_FIELDS.map((field) => [field, error?.[field]?.message]),
  ) as SizeFieldErrors
}

const PRODUCT_CREATION_SCALAR_FIELDS = [
  'name',
  'unit',
  'categories',
  'stockControl',
  'allowNegativeStock',
  'currentUnitCost',
  'resalePrice',
  'accompanimentPrice',
  'initialStock',
  'idealStock',
] as const satisfies readonly ProductTelemetryFieldName<'product_creation'>[]

const PRODUCT_CREATION_BRAND_FIELDS = [
  'id',
  'name',
  'unit',
  'packageQuantity',
  'packagePrice',
  'packageCount',
  'isPrimary',
] as const

function getProductCreationScalarErrorFields(
  errors: FieldErrors<ProductRegistrationFormValues>,
) {
  return PRODUCT_CREATION_SCALAR_FIELDS.filter((field) => Boolean(errors[field]))
}

function getProductCreationBrandErrorFields(
  errors: FieldErrors<ProductRegistrationFormValues>,
) {
  const brandError = errors.brands
  return [
    ...(brandError?.message ? (['brands'] as const) : []),
    ...PRODUCT_CREATION_BRAND_FIELDS.filter((field) =>
      hasProductCreationBrandFieldError(brandError, field),
    ).map((field) => `brands.*.${field}` as const),
  ] as ProductTelemetryFieldName<'product_creation'>[]
}

function getProductCreationSizeErrorFields(
  errors: FieldErrors<ProductRegistrationFormValues>,
) {
  const sizeErrors = Array.isArray(errors.sizes) ? errors.sizes : []
  return PRODUCT_SIZE_ERROR_FIELDS.filter((field) =>
    sizeErrors.some((item) => Boolean(item?.[field])),
  ).map((field) => `sizes.*.${field}` as const)
}

function hasProductCreationBrandFieldError(
  error: FieldErrors<ProductRegistrationFormValues>['brands'],
  field: (typeof PRODUCT_CREATION_BRAND_FIELDS)[number],
) {
  return (
    Array.isArray(error) &&
    error.some((item) => Boolean((item as Record<string, unknown> | undefined)?.[field]))
  )
}

function getProductRegistrationTelemetryFields(
  errors: FieldErrors<ProductRegistrationFormValues>,
):
  | readonly [
      ProductTelemetryFieldName<'product_creation'>,
      ...ProductTelemetryFieldName<'product_creation'>[],
    ]
  | undefined {
  const fields: ProductTelemetryFieldName<'product_creation'>[] = [
    ...getProductCreationScalarErrorFields(errors),
    ...getProductCreationBrandErrorFields(errors),
    ...getProductCreationSizeErrorFields(errors),
  ]
  const [firstField, ...remainingFields] = fields
  return firstField ? [firstField, ...remainingFields] : undefined
}

export function useProductRegistrationTelemetry() {
  const analytics = useAnalyticsContext()
  const analyticsRef = useRef(analytics)
  analyticsRef.current = analytics
  const entryKey = useId()
  const workflowRef = useProductRegistrationWorkflow(analyticsRef, entryKey)
  return createProductRegistrationTelemetryHandlers(analyticsRef, workflowRef)
}

function useProductRegistrationWorkflow(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  entryKey: string,
) {
  const workflowRef = useRef<WorkflowHandle<'product_creation'> | undefined>(undefined)
  useEffect(
    () => startProductRegistrationWorkflow(analyticsRef, workflowRef, entryKey),
    [analyticsRef, entryKey],
  )
  return workflowRef
}

function startProductRegistrationWorkflow(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  workflowRef: { current: WorkflowHandle<'product_creation'> | undefined },
  entryKey: string,
) {
  const workflow = analyticsRef.current.startWorkflow({
    workflow: 'product_creation',
    entryKey,
  })
  workflowRef.current = workflow
  return () => endProductRegistrationWorkflow(analyticsRef, workflowRef, workflow)
}

function endProductRegistrationWorkflow(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  workflowRef: { current: WorkflowHandle<'product_creation'> | undefined },
  workflow: WorkflowHandle<'product_creation'>,
) {
  analyticsRef.current.endWorkflow({ workflow })
  workflowRef.current = undefined
}

function createProductRegistrationTelemetryHandlers(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  workflowRef: { current: WorkflowHandle<'product_creation'> | undefined },
) {
  return {
    startAttempt: () => {
      const workflow = workflowRef.current
      return workflow ? analyticsRef.current.startAttempt({ workflow }) : undefined
    },
    recordInvalidSubmit: (errors: FieldErrors<ProductRegistrationFormValues>) => {
      const workflow = workflowRef.current
      if (!workflow) return
      const attempt = analyticsRef.current.startAttempt({ workflow })
      const fields = getProductRegistrationTelemetryFields(errors)
      if (fields) analyticsRef.current.recordValidationFailure({ attempt, fields })
    },
  }
}
