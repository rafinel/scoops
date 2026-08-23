import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import type { AccompanimentTypeListItem } from '@scoops/core/mrp/domain/structures'
import { accompanimentTypeFormSchema } from '@scoops/validation'

import { useCreateAccompanimentTypeAction } from '@/ui/mrp/hooks/use-create-accompaniment-type-action'
import { useRenameAccompanimentTypeAction } from '@/ui/mrp/hooks/use-rename-accompaniment-type-action'

type FormValues = z.infer<typeof accompanimentTypeFormSchema>

export function useAccompanimentTypeDialog({
  item,
  onSuccess,
  open,
}: {
  item?: AccompanimentTypeListItem
  onSuccess: () => void
  open: boolean
}) {
  const form = useForm<FormValues>({
    defaultValues: { name: item?.type.name ?? '' },
    resolver: zodResolver(accompanimentTypeFormSchema),
  })
  const createAction = useCreateAccompanimentTypeAction()
  const renameAction = useRenameAccompanimentTypeAction()
  const [actionError, setActionError] = useState<string | null>(null)
  useEffect(() => {
    if (open) {
      form.reset({ name: item?.type.name ?? '' })
      setActionError(null)
    }
  }, [form, item, open])
  async function handleValidSubmit(values: FormValues) {
    try {
      if (item)
        await renameAction.renameAccompanimentType({
          typeId: item.type.id,
          input: values,
        })
      else await createAction.createAccompanimentType(values)
      onSuccess()
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível salvar. Tente novamente.',
      )
    }
  }
  return {
    actionError,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(handleValidSubmit),
    isEdit: Boolean(item),
    isPending: createAction.isPending || renameAction.isPending,
    register: form.register,
  }
}
