import { useRef, useState, type BaseSyntheticEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ProductCategory,
  type ProductStockControl,
  type ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import { productRegistrationFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { productDetailsRoute } from '@/constants/routes'
import { useRegisterProductAction } from '@/ui/mrp/hooks/use-register-product-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type ProductRegistrationFormValues = z.infer<typeof productRegistrationFormSchema>

export type BrandDraft = ProductRegistrationFormValues['brands'][number]

export type ProductRegistrationFieldErrors = {
  brands?: string
  categories?: string
  currentUnitCost?: string
  idealStock?: string
  initialStock?: string
  name?: string
}

const PRODUCT_REGISTRATION_DEFAULT_VALUES: ProductRegistrationFormValues = {
  name: '',
  unit: 'un',
  categories: [],
  stockControl: 'single',
  allowNegativeStock: false,
  currentUnitCost: '',
  initialStock: '0',
  idealStock: '0',
  brands: [],
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
  const { isPending, mutateAsync } = useRegisterProductAction()
  const { navigateTo, navigateToPath } = useNavigation()
  const nextBrandId = useRef(1)
  const isSubmitting = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    setValue,
    watch,
    handleSubmit: submitForm,
    formState: { errors },
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
  const brands = watch('brands')
  const calculatedInitialStock = brands.reduce(
    (total, brand) =>
      total +
      (parseBrazilianDecimal(brand.packageQuantity) || 0) *
        (parseBrazilianDecimal(brand.packageCount) || 0),
    0,
  )
  const fieldErrors: ProductRegistrationFieldErrors = {
    brands: errors.brands?.message,
    categories: errors.categories?.message,
    currentUnitCost: errors.currentUnitCost?.message,
    idealStock: errors.idealStock?.message,
    initialStock: errors.initialStock?.message,
    name: errors.name?.message,
  }
  const brandErrors = brands.map((_, index) => {
    const brandError = errors.brands?.[index] as
      | {
          name?: { message?: string }
          packageCount?: { message?: string }
          packagePrice?: { message?: string }
          packageQuantity?: { message?: string }
        }
      | undefined
    return {
      name: brandError?.name?.message,
      packageCount: brandError?.packageCount?.message,
      packagePrice: brandError?.packagePrice?.message,
      packageQuantity: brandError?.packageQuantity?.message,
    }
  })

  function clearFormError() {
    setFormError(null)
  }

  function setFormValue<FieldName extends keyof ProductRegistrationFormValues>(
    fieldName: FieldName,
    value: ProductRegistrationFormValues[FieldName],
  ) {
    setValue(fieldName as never, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    })
    clearFormError()
  }

  function handleNameChange(value: string) {
    setFormValue('name', value)
  }

  function handleUnitChange(value: ProductUnit) {
    setFormValue('unit', value)
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
    const effectiveStockControl = values.categories.includes(
      ProductCategory.Manufacturable,
    )
      ? 'single'
      : values.stockControl
    const nextInitialStock =
      effectiveStockControl === 'by-brand'
        ? values.brands.reduce(
            (total, brand) =>
              total +
              (parseBrazilianDecimal(brand.packageQuantity) || 0) *
                (parseBrazilianDecimal(brand.packageCount) || 0),
            0,
          )
        : parseBrazilianDecimal(values.initialStock)

    try {
      const product = await mutateAsync({
        name: values.name,
        unit: values.unit,
        categories: values.categories,
        stockControl: effectiveStockControl,
        allowNegativeStock: values.allowNegativeStock,
        idealStock: Number(values.idealStock),
        initialStock: nextInitialStock,
        currentUnitCost:
          effectiveStockControl === 'single' &&
          values.categories.includes(ProductCategory.Ingredient) &&
          values.currentUnitCost.trim() !== ''
            ? parseBrazilianDecimal(values.currentUnitCost)
            : undefined,
        brands:
          effectiveStockControl === 'by-brand'
            ? values.brands.map((brand) => ({
                name: brand.name,
                unit: values.unit,
                packageQuantity: parseBrazilianDecimal(brand.packageQuantity),
                packageValue: parseBrazilianDecimal(brand.packagePrice),
                initialQuantity:
                  parseBrazilianDecimal(brand.packageQuantity) *
                  parseBrazilianDecimal(brand.packageCount),
                isPrimary: brand.isPrimary,
              }))
            : undefined,
      })
      await navigateToPath(productDetailsRoute(product.id))
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível criar o produto.',
      )
    } finally {
      isSubmitting.current = false
    }
  }

  function handleInvalidSubmit() {
    isSubmitting.current = false
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

  return {
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
    isPending,
    name,
    register,
    stockControl,
    unit,
    handleAddBrand,
    handleAllowNegativeStockChange,
    handleBrandChange,
    handleCancel,
    handleCurrentUnitCostChange,
    handleIdealStockChange,
    handleInitialStockChange,
    handleNameChange,
    handlePrimaryBrandChange,
    handleProductCategoryToggle,
    handleRegister: handleFormSubmit,
    handleRemoveBrand,
    handleStockControlChange,
    handleUnitChange,
    isCategoryDisabled,
  }
}
