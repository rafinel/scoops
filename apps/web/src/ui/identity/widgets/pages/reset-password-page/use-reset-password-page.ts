import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { showErrorToast } from '@/ui/shared/notifications'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export const MIN_PASSWORD_LENGTH = 8
type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

export function useResetPasswordPage(token?: string) {
  const hasRecoveryToken = Boolean(token)
  const { resetPassword, status: authStatus } = useAuthContext()
  const { navigateTo } = useNavigation()
  const [actionError, setActionError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const {
    register,
    setValue,
    handleSubmit: submitForm,
    formState: { errors: formErrors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: '',
      confirmation: '',
    },
    resolver: zodResolver(resetPasswordFormSchema),
  })

  function handleTogglePasswordVisibility() {
    setIsPasswordVisible((isVisible) => !isVisible)
  }

  function handlePasswordChange(value: string) {
    setValue('password', value, { shouldDirty: true, shouldValidate: true })
  }

  function handleConfirmationChange(value: string) {
    setValue('confirmation', value, { shouldDirty: true, shouldValidate: true })
  }

  function handleToggleConfirmationVisibility() {
    setIsConfirmationVisible((isVisible) => !isVisible)
  }

  async function handleSubmit({ password }: ResetPasswordFormValues) {
    try {
      if (!token) throw new Error('O token de recuperação não foi informado.')
      setActionError(null)
      setIsPending(true)
      await resetPassword(password)
      setIsSuccess(true)
      await navigateTo('login')
    } catch (caught) {
      const error =
        caught instanceof Error
          ? caught
          : new Error('Não foi possível atualizar sua senha.')
      setActionError(error)
      showErrorToast(error.message)
    } finally {
      setIsPending(false)
    }
  }

  const validationError =
    formErrors.password?.message ?? formErrors.confirmation?.message ?? null

  return {
    actionError,
    isPasswordRecovery: hasRecoveryToken && authStatus === 'authenticated',
    isResolving: hasRecoveryToken && authStatus === 'resolving',
    isPasswordVisible,
    isConfirmationVisible,
    isPending,
    isSuccess,
    validationError,
    handleSubmit: submitForm(handleSubmit),
    handleConfirmationChange,
    handlePasswordChange,
    handleTogglePasswordVisibility,
    handleToggleConfirmationVisibility,
    passwordField: register('password'),
    confirmationField: register('confirmation'),
  }
}
