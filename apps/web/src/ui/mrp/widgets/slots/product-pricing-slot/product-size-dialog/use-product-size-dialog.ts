import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { productSizeFormSchema } from '@scoops/validation'
import type {
  ProductSizePricing,
  RegisterProductSizeInput,
  UpdateProductSizeInput,
} from '@scoops/core/mrp/domain/structures'

import { useRegisterProductSizeAction } from '@/ui/mrp/hooks/use-register-product-size-action'
import { useUpdateProductSizeAction } from '@/ui/mrp/hooks/use-update-product-size-action'
import { formatDecimal } from '@/ui/shared/hooks/use-format-decimal'

type FormValues = z.infer<typeof productSizeFormSchema>

export type UseProductSizeDialogProps = {
  isOpen: boolean
  productId: string
  size?: ProductSizePricing
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function useProductSizeDialog({
  isOpen,
  productId,
  size,
  onOpenChange,
  onSuccess,
}: UseProductSizeDialogProps) {
  const isEdit = Boolean(size)
  const registerAction = useRegisterProductSizeAction(productId)
  const updateAction = useUpdateProductSizeAction(productId)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<FormValues>({
    defaultValues: getDefaultValues(size),
    resolver: zodResolver(productSizeFormSchema),
  })
  const { reset } = form

  useEffect(() => {
    if (!isOpen) return
    reset(getDefaultValues(size))
    setFormError(null)
  }, [isOpen, reset, size])

  async function handleValidSubmit(values: FormValues) {
    setFormError(null)
    try {
      if (values.variant === 'add') {
        const input: RegisterProductSizeInput = {
          name: values.name.trim(),
          quantity: parseNumber(values.quantity),
          price: parseNumber(values.price),
        }
        await registerAction.registerProductSize(input)
      } else if (size) {
        const input: UpdateProductSizeInput = {
          name: values.name.trim(),
          quantity: parseNumber(values.quantity),
          price: parseNumber(values.price),
          isActive: values.isActive,
        }
        await updateAction.updateProductSize({ sizeId: size.size.id, input })
      }
      onOpenChange(false)
      onSuccess()
    } catch (caught) {
      setFormError(
        caught instanceof Error && caught.message
          ? caught.message
          : 'Não foi possível salvar o tamanho. Tente novamente.',
      )
    }
  }

  const isPending = registerAction.isPending || updateAction.isPending

  return {
    errors: form.formState.errors,
    formError,
    handleSubmit: form.handleSubmit(handleValidSubmit),
    isEdit,
    isPending,
    register: form.register,
  }
}

function getDefaultValues(size?: ProductSizePricing): FormValues {
  if (!size) {
    return { variant: 'add', name: '', quantity: '', price: '' }
  }

  return {
    variant: 'edit',
    name: size.size.name,
    quantity: String(size.size.quantity),
    price: formatDecimal(size.size.price),
    isActive: size.size.isActive,
  }
}

function parseNumber(value: string) {
  return Number(value.trim().replace(',', '.'))
}
