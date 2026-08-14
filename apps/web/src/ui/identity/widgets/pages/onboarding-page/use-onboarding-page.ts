import { useEffect, useRef, useState } from 'react'

import type {
  IceCreamShopOnboardingRegistration,
  PendingIceCreamShopOnboarding,
} from '@scoops/core/identity/domain/structures'

import { useCorrectIceCreamShopOnboardingEmailAction } from '@/ui/identity/hooks/use-correct-ice-cream-shop-onboarding-email-action'
import { useGetIceCreamShopOnboardingAction } from '@/ui/identity/hooks/use-get-ice-cream-shop-onboarding-action'
import { useRegisterIceCreamShopAction } from '@/ui/identity/hooks/use-register-ice-cream-shop-action'
import { useResendIceCreamShopConfirmationAction } from '@/ui/identity/hooks/use-resend-ice-cream-shop-confirmation-action'
import {
  loadOnboardingSession,
  saveOnboardingSession,
  clearOnboardingSession,
} from '@/ui/identity/storage/onboarding-session-storage'

export type OnboardingPageState =
  | 'form'
  | 'restoring'
  | 'submitting'
  | 'pending'
  | 'correcting'
  | 'resending'
  | 'expired'
  | 'error'

export function useOnboardingPage() {
  const [state, setState] = useState<OnboardingPageState>('form')
  const [onboarding, setOnboarding] = useState<PendingIceCreamShopOnboarding | null>(null)
  const [continuationToken, setContinuationToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    establishmentName: '',
    managerName: '',
    email: '',
    password: '',
    confirmation: '',
  })
  const [correction, setCorrection] = useState({ email: '', password: '' })
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isCorrectionPasswordVisible, setIsCorrectionPasswordVisible] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const generationRef = useRef(0)
  const correctionTriggerRef = useRef<HTMLButtonElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const registerAction = useRegisterIceCreamShopAction()
  const statusAction = useGetIceCreamShopOnboardingAction()
  const { getIceCreamShopOnboarding } = statusAction
  const resendAction = useResendIceCreamShopConfirmationAction()
  const correctAction = useCorrectIceCreamShopOnboardingEmailAction()

  // biome-ignore lint/correctness/useExhaustiveDependencies: restoration runs once on mount
  useEffect(() => {
    const stored = loadOnboardingSession()
    if (!stored) return
    const generation = ++generationRef.current
    setContinuationToken(stored.continuationToken)
    setOnboarding(stored.onboarding)
    setState('restoring')
    void getIceCreamShopOnboarding(stored.continuationToken)
      .then((next) => {
        if (generation !== generationRef.current) return
        setOnboarding(next)
        if (next.expiresAt.getTime() <= Date.now()) {
          clearOnboardingSession()
          setState('expired')
          return
        }
        saveOnboardingSession({
          version: 1,
          continuationToken: stored.continuationToken,
          onboarding: next,
        })
        setState('pending')
      })
      .catch(() => {
        if (generation === generationRef.current) {
          clearOnboardingSession()
          setState('expired')
        }
      })
    return () => {
      generationRef.current += 1
    }
  }, [])

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
    setFeedbackMessage(null)
  }
  function updateCorrection(field: keyof typeof correction, value: string) {
    setCorrection((current) => ({ ...current, [field]: value }))
    setError(null)
    setFeedbackMessage(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (
      !form.establishmentName.trim() ||
      !form.managerName.trim() ||
      !form.email.trim() ||
      form.password.length < 8 ||
      form.password.length > 64 ||
      form.password !== form.confirmation
    ) {
      setError(
        form.password !== form.confirmation
          ? 'As senhas precisam ser iguais.'
          : 'Preencha os dados obrigatórios para continuar.',
      )
      return
    }
    const generation = ++generationRef.current
    setState('submitting')
    try {
      const result: IceCreamShopOnboardingRegistration =
        await registerAction.registerIceCreamShop({
          establishmentName: form.establishmentName,
          managerName: form.managerName,
          email: form.email,
          password: form.password,
        })
      if (generation !== generationRef.current) return
      setForm({
        establishmentName: '',
        managerName: '',
        email: '',
        password: '',
        confirmation: '',
      })
      setContinuationToken(result.continuationToken)
      setOnboarding(result.onboarding)
      setState('pending')
      setIsPasswordVisible(false)
      saveOnboardingSession({
        version: 1,
        continuationToken: result.continuationToken,
        onboarding: result.onboarding,
      })
    } catch {
      if (generation === generationRef.current) setState('error')
    }
  }

  async function handleResend() {
    if (!continuationToken) return
    const generation = ++generationRef.current
    setState('resending')
    setError(null)
    setFeedbackMessage(null)
    try {
      const next = await resendAction.resendIceCreamShopConfirmation(continuationToken)
      if (generation !== generationRef.current) return
      setOnboarding(next)
      saveOnboardingSession({ version: 1, continuationToken, onboarding: next })
      setState('pending')
      setFeedbackMessage('Uma nova confirmação foi enviada para seu e-mail.')
    } catch {
      if (generation === generationRef.current) {
        setError('Não foi possível reenviar agora.')
        setState('pending')
      }
    }
  }

  async function handleCorrectionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!continuationToken) return
    const generation = ++generationRef.current
    setState('resending')
    setError(null)
    try {
      const next = await correctAction.correctIceCreamShopOnboardingEmail({
        continuationToken,
        email: correction.email,
        password: correction.password,
      })
      if (generation !== generationRef.current) return
      setOnboarding(next)
      setCorrection({ email: '', password: '' })
      saveOnboardingSession({ version: 1, continuationToken, onboarding: next })
      setState('pending')
    } catch {
      if (generation === generationRef.current) {
        setError('Não foi possível atualizar o e-mail.')
        setState('correcting')
      }
    }
  }

  function handleStartCorrection() {
    setCorrection({ email: onboarding?.email ?? '', password: '' })
    setState('correcting')
    setFeedbackMessage(null)
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => emailInputRef.current?.focus())
    }
  }
  function handleCancelCorrection() {
    setCorrection({ email: '', password: '' })
    setIsCorrectionPasswordVisible(false)
    setFeedbackMessage(null)
    setState('pending')
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => correctionTriggerRef.current?.focus())
    }
  }
  function handleRestart() {
    generationRef.current += 1
    clearOnboardingSession()
    setContinuationToken(null)
    setOnboarding(null)
    setError(null)
    setState('form')
  }

  return {
    state,
    error:
      error ??
      registerAction.error?.message ??
      statusAction.error?.message ??
      resendAction.error?.message ??
      correctAction.error?.message ??
      null,
    onboarding,
    continuationToken,
    form,
    correction,
    feedbackMessage,
    isPasswordVisible,
    isCorrectionPasswordVisible,
    correctionTriggerRef,
    emailInputRef,
    togglePasswordVisibility: () => setIsPasswordVisible((visible) => !visible),
    toggleCorrectionPasswordVisibility: () =>
      setIsCorrectionPasswordVisible((visible) => !visible),
    isPending:
      registerAction.isPending ||
      statusAction.isPending ||
      resendAction.isPending ||
      correctAction.isPending,
    updateForm,
    updateCorrection,
    handleSubmit,
    handleResend,
    handleCorrectionSubmit,
    handleStartCorrection,
    handleCancelCorrection,
    handleRestart,
  }
}
