import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { useRequestPasswordRecoveryAction } from '@/ui/identity/hooks/use-request-password-recovery-action'
import { useToast } from '@/ui/shared/hooks/use-toast'

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>

export function useForgotPasswordPage() {
  const { error, isPending, requestRecovery } = useRequestPasswordRecoveryAction()
  const { showInfoToast } = useToast()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    register,
    setValue,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: '' },
    resolver: zodResolver(forgotPasswordFormSchema),
  })

  async function handleSubmit({ email }: ForgotPasswordFormValues) {
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
    error,
    isPending,
    isSubmitted,
    validationError: errors.email?.message ?? null,
    handleRequestAgain,
    handleEmailChange(value: string) {
      setValue('email', value, { shouldDirty: true, shouldValidate: true })
    },
    handleSubmit: submitForm(handleSubmit),
    register,
  }
}
