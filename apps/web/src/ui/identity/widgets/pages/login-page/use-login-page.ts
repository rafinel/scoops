import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { ROUTES } from '@/constants/routes'
import { useLoginAction } from '@/ui/identity/hooks/use-login-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type LoginFormValues = {
  identifier: string
  password: string
}

export function useLoginPage(returnTo?: string) {
  const { navigateToPath } = useNavigation()
  const { error, isPending, login } = useLoginAction()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const {
    register,
    handleSubmit: submitForm,
    formState: { errors: formErrors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  async function handleSubmit(values: LoginFormValues) {
    try {
      await login({ identifier: values.identifier.trim(), password: values.password })
      await navigateToPath(returnTo ?? ROUTES.app)
    } catch {
      // The action exposes a neutral visible error state for the form.
    }
  }

  const validationError =
    formErrors.identifier?.message ?? formErrors.password?.message ?? null

  function handleTogglePasswordVisibility() {
    setIsPasswordVisible((isVisible) => !isVisible)
  }

  return {
    error,
    isPasswordVisible,
    isPending,
    validationError,
    handleSubmit: submitForm(handleSubmit),
    handleTogglePasswordVisibility,
    register,
  }
}
