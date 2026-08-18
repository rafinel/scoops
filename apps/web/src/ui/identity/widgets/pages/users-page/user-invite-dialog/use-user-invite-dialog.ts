import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { userInviteFormSchema } from '@scoops/validation'

import { UserProfile } from '@scoops/core/identity/domain/structures'

type UseUserInviteDialogInput = {
  open: boolean
  onSubmit: (input: {
    name: string
    email: string
    profile: UserProfile
  }) => Promise<void>
}

type UserInviteFormValues = z.infer<typeof userInviteFormSchema>

export function useUserInviteDialog({ onSubmit }: UseUserInviteDialogInput) {
  const {
    control,
    register,
    setValue,
    reset,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<UserInviteFormValues>({
    defaultValues: {
      name: '',
      email: '',
      profile: UserProfile.Operator,
    },
    resolver: zodResolver(userInviteFormSchema),
  })
  const profile = useWatch({ control, name: 'profile' })

  async function handleSubmit(values: UserInviteFormValues) {
    await onSubmit(values)
    reset({ name: '', email: '', profile: values.profile })
  }

  function handleProfileChange(nextProfile: UserProfile) {
    setValue('profile', nextProfile, { shouldDirty: true, shouldValidate: true })
  }

  return {
    errors,
    handleProfileChange,
    handleSubmit: submitForm(handleSubmit),
    profile,
    register,
  }
}
