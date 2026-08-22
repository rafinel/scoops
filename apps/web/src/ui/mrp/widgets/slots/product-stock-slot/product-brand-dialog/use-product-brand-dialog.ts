import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'
import { productBrandFormSchema } from '@scoops/validation'

import { useRegisterProductBrandAction } from '@/ui/mrp/hooks/use-register-product-brand-action'
import { useUpdateProductBrandAction } from '@/ui/mrp/hooks/use-update-product-brand-action'
import { showErrorToast } from '@/ui/shared/notifications'

import type { ProductBrandDialogProps } from '.'

type ProductBrandFormValues = z.infer<typeof productBrandFormSchema>

export function useProductBrandDialog({
  brand,
  onOpenChange,
  onSuccess,
  open,
  productId,
  variant,
}: ProductBrandDialogProps) {
  const registerAction = useRegisterProductBrandAction(productId)
  const updateAction = useUpdateProductBrandAction(productId)
  const form = useForm<ProductBrandFormValues>({
    defaultValues: getDefaultValues(variant, brand),
    resolver: zodResolver(productBrandFormSchema),
  })
  const packageQuantity = useWatch({ control: form.control, name: 'packageQuantity' })
  const packageValue = useWatch({ control: form.control, name: 'packageValue' })
  const isPending = registerAction.isPending || updateAction.isPending
  const actionError = registerAction.error ?? updateAction.error
  const unitPrice = calculateUnitPrice(packageValue, packageQuantity)

  useEffect(() => {
    if (open) form.reset(getDefaultValues(variant, brand))
  }, [brand, form, open, variant])

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return
    onOpenChange(nextOpen)
  }

  async function handleValidSubmit(values: ProductBrandFormValues) {
    try {
      if (values.variant === 'add') {
        await registerAction.registerProductBrand({
          name: values.name.trim(),
          packageQuantity: Number(values.packageQuantity),
          packageValue: Number(values.packageValue),
          initialQuantity: Number(values.initialQuantity),
        })
      } else {
        if (!brand) return
        await updateAction.updateProductBrand({
          brandId: brand.brand.id,
          name: values.name.trim(),
          packageQuantity: Number(values.packageQuantity),
          packageValue: Number(values.packageValue),
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch {
      showErrorToast(
        'Não foi possível salvar a marca. Revise os dados e tente novamente.',
      )
    }
  }

  const handleSubmit = form.handleSubmit(handleValidSubmit)

  return {
    actionError,
    errors: form.formState.errors,
    handleOpenChange,
    handleSubmit,
    isPending,
    packageQuantity,
    packageValue,
    unitPrice,
    register: form.register,
  }
}

function getDefaultValues(
  variant: ProductBrandDialogProps['variant'],
  brand?: ProductBrandStock,
): ProductBrandFormValues {
  if (variant === 'edit') {
    return {
      variant: 'edit',
      name: brand?.brand.name ?? '',
      packageQuantity: String(brand?.brand.packageQuantity ?? 1),
      packageValue: String(brand?.brand.packagePrice ?? 0),
    }
  }

  return {
    variant: 'add',
    name: '',
    packageQuantity: '1',
    packageValue: '0',
    initialQuantity: '0',
  }
}

function calculateUnitPrice(packageValue: string, packageQuantity: string) {
  const value = Number(packageValue)
  const quantity = Number(packageQuantity)

  if (!Number.isFinite(value) || !Number.isFinite(quantity) || quantity <= 0) return 0
  return value / quantity
}
