import { useState, type FormEvent } from 'react'

import { useResetPasswordAction } from '@/ui/identity/hooks/use-reset-password-action'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 64

export function useResetPasswordPage() {
  const { isPasswordRecovery, status } = useAuthContext()
  const { navigateTo } = useNavigation()
  const { error: actionError, isPending, reset } = useResetPasswordAction()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handlePasswordChange(value: string) {
    setPassword(value)
    setValidationError(null)
  }

  function handleConfirmationChange(value: string) {
    setConfirmation(value)
    setValidationError(null)
  }

  function handleTogglePasswordVisibility() {
    setIsPasswordVisible((isVisible) => !isVisible)
  }

  function handleToggleConfirmationVisibility() {
    setIsConfirmationVisible((isVisible) => !isVisible)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      setValidationError('A senha deve ter entre 8 e 64 caracteres.')
      return
    }

    if (password !== confirmation) {
      setValidationError('As senhas precisam ser iguais.')
      return
    }

    try {
      await reset(password)
      setIsSuccess(true)
      void navigateTo('login')
    } catch {
      // The action exposes the visible neutral failure state.
    }
  }

  return {
    actionError,
    confirmation,
    isPasswordRecovery,
    isResolving: status === 'resolving',
    isPasswordVisible,
    isConfirmationVisible,
    isPending,
    isSuccess,
    password,
    validationError,
    handleConfirmationChange,
    handlePasswordChange,
    handleSubmit,
    handleTogglePasswordVisibility,
    handleToggleConfirmationVisibility,
  }
}
