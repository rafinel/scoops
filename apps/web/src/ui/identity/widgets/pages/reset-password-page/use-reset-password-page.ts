import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useResetPasswordAction } from '@/ui/identity/hooks/use-reset-password-action'
import { showErrorToast } from '@/ui/shared/notifications'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 64

type ResetPasswordFormValues = {
  password: string
  confirmation: string
}

export function useResetPasswordPage() {
  const { isPasswordRecovery, status } = useAuthContext()
  const hasRecoveryHash =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'
  const { navigateTo } = useNavigation()
  const { error: actionError, isPending, reset } = useResetPasswordAction()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasResolvedRecoveryHash, setHasResolvedRecoveryHash] = useState(!hasRecoveryHash)

  useEffect(() => {
    if (!hasRecoveryHash || status === 'resolving') return

    // Keep the recovery loading state visible for the first client paint. The
    // route shell is client-only, so a fast anonymous session can otherwise
    // resolve before the reset page mounts and skip this user-facing state.
    const timer = setTimeout(() => setHasResolvedRecoveryHash(true), 500)
    return () => clearTimeout(timer)
  }, [hasRecoveryHash, status])
  const {
    register,
    getValues,
    setValue,
    handleSubmit: submitForm,
    formState: { errors: formErrors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: '',
      confirmation: '',
    },
  })
  const passwordField = register('password', {
    required: 'Informe uma nova senha.',
    minLength: {
      value: MIN_PASSWORD_LENGTH,
      message: 'A senha deve ter entre 8 e 64 caracteres.',
    },
    maxLength: {
      value: MAX_PASSWORD_LENGTH,
      message: 'A senha deve ter entre 8 e 64 caracteres.',
    },
  })
  const confirmationField = register('confirmation', {
    required: 'Confirme sua nova senha.',
    validate: (value) =>
      value === getValues('password') || 'As senhas precisam ser iguais.',
  })

  function handlePasswordChange(value: string) {
    setValue('password', value, { shouldDirty: true, shouldValidate: true })
  }

  function handleConfirmationChange(value: string) {
    setValue('confirmation', value, { shouldDirty: true, shouldValidate: true })
  }

  function handleTogglePasswordVisibility() {
    setIsPasswordVisible((isVisible) => !isVisible)
  }

  function handleToggleConfirmationVisibility() {
    setIsConfirmationVisible((isVisible) => !isVisible)
  }

  async function handleSubmit({ password }: ResetPasswordFormValues) {
    try {
      await reset(password)
      setIsSuccess(true)
      void navigateTo('login')
    } catch (caught) {
      showErrorToast(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível atualizar sua senha.',
      )
    }
  }

  const validationError =
    formErrors.password?.message ?? formErrors.confirmation?.message ?? null

  return {
    actionError,
    isPasswordRecovery,
    isResolving: status === 'resolving' || !hasResolvedRecoveryHash,
    isPasswordVisible,
    isConfirmationVisible,
    isPending,
    isSuccess,
    validationError,
    handleConfirmationChange,
    handlePasswordChange,
    handleSubmit: submitForm(handleSubmit),
    handleTogglePasswordVisibility,
    handleToggleConfirmationVisibility,
    passwordField,
    confirmationField,
  }
}
