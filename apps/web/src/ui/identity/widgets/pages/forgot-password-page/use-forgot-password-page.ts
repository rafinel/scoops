import { useState, type FormEvent } from 'react'

import { useRequestPasswordRecoveryAction } from '@/ui/identity/hooks/use-request-password-recovery-action'
import { showInfoToast } from '@/ui/shared/notifications'

export function useForgotPasswordPage() {
  const { error, isPending, requestRecovery } = useRequestPasswordRecoveryAction()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (!isValidEmail(email)) {
      setValidationError('Informe um email válido para continuar.')
      return
    }

    try {
      await requestRecovery(email.trim())
      setIsSubmitted(true)
    } catch {
      showInfoToast(
        'Não foi possível concluir agora. Se o endereço for válido, tente novamente mais tarde.',
      )
      setIsSubmitted(true)
    }
  }

  function handleRequestAgain() {
    setIsSubmitted(false)
  }

  return {
    email,
    error,
    isPending,
    isSubmitted,
    validationError,
    handleEmailChange: setEmail,
    handleRequestAgain,
    handleSubmit,
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
