import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { invitationCorrectionFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

type InvitationCorrectionFormValues = z.infer<typeof invitationCorrectionFormSchema>

export function useInvitationCorrectionDialog({
  email,
  name,
  onSubmit,
}: {
  email: string
  name: string
  onSubmit: (input: { name: string; email: string }) => Promise<void>
}) {
  const form = useForm<z.infer<typeof invitationCorrectionFormSchema>>({
    defaultValues: { email, name },
    resolver: zodResolver(invitationCorrectionFormSchema),
  })
  const { reset } = form

  useEffect(() => {
    reset({ email, name })
  }, [email, name, reset])

  async function handleSubmit(values: InvitationCorrectionFormValues) {
    await onSubmit({ email: values.email.trim(), name: values.name.trim() })
  }

  return { ...form, handleSubmit: form.handleSubmit(handleSubmit) }
}
