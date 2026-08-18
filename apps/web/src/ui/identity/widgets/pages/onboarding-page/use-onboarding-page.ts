import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

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

import {
  onboardingEmailCorrectionFormSchema,
  onboardingRegistrationFormSchema,
  type OnboardingEmailCorrectionFormValues,
  type OnboardingRegistrationFormValues,
} from './onboarding-form-schemas'

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isCorrectionPasswordVisible, setIsCorrectionPasswordVisible] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const generationRef = useRef(0)
  const correctionTriggerRef = useRef<HTMLButtonElement | null>(null)
  const registerAction = useRegisterIceCreamShopAction()
  const statusAction = useGetIceCreamShopOnboardingAction()
  const { getIceCreamShopOnboarding } = statusAction
  const resendAction = useResendIceCreamShopConfirmationAction()
  const correctAction = useCorrectIceCreamShopOnboardingEmailAction()
  const registrationForm = useForm<OnboardingRegistrationFormValues>({
    defaultValues: {
      establishmentName: '',
      managerName: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    },
    resolver: zodResolver(onboardingRegistrationFormSchema),
  })
  const correctionForm = useForm<OnboardingEmailCorrectionFormValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(onboardingEmailCorrectionFormSchema),
  })

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

  async function handleSubmit(form: OnboardingRegistrationFormValues) {
    setError(null)
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
      registrationForm.reset()
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

  async function handleCorrectionSubmit(correction: OnboardingEmailCorrectionFormValues) {
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
      correctionForm.reset()
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
    correctionForm.reset({ email: onboarding?.email ?? '', password: '' })
    setState('correcting')
    setFeedbackMessage(null)
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => correctionForm.setFocus('email'))
    }
  }
  function handleCancelCorrection() {
    correctionForm.reset()
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

  function handleInvalidRegistration(errors: typeof registrationForm.formState.errors) {
    setError(
      errors.passwordConfirmation?.message === 'As senhas precisam ser iguais.'
        ? 'As senhas precisam ser iguais.'
        : 'Preencha os dados obrigatórios para continuar.',
    )
  }

  function updateForm(
    field: keyof OnboardingRegistrationFormValues | 'confirmation',
    value: string,
  ) {
    registrationForm.setValue(
      field === 'confirmation' ? 'passwordConfirmation' : field,
      value,
      { shouldDirty: true, shouldValidate: true },
    )
    setError(null)
    setFeedbackMessage(null)
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
    feedbackMessage,
    isPasswordVisible,
    isCorrectionPasswordVisible,
    correctionTriggerRef,
    togglePasswordVisibility: () => setIsPasswordVisible((visible) => !visible),
    toggleCorrectionPasswordVisibility: () =>
      setIsCorrectionPasswordVisible((visible) => !visible),
    isPending:
      registerAction.isPending ||
      statusAction.isPending ||
      resendAction.isPending ||
      correctAction.isPending,
    registrationErrors: registrationForm.formState.errors,
    registrationRegister: registrationForm.register,
    correctionErrors: correctionForm.formState.errors,
    correctionRegister: correctionForm.register,
    form: {
      ...registrationForm.getValues(),
      confirmation: registrationForm.watch('passwordConfirmation'),
    },
    handleSubmit: registrationForm.handleSubmit(handleSubmit, handleInvalidRegistration),
    handleResend,
    handleCorrectionSubmit: correctionForm.handleSubmit(handleCorrectionSubmit),
    handleStartCorrection,
    handleCancelCorrection,
    handleRestart,
    updateForm,
  }
}
