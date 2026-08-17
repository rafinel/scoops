import { useEffect, useRef, useState, type FormEvent } from 'react'

import { useChangeOwnUserNameAction } from '@/ui/identity/hooks/use-change-own-user-name-action'
import { useLogoutAction } from '@/ui/identity/hooks/use-logout-action'
import { showErrorToast } from '@/ui/shared/notifications'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export function useAccountPage() {
  const { account } = useAuthContext()
  const { changeOwnUserName, error, isPending } = useChangeOwnUserNameAction()
  const { error: logoutError, isPending: isLogoutPending, logout } = useLogoutAction()
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const feedbackRef = useRef<HTMLParagraphElement>(null)

  const feedbackError = validationError ?? error?.message ?? null

  useEffect(() => {
    if (feedbackError) feedbackRef.current?.focus()
  }, [feedbackError])

  function handleOpenNameDialog() {
    setName(account?.name ?? '')
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
      setValidationError('Informe seu nome completo.')
      return
    }

    try {
      await changeOwnUserName(normalizedName)
      setAnnouncement('Nome atualizado com sucesso.')
      setIsNameDialogOpen(false)
    } catch (caught) {
      showErrorToast(
        caught instanceof Error ? caught.message : 'Não foi possível atualizar seu nome.',
      )
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch (caught) {
      showErrorToast(
        caught instanceof Error ? caught.message : 'Não foi possível sair agora.',
      )
    }
  }

  return {
    account,
    announcement,
    error: feedbackError,
    feedbackRef,
    handleLogout,
    handleNameChange,
    handleNameDialogOpenChange,
    handleNameSubmit,
    handleOpenNameDialog,
    isLogoutPending,
    isNameDialogOpen,
    isPending,
    logoutError,
    name,
  }
}
