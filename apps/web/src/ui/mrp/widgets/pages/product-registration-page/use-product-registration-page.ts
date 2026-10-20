import { useRef, useState, type BaseSyntheticEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'

import type { ProductStockControl, ProductUnit } from '@scoops/core/mrp/domain/structures'
import { productRegistrationFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import type { z } from 'zod'

import { productDetailsRoute } from '@/constants/routes'
import { useRegisterProductAction } from '@/ui/mrp/hooks/use-register-product-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import * as ProductRegistrationTelemetry from './use-product-registration-telemetry'

export type ProductRegistrationFormValues = z.infer<typeof productRegistrationFormSchema>

export type BrandDraft = ProductRegistrationFormValues['brands'][number]

export type SizeDraft = ProductRegistrationFormValues['sizes'][number]

export type SizeFieldErrors = {
  name?: string
  price?: string
  quantity?: string
}

export type ProductSizeFieldsModel = {
  onAddSize: () => void
  onRemoveSize: (sizeId: string) => void
  onSizeChange: (sizeId: string, changes: Partial<SizeDraft>) => void
  sizeErrors: SizeFieldErrors[]
  sizes: SizeDraft[]
  unit: ProductUnit
}

export type ProductRegistrationFieldErrors = {
  accompanimentPrice?: string
  brands?: string
  categories?: string
  currentUnitCost?: string
  idealStock?: string
  initialStock?: string
  name?: string
  resalePrice?: string
}

const PRODUCT_REGISTRATION_DEFAULT_VALUES: ProductRegistrationFormValues = {
  name: '',
  unit: 'un',
  categories: [],
  stockControl: 'single',
  allowNegativeStock: false,
  currentUnitCost: '',
  resalePrice: '',
  accompanimentPrice: '',
  initialStock: '0',
  idealStock: '0',
  brands: [],
  sizes: [createSizeDraft('size-0')],
}

function createSizeDraft(id: string): SizeDraft {
  return { id, name: '', quantity: '', price: '' }
}

function createBrandDraft(id: string, unit: ProductUnit, isPrimary = false): BrandDraft {
  return {
    id,
    name: '',
    unit,
    packageQuantity: '1',
    packagePrice: '0,00',
    packageCount: '0',
    isPrimary,
  }
}

function parseBrazilianDecimal(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

export function useProductRegistrationPage() {
  const { isPending, registerProduct } = useRegisterProductAction()
  const telemetry = ProductRegistrationTelemetry.useProductRegistrationTelemetry()
  const { navigateTo, navigateToPath } = useNavigation()
  const nextBrandId = useRef(1)
  const nextSizeId = useRef(1)
  const isSubmitting = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    setValue,
    watch,
    handleSubmit: submitForm,
    formState: { errors, isSubmitted },
  } = useForm<ProductRegistrationFormValues>({
    defaultValues: PRODUCT_REGISTRATION_DEFAULT_VALUES,
    resolver: zodResolver(productRegistrationFormSchema),
  })
  const name = watch('name')
  const unit = watch('unit')
  const categories = watch('categories')
  const stockControl = watch('stockControl')
  const allowNegativeStock = watch('allowNegativeStock')
  const initialStock = watch('initialStock')
  const idealStock = watch('idealStock')
  const currentUnitCost = watch('currentUnitCost')
  const resalePrice = watch('resalePrice')
  const accompanimentPrice = watch('accompanimentPrice')
  const brands = watch('brands')
  const sizes = watch('sizes')
  const isSizesSectionVisible = categories.includes(ProductCategory.Portion)
  const isResalePriceVisible = ProductRegistrationTelemetry.isSalePriceVisible(
    { categories, stockControl },
    ProductCategory.Resale,
  )
  const isAccompanimentPriceVisible = ProductRegistrationTelemetry.isSalePriceVisible(
    { categories, stockControl },
    ProductCategory.Accompaniment,
  )
  const calculatedInitialStock = brands.reduce(
    (total, brand) =>
      total +
      (parseBrazilianDecimal(brand.packageQuantity) || 0) *
        (parseBrazilianDecimal(brand.packageCount) || 0),
    0,
  )
  const { brandErrors, fieldErrors, sizeErrors } =
    ProductRegistrationTelemetry.mapProductRegistrationErrors(errors, brands, sizes)

  function clearFormError() {
    setFormError(null)
  }

  function setFormValue<FieldName extends keyof ProductRegistrationFormValues>(
    fieldName: FieldName,
    value: ProductRegistrationFormValues[FieldName],
    shouldValidate = true,
  ) {
    setValue(fieldName as never, value as never, {
      shouldDirty: true,
      shouldValidate,
    })
    clearFormError()
  }

  function handleNameChange(value: string) {
    setFormValue('name', value)
  }

  function handleUnitChange(value: ProductUnit) {
    setFormValue('unit', value)
  }

  const registrationPageModel = {
    accompanimentPrice,
    allowNegativeStock,
    brandErrors,
    brands,
    calculatedInitialStock,
    categories,
    currentUnitCost,
    fieldErrors,
    formError,
    idealStock,
    initialStock,
    isAccompanimentPriceVisible,
    isPending,
    isResalePriceVisible,
    isSizesSectionVisible,
    name,
    register,
    resalePrice,
    stockControl,
    unit,
    handleAddBrand,
    handleAllowNegativeStockChange,
    handleBrandChange,
  }

  function handleProductCategoryToggle(category: ProductCategory) {
    const nextCategories = categories.includes(category)
      ? categories.filter((item) => item !== category)
      : [...categories, category]
    let compatibleCategories = nextCategories
    if (category === ProductCategory.Portion) {
      compatibleCategories = nextCategories.filter(
        (item) => item !== ProductCategory.Resale,
      )
    }
    if (category === ProductCategory.Resale) {
      compatibleCategories = nextCategories.filter(
        (item) => item !== ProductCategory.Portion,
      )
    }
    setFormValue('categories', compatibleCategories)
    if (
      category === ProductCategory.Manufacturable &&
      compatibleCategories.includes(category)
    ) {
      setFormValue('stockControl', 'single')
    }
  }

  function handleStockControlChange(value: ProductStockControl) {
    if (value === 'by-brand' && categories.includes(ProductCategory.Manufacturable))
      return

    setFormValue('stockControl', value)
    if (value === 'by-brand' && brands.length === 0) {
      const brand = createBrandDraft(`brand-${nextBrandId.current++}`, unit, true)
      setFormValue('brands', [brand])
    }
  }

  function handleAllowNegativeStockChange(value: boolean) {
    setFormValue('allowNegativeStock', value)
  }

  function handleInitialStockChange(value: string) {
    setFormValue('initialStock', value)
  }

  function handleIdealStockChange(value: string) {
    setFormValue('idealStock', value)
  }

  function handleCurrentUnitCostChange(value: string) {
    setFormValue('currentUnitCost', value)
  }

  function handleResalePriceChange(value: string) {
    setFormValue('resalePrice', value)
  }

  function handleAccompanimentPriceChange(value: string) {
    setFormValue('accompanimentPrice', value)
  }

  function handleBrandChange(brandId: string, changes: Partial<BrandDraft>) {
    const nextBrands = brands.map((brand) =>
      brand.id === brandId ? { ...brand, ...changes } : brand,
    )
    setFormValue('brands', nextBrands)
  }

  function handlePrimaryBrandChange(brandId: string) {
    setFormValue(
      'brands',
      brands.map((brand) => ({ ...brand, isPrimary: brand.id === brandId })),
    )
  }

  function handleAddBrand() {
    const brand = createBrandDraft(`brand-${nextBrandId.current++}`, unit)
    setFormValue('brands', [...brands, brand])
  }

  function handleRemoveBrand(brandId: string) {
    if (brands.length <= 1) return
    const wasPrimary = brands.find((brand) => brand.id === brandId)?.isPrimary
    const remainingBrands = brands.filter((brand) => brand.id !== brandId)
    const nextBrands = wasPrimary
      ? remainingBrands.map((brand, index) => ({ ...brand, isPrimary: index === 0 }))
      : remainingBrands
    setFormValue('brands', nextBrands)
  }

  function handleAddSize() {
    const size = createSizeDraft(`size-${nextSizeId.current++}`)
    setFormValue('sizes', [...sizes, size], isSubmitted)
  }

  function handleSizeChange(sizeId: string, changes: Partial<SizeDraft>) {
    setFormValue(
      'sizes',
      sizes.map((size) => (size.id === sizeId ? { ...size, ...changes } : size)),
      isSubmitted,
    )
  }

  function handleRemoveSize(sizeId: string) {
    setFormValue(
      'sizes',
      sizes.filter((size) => size.id !== sizeId),
      isSubmitted,
    )
  }

  function isCategoryDisabled(category: ProductCategory) {
    return (
      (category === ProductCategory.Portion &&
        categories.includes(ProductCategory.Resale)) ||
      (category === ProductCategory.Resale &&
        categories.includes(ProductCategory.Portion))
    )
  }

  async function handleRegister(values: ProductRegistrationFormValues) {
    clearFormError()
    const input = ProductRegistrationTelemetry.buildProductRegistrationInput(values)

    try {
      const attempt = telemetry.startAttempt()
      const product = await registerProduct(input, attempt)
      await navigateToPath(productDetailsRoute(product.id))
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível criar o produto.',
      )
    } finally {
      isSubmitting.current = false
    }
  }

  function handleInvalidSubmit(errors: FieldErrors<ProductRegistrationFormValues>) {
    isSubmitting.current = false
    telemetry.recordInvalidSubmit(errors)
  }

  function handleFormSubmit(event?: BaseSyntheticEvent) {
    if (isSubmitting.current) {
      event?.preventDefault()
      return
    }

    isSubmitting.current = true
    void submitForm(handleRegister, handleInvalidSubmit)(event)
  }

  function handleCancel() {
    void navigateTo('products')
  }

  const sizeFields: ProductSizeFieldsModel = {
    onAddSize: handleAddSize,
    onRemoveSize: handleRemoveSize,
    onSizeChange: handleSizeChange,
    sizeErrors,
    sizes,
    unit,
  }

  return {
    ...registrationPageModel,
    sizeFields,
    handleAccompanimentPriceChange,
    handleCancel,
    handleCurrentUnitCostChange,
    handleIdealStockChange,
    handleInitialStockChange,
    handleNameChange,
    handlePrimaryBrandChange,
    handleProductCategoryToggle,
    handleRegister: handleFormSubmit,
    handleRemoveBrand,
    handleResalePriceChange,
    handleStockControlChange,
    handleUnitChange,
    isCategoryDisabled,
  }
}
