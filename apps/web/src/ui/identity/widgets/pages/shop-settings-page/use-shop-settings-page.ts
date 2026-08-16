import { useEffect, useRef, useState, type FormEvent } from 'react'

import { useChangeEstablishmentNameAction } from '@/ui/identity/hooks/use-change-establishment-name-action'
import { useEstablishmentSettingsQuery } from '@/ui/identity/hooks/use-establishment-settings-query'
import { showErrorToast } from '@/ui/shared/notifications'

export function useShopSettingsPage() {
  const {
    settings,
    error: queryError,
    isLoading,
    refetch,
  } = useEstablishmentSettingsQuery()
  const {
    changeEstablishmentName,
    error: actionError,
    isPending,
  } = useChangeEstablishmentNameAction()
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const feedbackRef = useRef<HTMLParagraphElement>(null)

  const feedbackError = validationError ?? actionError?.message ?? null

  useEffect(() => {
    if (feedbackError) feedbackRef.current?.focus()
  }, [feedbackError])

  function handleOpenNameDialog() {
    setName(settings?.establishment.name ?? '')
    setValidationError(null)
    setAnnouncement('')
    setIsNameDialogOpen(true)
  }

  function handleNameDialogOpenChange(isOpen: boolean) {
    setIsNameDialogOpen(isOpen)
    if (!isOpen) setValidationError(null)
  }

  function handleNameChange(value: string) {
    setName(value)
    if (validationError) setValidationError(null)
  }

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = name.trim()
    if (!normalizedName) {
      setValidationError('Informe o nome da loja.')
      return
    }

    try {
      await changeEstablishmentName(normalizedName)
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
    handleNameSubmit,
    handleOpenNameDialog,
    isLoading,
    isNameDialogOpen,
    isPending,
    name,
    queryError,
    refetch,
    settings,
  }
}
