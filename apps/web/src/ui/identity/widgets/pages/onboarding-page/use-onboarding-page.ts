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
  clearOnboardingSession,
} from '@/ui/identity/storage/onboarding-session-storage'

import {
  onboardingEmailCorrectionFormSchema,
  onboardingRegistrationFormSchema,
  type OnboardingEmailCorrectionFormValues,
  type OnboardingRegistrationFormValues,
} from './onboarding-form-schemas'
import { useOnboardingTelemetry } from './use-onboarding-telemetry'

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
  const telemetry = useOnboardingTelemetry()
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
    return initializeOnboardingRestoration({
      generationRef,
      getIceCreamShopOnboarding,
      setContinuationToken,
      setOnboarding,
      setState,
      telemetry,
    })
  }, [])

  const registrationContext = {
    generationRef,
    register: registerAction.registerIceCreamShop,
    registrationForm,
    setError,
    setState,
    setContinuationToken,
    setOnboarding,
    setIsPasswordVisible,
    telemetry,
  }
  const updateContext = { generationRef, setOnboarding, setState, setError, telemetry }
  const resendContext = {
    ...updateContext,
    resendConfirmation: resendAction.resendIceCreamShopConfirmation,
    setFeedbackMessage,
  }
  const correctionContext = {
    ...updateContext,
    correctEmail: correctAction.correctIceCreamShopOnboardingEmail,
    resetForm: correctionForm.reset,
  }

  async function handleSubmit(form: OnboardingRegistrationFormValues) {
    await submitOnboardingRegistration(form, registrationContext)
  }

  async function handleResend() {
    await resendOnboardingConfirmation(continuationToken, resendContext)
  }

  async function handleCorrectionSubmit(correction: OnboardingEmailCorrectionFormValues) {
    await correctOnboardingEmail(continuationToken, correction, correctionContext)
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
    telemetry.restart()
    clearOnboardingSession()
    setContinuationToken(null)
    setOnboarding(null)
    setError(null)
    setState('form')
  }

  function handleInvalidRegistration(errors: typeof registrationForm.formState.errors) {
    telemetry.recordInvalidRegistration(errors)
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
      (state === 'restoring' || state === 'expired'
        ? statusAction.error?.message
        : null) ??
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

type OnboardingTelemetry = ReturnType<typeof useOnboardingTelemetry>
type GenerationRef = { current: number }
type OnboardingSetter = (value: PendingIceCreamShopOnboarding | null) => void
type OnboardingStateSetter = (value: OnboardingPageState) => void
type OnboardingRestorationContext = {
  generationRef: GenerationRef
  getIceCreamShopOnboarding: ReturnType<
    typeof useGetIceCreamShopOnboardingAction
  >['getIceCreamShopOnboarding']
  setContinuationToken: (value: string | null) => void
  setOnboarding: OnboardingSetter
  setState: OnboardingStateSetter
  telemetry: OnboardingTelemetry
}

function initializeOnboardingRestoration(
  context: OnboardingRestorationContext,
): (() => void) | undefined {
  const stored = loadOnboardingSession()
  if (!stored) return startFreshOnboarding(context.telemetry)
  return restoreStoredOnboarding(stored, context)
}

function startFreshOnboarding(telemetry: OnboardingTelemetry): () => void {
  telemetry.startFresh()
  return () => telemetry.endIfUnregistered()
}

function restoreStoredOnboarding(
  stored: NonNullable<ReturnType<typeof loadOnboardingSession>>,
  context: OnboardingRestorationContext,
): () => void {
  const generation = ++context.generationRef.current
  prepareStoredOnboarding(stored, context)
  void context
    .getIceCreamShopOnboarding(stored.continuationToken)
    .then((next) => handleRestoredOnboarding(next, stored, generation, context))
    .catch(() => handleOnboardingRestorationFailure(generation, context))
  return () => endOnboardingRestoration(context)
}

function prepareStoredOnboarding(
  stored: NonNullable<ReturnType<typeof loadOnboardingSession>>,
  context: OnboardingRestorationContext,
): void {
  context.setContinuationToken(stored.continuationToken)
  context.setOnboarding(stored.onboarding)
  context.setState('restoring')
}

function handleRestoredOnboarding(
  next: PendingIceCreamShopOnboarding,
  stored: NonNullable<ReturnType<typeof loadOnboardingSession>>,
  generation: number,
  context: OnboardingRestorationContext,
): void {
  if (!isCurrentOnboardingGeneration(generation, context.generationRef)) return
  context.setOnboarding(next)
  restoreOrExpireOnboarding(next, stored, context)
}

function restoreOrExpireOnboarding(
  next: PendingIceCreamShopOnboarding,
  stored: NonNullable<ReturnType<typeof loadOnboardingSession>>,
  context: OnboardingRestorationContext,
): void {
  if (isOnboardingExpired(next)) {
    expireRestoredOnboarding(context.setState)
    return
  }
  continueOnboardingRestoration(next, stored, context)
}

function continueOnboardingRestoration(
  next: PendingIceCreamShopOnboarding,
  stored: NonNullable<ReturnType<typeof loadOnboardingSession>>,
  context: OnboardingRestorationContext,
): void {
  context.telemetry.restore(stored.analyticsOccurrenceId)
  context.telemetry.markRegistrationPending()
  context.telemetry.persistPending(stored.continuationToken, next)
  context.setState('pending')
}

function isCurrentOnboardingGeneration(generation: number, generationRef: GenerationRef) {
  return generation === generationRef.current
}

function isOnboardingExpired(onboarding: PendingIceCreamShopOnboarding): boolean {
  return onboarding.expiresAt.getTime() <= Date.now()
}

function expireRestoredOnboarding(setState: OnboardingStateSetter): void {
  clearOnboardingSession()
  setState('expired')
}

function handleOnboardingRestorationFailure(
  generation: number,
  context: OnboardingRestorationContext,
): void {
  if (isCurrentOnboardingGeneration(generation, context.generationRef)) {
    expireRestoredOnboarding(context.setState)
  }
}

function endOnboardingRestoration(context: OnboardingRestorationContext): void {
  context.generationRef.current += 1
  context.telemetry.endIfUnregistered()
}

type RegistrationContext = {
  generationRef: GenerationRef
  register: RegisterOnboardingAction
  registrationForm: ReturnType<typeof useForm<OnboardingRegistrationFormValues>>
  setError: (value: string | null) => void
  setState: OnboardingStateSetter
  setContinuationToken: (value: string | null) => void
  setOnboarding: OnboardingSetter
  setIsPasswordVisible: (value: boolean) => void
  telemetry: OnboardingTelemetry
}

async function submitOnboardingRegistration(
  form: OnboardingRegistrationFormValues,
  context: RegistrationContext,
): Promise<void> {
  const attempt = beginOnboardingRegistration(context)
  const generation = context.generationRef.current
  try {
    await completeOnboardingRegistration(form, generation, attempt, context)
  } catch {
    handleOnboardingRegistrationFailure(generation, attempt, context)
  }
}

function handleOnboardingRegistrationFailure(
  generation: number,
  attempt: ReturnType<OnboardingTelemetry['startAttempt']>,
  context: RegistrationContext,
): void {
  context.telemetry.recordSubmissionFailure(attempt)
  if (isCurrentOnboardingGeneration(generation, context.generationRef)) {
    context.setState('error')
  }
}

function beginOnboardingRegistration(context: RegistrationContext) {
  context.setError(null)
  context.generationRef.current += 1
  context.setState('submitting')
  return context.telemetry.startAttempt()
}

async function completeOnboardingRegistration(
  form: OnboardingRegistrationFormValues,
  generation: number,
  attempt: ReturnType<OnboardingTelemetry['startAttempt']>,
  context: RegistrationContext,
): Promise<void> {
  const result = await submitRegistrationRequest(context.register, form)
  recordCompletedRegistration(context.telemetry, attempt, result)
  if (!isCurrentOnboardingGeneration(generation, context.generationRef)) return
  completeSuccessfulRegistration(result, context)
}

type OnboardingUpdateContext = {
  generationRef: GenerationRef
  setOnboarding: OnboardingSetter
  setState: OnboardingStateSetter
  setError: (value: string | null) => void
  telemetry: OnboardingTelemetry
  resetForm?: () => void
}

async function resendOnboardingConfirmation(
  continuationToken: string | null,
  context: OnboardingUpdateContext & {
    resendConfirmation: ReturnType<
      typeof useResendIceCreamShopConfirmationAction
    >['resendIceCreamShopConfirmation']
    setFeedbackMessage: (value: string | null) => void
  },
): Promise<void> {
  if (!continuationToken) return
  const generation = beginOnboardingResend(context)
  await performOnboardingResend(continuationToken, generation, context)
}

async function performOnboardingResend(
  continuationToken: string,
  generation: number,
  context: OnboardingUpdateContext & {
    resendConfirmation: ReturnType<
      typeof useResendIceCreamShopConfirmationAction
    >['resendIceCreamShopConfirmation']
    setFeedbackMessage: (value: string | null) => void
  },
): Promise<void> {
  try {
    const next = await context.resendConfirmation(continuationToken)
    applyOnboardingResendResult(next, continuationToken, generation, context)
  } catch {
    failOnboardingResend(generation, context)
  }
}

function applyOnboardingResendResult(
  next: PendingIceCreamShopOnboarding,
  continuationToken: string,
  generation: number,
  context: OnboardingUpdateContext & {
    setFeedbackMessage: (value: string | null) => void
  },
): void {
  if (!isCurrentOnboardingGeneration(generation, context.generationRef)) return
  applyOnboardingUpdate(next, continuationToken, context)
  context.setFeedbackMessage('Uma nova confirmação foi enviada para seu e-mail.')
}

function beginOnboardingResend(
  context: OnboardingUpdateContext & {
    setFeedbackMessage: (value: string | null) => void
  },
): number {
  context.generationRef.current += 1
  context.setState('resending')
  context.setError(null)
  context.setFeedbackMessage(null)
  return context.generationRef.current
}

function applyOnboardingUpdate(
  next: PendingIceCreamShopOnboarding,
  continuationToken: string,
  context: OnboardingUpdateContext,
): void {
  context.setOnboarding(next)
  context.resetForm?.()
  context.telemetry.persistPending(continuationToken, next)
  context.setState('pending')
}

function failOnboardingResend(
  generation: number,
  context: OnboardingUpdateContext,
): void {
  if (!isCurrentOnboardingGeneration(generation, context.generationRef)) return
  context.setError('Não foi possível reenviar agora.')
  context.setState('pending')
}

async function correctOnboardingEmail(
  continuationToken: string | null,
  correction: OnboardingEmailCorrectionFormValues,
  context: OnboardingUpdateContext & {
    correctEmail: ReturnType<
      typeof useCorrectIceCreamShopOnboardingEmailAction
    >['correctIceCreamShopOnboardingEmail']
  },
): Promise<void> {
  if (!continuationToken) return
  const generation = beginOnboardingCorrection(context)
  try {
    await applyOnboardingCorrection(continuationToken, correction, generation, context)
  } catch {
    failOnboardingCorrection(generation, context)
  }
}

async function applyOnboardingCorrection(
  continuationToken: string,
  correction: OnboardingEmailCorrectionFormValues,
  generation: number,
  context: OnboardingUpdateContext & {
    correctEmail: ReturnType<
      typeof useCorrectIceCreamShopOnboardingEmailAction
    >['correctIceCreamShopOnboardingEmail']
  },
): Promise<void> {
  const next = await context.correctEmail({ continuationToken, ...correction })
  if (isCurrentOnboardingGeneration(generation, context.generationRef)) {
    applyOnboardingUpdate(next, continuationToken, context)
  }
}

function beginOnboardingCorrection(context: OnboardingUpdateContext): number {
  context.generationRef.current += 1
  context.setState('resending')
  context.setError(null)
  return context.generationRef.current
}

function failOnboardingCorrection(
  generation: number,
  context: OnboardingUpdateContext,
): void {
  if (!isCurrentOnboardingGeneration(generation, context.generationRef)) return
  context.setError('Não foi possível atualizar o e-mail.')
  context.setState('correcting')
}

type RegisterOnboardingAction = ReturnType<
  typeof useRegisterIceCreamShopAction
>['registerIceCreamShop']

async function submitRegistrationRequest(
  register: RegisterOnboardingAction,
  form: OnboardingRegistrationFormValues,
): Promise<IceCreamShopOnboardingRegistration> {
  return register({
    establishmentName: form.establishmentName,
    managerName: form.managerName,
    email: form.email,
    password: form.password,
  })
}

function recordCompletedRegistration(
  telemetry: ReturnType<typeof useOnboardingTelemetry>,
  attempt: ReturnType<ReturnType<typeof useOnboardingTelemetry>['startAttempt']>,
  result: IceCreamShopOnboardingRegistration,
): void {
  telemetry.completeRegistration(attempt, result.onboarding.expiresAt.getTime())
}

function completeSuccessfulRegistration(
  result: IceCreamShopOnboardingRegistration,
  context: RegistrationContext,
): void {
  context.telemetry.markRegistrationPending()
  context.registrationForm.reset()
  applySuccessfulRegistration(result, context)
}

function applySuccessfulRegistration(
  result: IceCreamShopOnboardingRegistration,
  context: RegistrationContext,
): void {
  const { continuationToken, onboarding } = result
  context.setContinuationToken(continuationToken)
  context.setOnboarding(onboarding)
  context.setState('pending')
  context.setIsPasswordVisible(false)
  context.telemetry.persistPending(continuationToken, onboarding)
}
