import { useEffect, useState, type FormEvent } from 'react'
import { useSearch } from '@tanstack/react-router'

import { useAcceptUserInvitationAction } from '@/ui/identity/hooks/use-accept-user-invitation-action'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type State = 'idle' | 'editing' | 'submitting' | 'accepted' | 'error'
const MAX_PASSWORD_LENGTH = 64

export function useAcceptUserInvitationPage() {
  const search = useSearch({ strict: false }) as {
    token?: string
    confirmationToken?: string
  }
  const token = search.confirmationToken ?? search.token ?? ''
  const auth = useAuthContext()
  const acceptance = useAcceptUserInvitationAction()
  const { navigateTo } = useNavigation()
  const [password, setPassword] = useState('')
  const [state, setState] = useState<State>(token ? 'editing' : 'idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) setState('idle')
  }, [token])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setError(null)
    if (password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
      setState('error')
      setError('A senha deve ter entre 8 e 64 caracteres.')
      return
    }
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
    error,
    handleGoToApp,
    password,
    setPassword,
    state,
    submit,
  }
}
