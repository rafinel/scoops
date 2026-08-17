import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { ROUTES } from '@/constants/routes'
import { useLoginAction } from '@/ui/identity/hooks/use-login-action'
import { showErrorToast } from '@/ui/shared/notifications'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type LoginFormValues = {
  identifier: string
  password: string
}

const LOGIN_DEFAULT_VALUES: LoginFormValues = import.meta.env.DEV
  ? {
      identifier: 'manager.seed@scoops.com',
      password: '12345678',
    }
  : {
      identifier: '',
      password: '',
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
    defaultValues: LOGIN_DEFAULT_VALUES,
  })

  async function handleSubmit(values: LoginFormValues) {
    try {
      await login({ identifier: values.identifier.trim(), password: values.password })
      await navigateToPath(returnTo ?? ROUTES.app)
    } catch (caught) {
      showErrorToast(
        caught instanceof Error ? caught.message : 'Não foi possível entrar agora.',
      )
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
