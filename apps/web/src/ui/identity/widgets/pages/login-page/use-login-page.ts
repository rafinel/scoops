import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { ROUTES } from '@/constants/routes'
import { useLoginAction } from '@/ui/identity/hooks/use-login-action'
import { showErrorToast } from '@/ui/shared/notifications'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type LoginFormValues = z.infer<typeof loginFormSchema>

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
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return

    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`,
    )
  }, [])

  const { navigateToPath } = useNavigation()
  const { error, isPending, login } = useLoginAction()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const {
    register,
    handleSubmit: submitForm,
    formState: { errors: formErrors },
  } = useForm<LoginFormValues>({
    defaultValues: LOGIN_DEFAULT_VALUES,
    resolver: zodResolver(loginFormSchema),
  })

  async function handleSubmit(values: LoginFormValues) {
    try {
      await login({ email: values.identifier.trim(), password: values.password })
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
