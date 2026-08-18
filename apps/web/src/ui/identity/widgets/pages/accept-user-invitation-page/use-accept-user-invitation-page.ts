import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { invitationAcceptanceFormSchema } from '@scoops/validation'
import { useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { useAcceptUserInvitationAction } from '@/ui/identity/hooks/use-accept-user-invitation-action'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type State = 'idle' | 'editing' | 'submitting' | 'accepted' | 'error'
type InvitationAcceptanceFormValues = z.infer<typeof invitationAcceptanceFormSchema>

export function useAcceptUserInvitationPage() {
  const search = useSearch({ strict: false }) as {
    token?: string
    confirmationToken?: string
  }
  const token = search.confirmationToken ?? search.token ?? ''
  const auth = useAuthContext()
  const acceptance = useAcceptUserInvitationAction()
  const { navigateTo } = useNavigation()
  const [state, setState] = useState<State>(token ? 'editing' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    setValue,
    handleSubmit: submitForm,
    watch,
    formState: { errors },
  } = useForm<InvitationAcceptanceFormValues>({
    defaultValues: { password: '' },
    resolver: zodResolver(invitationAcceptanceFormSchema),
  })
  const password = watch('password')

  useEffect(() => {
    if (!token) setState('idle')
  }, [token])

  async function handleSubmit({ password }: InvitationAcceptanceFormValues) {
    if (!token) return
    setError(null)
    setState('submitting')
    try {
      await auth.setInvitationPassword(password)
      await acceptance.acceptUserInvitation({ confirmationToken: token })
      const available = await auth.activateInvitationAcceptance()
      if (!available) throw new Error('A conta não está disponível.')
      setState('accepted')
    } catch (caught) {
      await auth.clearInvitationAcceptance().catch(() => undefined)
      setState('error')
      setError(
        caught instanceof Error ? caught.message : 'Não foi possível ativar o convite.',
      )
    }
  }

  async function handleGoToApp() {
    await navigateTo('app')
  }

  return {
    acceptanceError: acceptance.error,
    error: errors.password?.message ?? error,
    handleGoToApp,
    password,
    register,
    setPassword(value: string) {
      setValue('password', value, { shouldDirty: true, shouldValidate: true })
    },
    state,
    submit: submitForm(handleSubmit),
  }
}
