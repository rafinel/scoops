import { useState, type FormEvent } from 'react'

import { ROUTES } from '@/constants/routes'
import { useLoginAction } from '@/ui/identity/hooks/use-login-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useLoginPage(returnTo?: string) {
  const { navigateToPath } = useNavigation()
  const { error, isPending, login } = useLoginAction()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (!identifier.trim() || !password) {
      setValidationError('Informe seu email e sua senha para continuar.')
      return
    }

    try {
      await login({ identifier: identifier.trim(), password })
      await navigateToPath(returnTo ?? ROUTES.app)
    } catch {
      // The action exposes a neutral visible error state for the form.
    }
  }

  function handleTogglePasswordVisibility() {
    setIsPasswordVisible((isVisible) => !isVisible)
  }

  return {
    error,
    identifier,
    isPasswordVisible,
    isPending,
    password,
    validationError,
    handleIdentifierChange: setIdentifier,
    handlePasswordChange: setPassword,
    handleSubmit,
    handleTogglePasswordVisibility,
  }
}
