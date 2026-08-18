import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { accountNameFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { useChangeOwnUserNameAction } from '@/ui/identity/hooks/use-change-own-user-name-action'
import { useLogoutAction } from '@/ui/identity/hooks/use-logout-action'
import { showErrorToast } from '@/ui/shared/notifications'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

type AccountNameFormValues = z.infer<typeof accountNameFormSchema>

export function useAccountPage() {
  const { account } = useAuthContext()
  const { changeOwnUserName, error, isPending } = useChangeOwnUserNameAction()
  const { error: logoutError, isPending: isLogoutPending, logout } = useLogoutAction()
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  const {
    register,
    reset,
    setValue,
    watch,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<AccountNameFormValues>({
    defaultValues: { name: '' },
    resolver: zodResolver(accountNameFormSchema),
  })

  const feedbackError = errors.name?.message ?? error?.message ?? null

  useEffect(() => {
    if (feedbackError) feedbackRef.current?.focus()
  }, [feedbackError])

  function handleOpenNameDialog() {
    reset({ name: account?.name ?? '' })
    setAnnouncement('')
    setIsNameDialogOpen(true)
  }

  function handleNameDialogOpenChange(isOpen: boolean) {
    setIsNameDialogOpen(isOpen)
  }

  function handleNameChange(value: string) {
    setValue('name', value, { shouldDirty: true, shouldValidate: true })
  }

  async function handleNameSubmit({ name }: AccountNameFormValues) {
    try {
      await changeOwnUserName(name.trim())
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
    handleNameSubmit: submitForm(handleNameSubmit),
    handleOpenNameDialog,
    isLogoutPending,
    isNameDialogOpen,
    isPending,
    logoutError,
    register,
    name: watch('name'),
  }
}
