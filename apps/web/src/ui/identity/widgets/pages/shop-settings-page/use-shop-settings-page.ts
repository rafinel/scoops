import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { shopNameFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { useChangeEstablishmentNameAction } from '@/ui/identity/hooks/use-change-establishment-name-action'
import { useChangeEstablishmentTimezoneAction } from '@/ui/identity/hooks/use-change-establishment-timezone-action'
import { useEstablishmentSettingsQuery } from '@/ui/identity/hooks/use-establishment-settings-query'
import { showErrorToast } from '@/ui/shared/notifications'

type ShopNameFormValues = z.infer<typeof shopNameFormSchema>

export function useShopSettingsPage() {
  const {
    settings,
    error: queryError,
    isLoading,
    isRefreshing,
    refetch,
  } = useEstablishmentSettingsQuery()
  const {
    changeEstablishmentName,
    error: actionError,
    isPending,
  } = useChangeEstablishmentNameAction()
  const timezoneAction = useChangeEstablishmentTimezoneAction()
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [isTimezoneDialogOpen, setIsTimezoneDialogOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  const {
    register,
    reset,
    setValue,
    watch,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<ShopNameFormValues>({
    defaultValues: { name: '' },
    resolver: zodResolver(shopNameFormSchema),
  })

  const feedbackError = errors.name?.message ?? actionError?.message ?? null

  useEffect(() => {
    if (feedbackError) feedbackRef.current?.focus()
  }, [feedbackError])

  function handleOpenNameDialog() {
    reset({ name: settings?.establishment.name ?? '' })
    setAnnouncement('')
    setIsNameDialogOpen(true)
  }

  function handleNameDialogOpenChange(isOpen: boolean) {
    setIsNameDialogOpen(isOpen)
  }

  async function handleTimezoneSubmit(
    timeZone: Parameters<typeof timezoneAction.mutateAsync>[0],
  ) {
    try {
      await timezoneAction.mutateAsync(timeZone)
      setAnnouncement('Fuso horário atualizado com sucesso.')
      setIsTimezoneDialogOpen(false)
    } catch (caught) {
      showErrorToast(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível atualizar o fuso horário.',
      )
    }
  }

  function handleNameChange(value: string) {
    setValue('name', value, { shouldDirty: true, shouldValidate: true })
  }

  async function handleNameSubmit({ name }: ShopNameFormValues) {
    try {
      await changeEstablishmentName(name.trim())
      setAnnouncement('Nome da loja atualizado com sucesso.')
      setIsNameDialogOpen(false)
    } catch (caught) {
      showErrorToast(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível atualizar o nome da loja.',
      )
    }
  }

  return {
    actionError,
    announcement,
    error: feedbackError,
    feedbackRef,
    handleNameChange,
    handleNameDialogOpenChange,
    handleNameSubmit: submitForm(handleNameSubmit),
    handleOpenNameDialog,
    isLoading,
    isRefreshing,
    isNameDialogOpen,
    isTimezoneDialogOpen,
    isPending,
    isTimezonePending: timezoneAction.isPending,
    timezoneError: timezoneAction.error?.message ?? null,
    queryError,
    refetch,
    settings,
    timeZone: settings?.establishment.timeZone ?? null,
    handleOpenTimezoneDialog: () => setIsTimezoneDialogOpen(true),
    handleTimezoneDialogOpenChange: setIsTimezoneDialogOpen,
    handleTimezoneSubmit,
    register,
    name: watch('name'),
  }
}
