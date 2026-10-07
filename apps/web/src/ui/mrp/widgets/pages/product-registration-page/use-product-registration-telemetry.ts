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
} from './use-product-registration-page'
import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

function parseBrazilianDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

function getEffectiveProductStockControl(values: ProductRegistrationFormValues) {
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

export function buildProductRegistrationInput(
  values: ProductRegistrationFormValues,
): RegisterProductInput {
  const stockControl = getEffectiveProductStockControl(values)
  return {
    ...getProductRegistrationBasics(values, stockControl),
    ...getProductRegistrationSettings(values),
    ...getProductRegistrationStockInput(values, stockControl),
  }
}

function getProductRegistrationBasics(
  { categories, name, unit }: ProductRegistrationFormValues,
  stockControl: ProductRegistrationFormValues['stockControl'],
) {
  return { name, unit, categories, stockControl }
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
) {
  return {
    brandErrors: brands.map((_, index) => getProductBrandFieldErrors(errors, index)),
    fieldErrors: getProductScalarFieldErrors(errors),
  }
}

const PRODUCT_REGISTRATION_ERROR_FIELDS = [
  'brands',
  'categories',
  'currentUnitCost',
  'idealStock',
  'initialStock',
  'name',
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

const PRODUCT_CREATION_SCALAR_FIELDS = [
  'name',
  'unit',
  'categories',
  'stockControl',
  'allowNegativeStock',
  'currentUnitCost',
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
